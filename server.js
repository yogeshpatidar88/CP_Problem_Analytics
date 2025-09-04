// server.js

const express = require('express');
const cors = require('cors');

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

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});