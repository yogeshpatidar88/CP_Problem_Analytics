// server.js

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
// Use global fetch in Node 18+, only require node-fetch if fetch is undefined
let fetchLib;
try {
    fetchLib = global.fetch || require('node-fetch');
} catch (e) {
    fetchLib = global.fetch;
}
const fetch = fetchLib;

const app = express();

// Configure CORS to allow requests from your frontend's origin
app.use(cors({
    origin: 'http://localhost:3000', // Adjust the origin as needed
    methods: ['GET', 'POST'],
    credentials: true,
}));

app.use(express.json());

// Import routes
const userRoutes = require('./userController');
// Mount user controller at /api to avoid conflict with the explicit /api/users file-listing route
app.use('/api', userRoutes);

// Code execution endpoint
app.post('/api/run-code', (req, res) => {
    const { language, code, input } = req.body;
    
    if (!code) {
        return res.json({ success: false, error: 'No code provided' });
    }

    const tempDir = path.join(__dirname, 'temp');
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }

    const timestamp = Date.now();
    let filename, compiledFile, runCommand;

    if (language === 'cpp') {
        filename = `temp_${timestamp}.cpp`;
        compiledFile = `temp_${timestamp}.exe`;
        const cppFilePath = path.join(tempDir, filename);
        const compiledPath = path.join(tempDir, compiledFile);
        
        // Write code to file
        fs.writeFileSync(cppFilePath, code);
        
        // Compile C++
        exec(`g++ "${cppFilePath}" -o "${compiledPath}"`, (compileError, compileStdout, compileStderr) => {
            if (compileError) {
                // Clean up
                fs.unlinkSync(cppFilePath);
                return res.json({ success: false, error: compileStderr || compileError.message });
            }
            
            // Run compiled program
            const child = exec(`"${compiledPath}"`, { timeout: 5000 }, (runError, runStdout, runStderr) => {
                // Clean up files
                fs.unlinkSync(cppFilePath);
                if (fs.existsSync(compiledPath)) {
                    fs.unlinkSync(compiledPath);
                }
                
                if (runError) {
                    if (runError.killed) {
                        return res.json({ success: false, error: 'Execution timed out (5 seconds)' });
                    }
                    return res.json({ success: false, error: runStderr || runError.message });
                }
                
                res.json({ success: true, output: runStdout });
            });
            
            // Send input to the program
            if (input) {
                child.stdin.write(input);
            }
            child.stdin.end();
        });
        
    } else if (language === 'python') {
        filename = `temp_${timestamp}.py`;
        const pyFilePath = path.join(tempDir, filename);
        
        // Write code to file
        fs.writeFileSync(pyFilePath, code);
        
        // Run Python
        const child = exec(`python "${pyFilePath}"`, { timeout: 5000 }, (runError, runStdout, runStderr) => {
            // Clean up
            fs.unlinkSync(pyFilePath);
            
            if (runError) {
                if (runError.killed) {
                    return res.json({ success: false, error: 'Execution timed out (5 seconds)' });
                }
                return res.json({ success: false, error: runStderr || runError.message });
            }
            
            res.json({ success: true, output: runStdout });
        });
        
        // Send input to the program
        if (input) {
            child.stdin.write(input);
        }
        child.stdin.end();
        
    } else {
        res.json({ success: false, error: 'Unsupported language' });
    }
});

// Endpoint to get a list of all user directories
app.get('/api/users', (req, res) => {
    const usersDirectory = path.join(__dirname, 'users');
    // If users directory doesn't exist, return an empty array rather than throwing
    if (!fs.existsSync(usersDirectory)) {
        console.warn(`Users directory not found at ${usersDirectory} — returning empty list.`);
        return res.json([]);
    }

    fs.readdir(usersDirectory, (err, files) => {
        if (err) {
            console.error("Failed to read users directory:", err);
            return res.status(500).json({ message: "Failed to retrieve user list." });
        }
        const userFolders = files.filter(file => 
            fs.statSync(path.join(usersDirectory, file)).isDirectory()
        );
        res.json(userFolders);
    });
});

// Endpoint to get specific user data files
app.get('/api/users/:username/:filetype', (req, res) => {
    const { username, filetype } = req.params;
    const filePath = path.join(__dirname, 'users', username, `${username}_${filetype}.json`);

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Failed to read file: ${filePath}`, err);
            return res.status(404).json({ message: "File not found." });
        }
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
    });
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Helper to build user data from local files or Codeforces APIs
async function getUserDataCombined(username) {
    const baseDir = path.join(__dirname, 'users', username);
    const fileMap = {
        data: `${username}_data.json`,
        user_rating_history: `${username}_user_rating_history.json`,
        contest_cards: `${username}_contest_cards.json`,
    };

    const result = { data: null, ratingHistory: null, contestCards: null };

    // Try to read local files first
    for (const key of Object.keys(fileMap)) {
        const p = path.join(baseDir, fileMap[key]);
        if (fs.existsSync(p)) {
            try {
                const raw = fs.readFileSync(p, 'utf8');
                result[key === 'user_rating_history' ? 'ratingHistory' : (key === 'contest_cards' ? 'contestCards' : 'data')] = JSON.parse(raw);
            } catch (e) {
                // ignore and fallback to CF
                console.warn(`Failed to parse local file ${p}:`, e.message);
            }
        }
    }

    // If any part missing, fetch from Codeforces
    // Fetch basic user info
    if (!result.data || !result.ratingHistory || !result.contestCards) {
        try {
            const userInfoRes = await fetch(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(username)}`);
            const userInfoJson = await userInfoRes.json();
            const cfUser = (userInfoJson.status === 'OK' && userInfoJson.result && userInfoJson.result[0]) ? userInfoJson.result[0] : null;

            // Fetch submissions to count solved problems if needed
            let solvedCount = 0;
            try {
                const subsRes = await fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(username)}`);
                const subsJson = await subsRes.json();
                if (subsJson.status === 'OK' && Array.isArray(subsJson.result)) {
                    const uniqueSolved = new Set();
                    subsJson.result.forEach(s => {
                        if (s.verdict === 'OK' && s.problem) {
                            uniqueSolved.add(`${s.problem.contestId || ''}-${s.problem.index || ''}`);
                        }
                    });
                    solvedCount = uniqueSolved.size;
                }
            } catch (e) {
                console.warn(`Failed to fetch submissions for ${username}: ${e.message}`);
            }

            // Fetch rating history (contest performances)
            let ratingHistory = [];
            try {
                const ratingRes = await fetch(`https://codeforces.com/api/user.rating?handle=${encodeURIComponent(username)}`);
                const ratingJson = await ratingRes.json();
                if (ratingJson.status === 'OK' && Array.isArray(ratingJson.result)) {
                    ratingHistory = ratingJson.result.map(r => ({
                        contest_date: new Date(r.ratingUpdateTimeSeconds * 1000).toISOString().split('T')[0],
                        final_rating: r.newRating
                    }));
                }
            } catch (e) {
                console.warn(`Failed to fetch rating history for ${username}: ${e.message}`);
            }

            // Build contest cards from rating history
            const contestCards = [];
            try {
                const ratingRes = await fetch(`https://codeforces.com/api/user.rating?handle=${encodeURIComponent(username)}`);
                const ratingJson = await ratingRes.json();
                if (ratingJson.status === 'OK' && Array.isArray(ratingJson.result)) {
                    ratingJson.result.forEach(r => {
                        contestCards.push({
                            contest_name: r.contestName || r.contestName || `contest ${r.contestId}`,
                            contest_rank: r.rank || null,
                            rating_change: (typeof r.newRating === 'number' && typeof r.oldRating === 'number') ? (r.newRating - r.oldRating) : null
                        });
                    });
                }
            } catch (e) {
                console.warn(`Failed to build contest cards for ${username}: ${e.message}`);
            }

            // Fill missing parts only
            if (!result.data) {
                result.data = {
                    username: username,
                    problem_count: solvedCount,
                    average_rating: cfUser && cfUser.rating ? cfUser.rating : null,
                    rating: cfUser && cfUser.rating ? cfUser.rating : null,
                    max_rating: cfUser && (cfUser.maxRating || cfUser.rating) ? (cfUser.maxRating || cfUser.rating) : null,
                    rating_title: cfUser && cfUser.rank ? cfUser.rank : null
                };
            }
            if (!result.ratingHistory) result.ratingHistory = ratingHistory;
            if (!result.contestCards) result.contestCards = contestCards;
        } catch (e) {
            console.warn(`Error fetching Codeforces data for ${username}: ${e.message}`);
        }
    }

    // Ensure defaults
    result.data = result.data || { username };
    result.ratingHistory = Array.isArray(result.ratingHistory) ? result.ratingHistory : [];
    result.contestCards = Array.isArray(result.contestCards) ? result.contestCards : [];

    return result;
}

// Combined compare endpoint returning JSON for both users
app.get('/api/compare/:user1/:user2', async (req, res) => {
    const { user1, user2 } = req.params;
    try {
        const [d1, d2] = await Promise.all([getUserDataCombined(user1), getUserDataCombined(user2)]);
        return res.json({ user1: d1, user2: d2 });
    } catch (e) {
        console.error('Failed to build comparison:', e.message);
        return res.status(500).json({ message: 'Failed to build comparison data.' });
    }
});

// Compare two users using Codeforces API and return combined JSON
app.get('/api/compare/:user1/:user2', async (req, res) => {
    const { user1, user2 } = req.params;

    const fetchUserFromCF = async (username) => {
        try {
            // user.info
            const infoResp = await fetch(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(username)}`);
            const infoJson = await infoResp.json();
            if (infoJson.status !== 'OK' || !infoJson.result || infoJson.result.length === 0) {
                return { username, error: 'User not found' };
            }
            const user = infoJson.result[0];

            // submissions
            const subsResp = await fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(username)}`);
            const subsJson = await subsResp.json();
            const submissions = (subsJson.status === 'OK' && Array.isArray(subsJson.result)) ? subsJson.result : [];

            // rating history
            let ratingHistory = [];
            try {
                const ratingResp = await fetch(`https://codeforces.com/api/user.rating?handle=${encodeURIComponent(username)}`);
                const ratingJson = await ratingResp.json();
                if (ratingJson.status === 'OK' && Array.isArray(ratingJson.result)) {
                    ratingHistory = ratingJson.result.map(r => ({ contest_date: new Date(r.ratingUpdateTimeSeconds * 1000).toISOString().split('T')[0], oldRating: r.oldRating, newRating: r.newRating, contestName: r.contestName }));
                }
            } catch (e) {
                // ignore rating history errors
            }

            // Process submissions to compute solved problems and tag distribution
            const solvedSet = new Set();
            const tags = {};
            const verdicts = {};
            const solvedByRating = {};

            submissions.forEach(s => {
                const verdict = s.verdict || 'UNKNOWN';
                verdicts[verdict] = (verdicts[verdict] || 0) + 1;

                if (s.problem) {
                    if (s.problem.tags && Array.isArray(s.problem.tags)) {
                        s.problem.tags.forEach(t => tags[t] = (tags[t] || 0) + 1);
                    }
                    if (s.verdict === 'OK') {
                        const key = `${s.problem.contestId || ''}-${s.problem.index || ''}`;
                        solvedSet.add(key);
                        const pr = s.problem.rating || 'Unrated';
                        solvedByRating[pr] = (solvedByRating[pr] || 0) + 1;
                    }
                }
            });

            return {
                username,
                rating: user.rating || null,
                maxRating: user.maxRating || null,
                ratingTitle: user.rank || null,
                solvedCount: solvedSet.size,
                solvedByRating,
                tags,
                verdicts,
                ratingHistory,
                submissionsCount: submissions.length
            };
        } catch (err) {
            console.error('Error fetching Codeforces data for', username, err);
            return { username, error: err.message || 'fetch error' };
        }
    };

    try {
        const [u1, u2] = await Promise.all([fetchUserFromCF(user1), fetchUserFromCF(user2)]);

        const comparison = {
            ratingDiff: (u1.rating || 0) - (u2.rating || 0),
            solvedDiff: (u1.solvedCount || 0) - (u2.solvedCount || 0),
        };

        res.json({ user1: u1, user2: u2, comparison });
    } catch (err) {
        console.error('Error in compare endpoint', err);
        res.status(500).json({ error: 'Failed to compare users' });
    }
});