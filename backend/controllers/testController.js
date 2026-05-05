const Test = require('../models/Test');
const Result = require('../models/Result');

// @desc    Create a new test
// @route   POST /api/tests
// @access  Private (Admin)
exports.createTest = async (req, res) => {
    try {
        const { name, date } = req.body;

        if (!name || !date) {
            return res.status(400).json({ success: false, message: 'Please provide name and date' });
        }

        const test = await Test.create({ name, date });

        res.status(201).json({
            success: true,
            data: test
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all tests
// @route   GET /api/tests
// @access  Private (Admin)
exports.getTests = async (req, res) => {
    try {
        const tests = await Test.find().sort({ date: -1 });
        res.status(200).json({
            success: true,
            count: tests.length,
            data: tests
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a test
// @route   PUT /api/tests/:id
// @access  Private (Admin)
exports.updateTest = async (req, res) => {
    try {
        const { name, date } = req.body;
        
        let test = await Test.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }

        test.name = name || test.name;
        test.date = date || test.date;
        
        await test.save();

        res.status(200).json({
            success: true,
            data: test
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a test
// @route   DELETE /api/tests/:id
// @access  Private (Admin)
exports.deleteTest = async (req, res) => {
    try {
        const test = await Test.findByIdAndDelete(req.params.id);
        if (!test) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }

        // Also delete all results for this test
        await Result.deleteMany({ testId: req.params.id });

        res.status(200).json({
            success: true,
            message: 'Test and related results deleted',
            data: test
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
