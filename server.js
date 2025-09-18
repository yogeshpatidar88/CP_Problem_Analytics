// server.js

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

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
app.use('/api/users', userRoutes);

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

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});