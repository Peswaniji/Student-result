const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars FIRST before anything else
dotenv.config();

const connectDB = require('./config/db');

// Route imports
const testRoutes = require('./routes/testRoutes');
const studentRoutes = require('./routes/studentRoutes');
const resultRoutes = require('./routes/resultRoutes');
const authRoutes = require('./routes/authRoutes');

// Connect to Database
connectDB();

const app = express();

// Middleware
const corsOptions = {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/tests', testRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/auth', authRoutes);
// debug routes removed after testing

// Serve static frontend files in production
const frontendBuildPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendBuildPath));

// SPA fallback - serve index.html for all non-API routes
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ message: 'API route not found' });
    }
    res.sendFile(path.join(frontendBuildPath, 'index.html'), (err) => {
        if (err) {
            res.status(404).send('Page not found');
        }
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`JWT_SECRET loaded: ${process.env.JWT_SECRET ? 'YES' : 'NO - CHECK .env FILE'}`);
    console.log(`MONGO_URI loaded: ${process.env.MONGO_URI ? 'YES' : 'NO - CHECK .env FILE'}`);
    console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'not set'}`);
});