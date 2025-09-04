// userController.js (located in the root directory)
const express = require('express');
const { spawn } = require('child_process');
const bcrypt = require('bcrypt');
const fetch = require('node-fetch');
const router = express.Router();
const path = require('path');
const db = require('./db');
const fs = require('fs');

// Simple Registration Endpoint with automatic Codeforces data fetch
router.post('/register', async (req, res) => {
  console.log('Registering user...');
  const { username, email, password } = req.body;

  // Input Validation
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required.' });
  }

  try {
    const checkUserQuery = 'SELECT COUNT(*) AS count FROM users WHERE username = ?';
    db.query(checkUserQuery, [username], async (err, results) => {
      if (err) {
        console.error(`Database error during user check: ${err.message}`);
        return res.status(500).json({ error: 'Database error. Please try again later.' });
      }

      if (results[0].count > 0) {
        return res.status(400).json({ error: 'Username already exists. Please choose another.' });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log(`Password hashed for user: ${username}`);

      // First, try to fetch Codeforces data
      let cfData = {
        rating: 800,
        country: null,
        problemCount: 0,
        maxRating: 800,
        ratingTitle: 'newbie'
      };

      try {
        console.log(`Fetching Codeforces data for: ${username}`);
        
        // Fetch user info from Codeforces API
        const userInfoResponse = await fetch(`https://codeforces.com/api/user.info?handles=${username}`);
        const userInfoData = await userInfoResponse.json();
        
        if (userInfoData.status === 'OK' && userInfoData.result.length > 0) {
          const cfUser = userInfoData.result[0];
          
          // Fetch user submissions to count solved problems
          const submissionsResponse = await fetch(`https://codeforces.com/api/user.status?handle=${username}`);
          const submissionsData = await submissionsResponse.json();
          
          let solvedProblems = 0;
          if (submissionsData.status === 'OK') {
            const uniqueSolved = new Set();
            submissionsData.result.forEach(submission => {
              if (submission.verdict === 'OK') {
                uniqueSolved.add(`${submission.problem.contestId}-${submission.problem.index}`);
              }
            });
            solvedProblems = uniqueSolved.size;
          }
          
          // Update with real Codeforces data
          cfData = {
            rating: cfUser.rating || 800,
            country: cfUser.country || null,
            problemCount: solvedProblems,
            maxRating: cfUser.maxRating || cfUser.rating || 800,
            ratingTitle: cfUser.rank || 'newbie'
          };
          
          console.log(`Codeforces data found for ${username}:`, cfData);
        } else {
          console.log(`No Codeforces data found for ${username}, using defaults`);
        }
      } catch (cfError) {
        console.log(`Codeforces API error for ${username}: ${cfError.message}, using defaults`);
      }

      // Insert user with fetched data (or defaults if not found)
      const insertUserQuery = `INSERT INTO users (username, email, password, rating, country, problem_count, max_rating, rating_title, last_updated) 
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
      
      db.query(insertUserQuery, [username, email, hashedPassword, cfData.rating, cfData.country, cfData.problemCount, cfData.maxRating, cfData.ratingTitle], (insertErr, insertResults) => {
        if (insertErr) {
          console.error(`Database error during user insertion: ${insertErr.message}`);
          return res.status(500).json({ error: 'Failed to create user. Please try again.' });
        }

        console.log(`User ${username} registered successfully with Codeforces data`);
        return res.status(200).json({ 
          message: `User ${username} registered successfully.`,
          codeforcesData: cfData
        });
      });
    });
  } catch (hashError) {
    console.error(`Hashing error: ${hashError.message}`);
    return res.status(500).json({ error: 'Error processing registration. Please try again.' });
  }
});

// Fetch Codeforces Data Endpoint
router.post('/fetch-codeforces-data', async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required.' });
  }

  try {
    console.log(`Fetching Codeforces data for user: ${username}`);
    
    // Fetch user info from Codeforces API
    const userInfoResponse = await fetch(`https://codeforces.com/api/user.info?handles=${username}`);
    const userInfoData = await userInfoResponse.json();
    
    if (userInfoData.status !== 'OK') {
      return res.status(404).json({ error: 'User not found on Codeforces.' });
    }
    
    const cfUser = userInfoData.result[0];
    
    // Fetch user submissions to count solved problems
    const submissionsResponse = await fetch(`https://codeforces.com/api/user.status?handle=${username}`);
    const submissionsData = await submissionsResponse.json();
    
    let solvedProblems = 0;
    if (submissionsData.status === 'OK') {
      const uniqueSolved = new Set();
      submissionsData.result.forEach(submission => {
        if (submission.verdict === 'OK') {
          uniqueSolved.add(`${submission.problem.contestId}-${submission.problem.index}`);
        }
      });
      solvedProblems = uniqueSolved.size;
    }
    
    // Update user with Codeforces data
    const updateUserQuery = `
      UPDATE users 
      SET rating = ?, country = ?, problem_count = ?, max_rating = ?, rating_title = ?, last_updated = NOW()
      WHERE username = ?
    `;
    
    const rating = cfUser.rating || 800;
    const maxRating = cfUser.maxRating || rating;
    const country = cfUser.country || null;
    const ratingTitle = cfUser.rank || 'newbie';
    
    db.query(updateUserQuery, [rating, country, solvedProblems, maxRating, ratingTitle, username], (updateErr) => {
      if (updateErr) {
        console.error(`Database error during user update: ${updateErr.message}`);
        return res.status(500).json({ error: 'Failed to update user with Codeforces data.' });
      }
      
      console.log(`Codeforces data updated for user: ${username}`);
      res.status(200).json({ 
        message: `Codeforces data updated for ${username}`,
        data: {
          rating,
          country,
          problemCount: solvedProblems,
          maxRating,
          ratingTitle
        }
      });
    });
    
  } catch (error) {
    console.error(`Error fetching Codeforces data: ${error.message}`);
    return res.status(500).json({ error: 'Failed to fetch Codeforces data.' });
  }
});

// Get User Profile Endpoint
router.get('/profile/:username', (req, res) => {
  const { username } = req.params;
  
  const getUserQuery = `
    SELECT username, email, rating, country, university, problem_count, max_rating, rating_title, last_updated
    FROM users 
    WHERE username = ?
  `;

  db.query(getUserQuery, [username], (err, results) => {
    if (err) {
      console.error(`Database error: ${err.message}`);
      return res.status(500).json({ error: 'Database error.' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = results[0];
    // Don't send password in response
    delete user.password;
    
    res.status(200).json({ user });
  });
});

// Get User Analytics Data Endpoint
router.get('/analytics/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    console.log(`Fetching analytics for user: ${username}`);
    
    // Fetch user submissions from Codeforces API
    const submissionsResponse = await fetch(`https://codeforces.com/api/user.status?handle=${username}`);
    const submissionsData = await submissionsResponse.json();
    
    if (submissionsData.status !== 'OK') {
      return res.status(404).json({ error: 'User submissions not found on Codeforces.' });
    }
    
    const submissions = submissionsData.result;
    
    // Process submissions for analytics
    const analytics = {
      problemDifficulty: {},
      verdictDistribution: {},
      languageDistribution: {},
      monthlySubmissions: {},
      problemTags: {},
      contestTypes: {},
      recentSubmissions: [],
      totalSubmissions: submissions.length
    };
    
    submissions.forEach(submission => {
      // Problem difficulty distribution
      const rating = submission.problem.rating || 'Unrated';
      analytics.problemDifficulty[rating] = (analytics.problemDifficulty[rating] || 0) + 1;
      
      // Verdict distribution
      const verdict = submission.verdict || 'Unknown';
      analytics.verdictDistribution[verdict] = (analytics.verdictDistribution[verdict] || 0) + 1;
      
      // Language distribution
      const language = submission.programmingLanguage || 'Unknown';
      analytics.languageDistribution[language] = (analytics.languageDistribution[language] || 0) + 1;
      
      // Monthly submissions
      const date = new Date(submission.creationTimeSeconds * 1000);
      const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      analytics.monthlySubmissions[monthYear] = (analytics.monthlySubmissions[monthYear] || 0) + 1;
      
      // Problem tags
      if (submission.problem.tags) {
        submission.problem.tags.forEach(tag => {
          analytics.problemTags[tag] = (analytics.problemTags[tag] || 0) + 1;
        });
      }
      
      // Contest types
      if (submission.contestId) {
        analytics.contestTypes['Contest'] = (analytics.contestTypes['Contest'] || 0) + 1;
      } else {
        analytics.contestTypes['Practice'] = (analytics.contestTypes['Practice'] || 0) + 1;
      }
    });
    
    // Get recent submissions (last 10)
    analytics.recentSubmissions = submissions
      .sort((a, b) => b.creationTimeSeconds - a.creationTimeSeconds)
      .slice(0, 10)
      .map(sub => ({
        problemName: sub.problem.name,
        problemId: `${sub.problem.contestId}${sub.problem.index}`,
        verdict: sub.verdict,
        language: sub.programmingLanguage,
        submissionTime: new Date(sub.creationTimeSeconds * 1000).toLocaleString(),
        rating: sub.problem.rating || 'Unrated'
      }));
    
    res.status(200).json({ analytics });
    
  } catch (error) {
    console.error(`Error fetching analytics: ${error.message}`);
    return res.status(500).json({ error: 'Failed to fetch analytics data.' });
  }
});

// Get ML-based Problem Recommendations Endpoint
router.get('/recommendations/:username', async (req, res) => {
  try {
    const username = req.params.username;
    console.log(`Generating recommendations for user: ${username}`);

    // Get user info and submissions
    const [userResponse, submissionsResponse, problemsetResponse] = await Promise.all([
      fetch(`https://codeforces.com/api/user.info?handles=${username}`),
      fetch(`https://codeforces.com/api/user.status?handle=${username}`),
      fetch(`https://codeforces.com/api/problemset.problems`)
    ]);

    const userData = await userResponse.json();
    const submissionsData = await submissionsResponse.json();
    const problemsetData = await problemsetResponse.json();

    if (userData.status !== 'OK' || submissionsData.status !== 'OK' || problemsetData.status !== 'OK') {
      return res.status(404).json({ error: 'Failed to fetch data from Codeforces API' });
    }

    const user = userData.result[0];
    const submissions = submissionsData.result;
    const allProblems = problemsetData.result.problems;

    // Generate ML-based recommendations
    const recommendations = generateMLRecommendations(user, submissions, allProblems);
    
    res.status(200).json({ recommendations });
  } catch (error) {
    console.error(`Error generating recommendations: ${error.message}`);
    return res.status(500).json({ error: 'Failed to generate recommendations.' });
  }
});

// Helper function to generate ML-based recommendations
function generateMLRecommendations(user, submissions, allProblems) {
  const userRating = user.rating || 1200; // Default rating if not available
  const solvedProblems = new Set();
  const tagFrequency = {};
  const difficultySuccess = {};
  const recentSubmissions = submissions.slice(0, 100); // Last 100 submissions for analysis

  // Analyze solved problems and tag preferences
  submissions.forEach(submission => {
    if (submission.verdict === 'OK') {
      const problemKey = `${submission.problem.contestId}-${submission.problem.index}`;
      solvedProblems.add(problemKey);
      
      // Track tag frequency
      if (submission.problem.tags) {
        submission.problem.tags.forEach(tag => {
          tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
        });
      }
      
      // Track difficulty success rate
      const rating = submission.problem.rating || userRating;
      const ratingRange = Math.floor(rating / 100) * 100;
      if (!difficultySuccess[ratingRange]) {
        difficultySuccess[ratingRange] = { solved: 0, attempted: 0 };
      }
      difficultySuccess[ratingRange].solved++;
    }
  });

  // Count attempts for success rate calculation
  submissions.forEach(submission => {
    const rating = submission.problem.rating || userRating;
    const ratingRange = Math.floor(rating / 100) * 100;
    if (!difficultySuccess[ratingRange]) {
      difficultySuccess[ratingRange] = { solved: 0, attempted: 0 };
    }
    difficultySuccess[ratingRange].attempted++;
  });

  // Find underused tags (tags with low frequency)
  const allTags = Object.keys(tagFrequency);
  const avgTagFreq = allTags.length > 0 ? 
    Object.values(tagFrequency).reduce((a, b) => a + b, 0) / allTags.length : 0;
  const underusedTags = allTags.filter(tag => tagFrequency[tag] < avgTagFreq * 0.7);

  // Determine target difficulty range
  const targetRatingMin = Math.max(800, userRating - 200);
  const targetRatingMax = userRating + 300;

  // Filter and score problems
  const candidates = allProblems.filter(problem => {
    const problemKey = `${problem.contestId}-${problem.index}`;
    const problemRating = problem.rating || userRating;
    
    return !solvedProblems.has(problemKey) &&
           problemRating >= targetRatingMin &&
           problemRating <= targetRatingMax &&
           problem.tags &&
           problem.tags.length > 0;
  });

  // Score problems using ML-like approach
  const scoredProblems = candidates.map(problem => {
    let score = 0;
    const problemRating = problem.rating || userRating;
    
    // Rating proximity score (higher for problems closer to user's level)
    const ratingDiff = Math.abs(problemRating - userRating);
    score += Math.max(0, 100 - ratingDiff / 10);
    
    // Underused tags bonus
    const hasUnderusedTag = problem.tags.some(tag => underusedTags.includes(tag));
    if (hasUnderusedTag) score += 50;
    
    // Difficulty progression score
    const ratingRange = Math.floor(problemRating / 100) * 100;
    const successRate = difficultySuccess[ratingRange] ? 
      difficultySuccess[ratingRange].solved / difficultySuccess[ratingRange].attempted : 0.5;
    
    if (successRate > 0.8) {
      // High success rate -> suggest slightly harder problems
      score += problemRating > userRating ? 30 : 10;
    } else if (successRate < 0.3) {
      // Low success rate -> suggest easier problems
      score += problemRating < userRating ? 30 : 10;
    } else {
      // Balanced success rate -> maintain current level
      score += 20;
    }
    
    // Diversity bonus for different contest types
    if (problem.contestId > 1000) score += 10; // Regular contests
    
    // Popular problem bonus (problems with more submissions tend to be better)
    if (problemRating && problemRating % 100 === 0) score += 5; // Round ratings are often key problems
    
    return {
      ...problem,
      score,
      reasonPhrase: generateReasonPhrase(problem, hasUnderusedTag, successRate, userRating)
    };
  });

  // Sort by score and return top recommendations
  const topRecommendations = scoredProblems
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((problem, index) => ({
      rank: index + 1,
      contestId: problem.contestId,
      index: problem.index,
      name: problem.name,
      rating: problem.rating,
      tags: problem.tags,
      url: `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`,
      score: Math.round(problem.score),
      reason: problem.reasonPhrase
    }));

  return {
    userRating,
    totalSolved: solvedProblems.size,
    recommendedDifficultyRange: `${targetRatingMin}-${targetRatingMax}`,
    underusedTags: underusedTags.slice(0, 5),
    recommendations: topRecommendations,
    analysisMetadata: {
      candidateProblems: candidates.length,
      avgTagFrequency: Math.round(avgTagFreq),
      successRates: Object.entries(difficultySuccess).map(([rating, data]) => ({
        rating: parseInt(rating),
        successRate: Math.round((data.solved / data.attempted) * 100)
      }))
    }
  };
}

// Helper function to generate explanation for each recommendation
function generateReasonPhrase(problem, hasUnderusedTag, successRate, userRating) {
  const reasons = [];
  
  if (hasUnderusedTag) {
    reasons.push("explores new topics");
  }
  
  const ratingDiff = problem.rating - userRating;
  if (ratingDiff > 100) {
    reasons.push("challenging difficulty");
  } else if (ratingDiff < -100) {
    reasons.push("builds confidence");
  } else {
    reasons.push("perfect difficulty match");
  }
  
  if (successRate > 0.8) {
    reasons.push("advance your skills");
  } else if (successRate < 0.3) {
    reasons.push("strengthen weak areas");
  }
  
  if (problem.tags.includes('dp')) reasons.push("dynamic programming practice");
  if (problem.tags.includes('graphs')) reasons.push("graph algorithms");
  if (problem.tags.includes('math')) reasons.push("mathematical thinking");
  
  return reasons.slice(0, 3).join(", ");
}

// Login Endpoint (unchanged)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const getUserQuery = 'SELECT * FROM users WHERE username = ?';

  db.query(getUserQuery, [username], async (err, results) => {
    if (err) {
      console.error(`Database error: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: 'Invalid username or password.' });
    }

    const user = results[0];

    // Compare the password using bcrypt
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ message: 'Invalid username or password.' });
    }

    // Successful login
    res.status(200).json({ message: `Welcome back, ${username}!` });
  });
});

// Generate Problem Analysis Endpoint
router.post('/problems/analysis', (req, res) => {
  const { problem_id } = req.body;

  if (!problem_id) {
    return res.status(400).json({ error: 'Problem ID is required.' });
  }

  const scriptPath = path.join(__dirname, "jsonify", 'author_problem_anal.py'); // Adjusted path

  const process = spawn('python3', [scriptPath, problem_id]);

  let scriptOutput = '';
  let scriptError = '';

  process.stdout.on('data', (data) => {
    scriptOutput += data.toString();
  });

  process.stderr.on('data', (data) => {
    scriptError += data.toString();
  });

  process.on('close', (code) => {
    if (code !== 0) {
      console.error(`Script exited with code ${code}: ${scriptError}`);
      return res.status(500).json({ error: 'Failed to generate problem analysis.' });
    }

    const filePath = path.join(__dirname, 'problem_analysis', `${problem_id}_analysis.json`); // Updated path

    // Check if the JSON file exists
    if (!fs.existsSync(filePath)) {
      console.error(`JSON file not found at path: ${filePath}`);
      return res.status(500).json({ error: 'Problem analysis JSON file not found.' });
    }

    // Read the generated JSON file
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error(`Error reading JSON file: ${err.message}`);
        return res.status(500).json({ error: 'Failed to read problem analysis data.' });
      }

      try {
        const jsonData = JSON.parse(data);
        return res.status(200).json(jsonData);
      } catch (parseErr) {
        console.error(`JSON parse error: ${parseErr.message}`);
        return res.status(500).json({ error: 'Invalid JSON format.' });
      }
    });
  });

  process.on('error', (err) => {
    console.error(`Failed to start author_problem_anal.py: ${err.message}`);
    return res.status(500).json({ error: 'Failed to execute problem analysis script.' });
  });
});

module.exports = router;