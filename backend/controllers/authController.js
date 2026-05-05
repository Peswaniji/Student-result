const Admin = require('../models/Admin');

// @desc    Register admin (setup only)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide an email and password' });
        }

        // Check if admin already exists (we might want only one admin or multiple)
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
             return res.status(400).json({ success: false, message: 'Admin already exists' });
        }

        const admin = await Admin.create({
            email,
            password
        });

        sendTokenResponse(admin, 201, res);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Login admin
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate email and password
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide an email and password' });
        }

        // Check for admin
        const admin = await Admin.findOne({ email }).select('+password');

        if (!admin) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await admin.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        sendTokenResponse(admin, 200, res);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get current logged in admin
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.id);
        res.status(200).json({
            success: true,
            data: admin
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Helper function to get token from model, create response
const sendTokenResponse = (admin, statusCode, res) => {
    // Create token
    const token = admin.getSignedJwtToken();

    res.status(statusCode).json({
        success: true,
        token
    });
};
