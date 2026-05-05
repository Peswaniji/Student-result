const Result = require('../models/Result');
const Student = require('../models/Student');
const Test = require('../models/Test');
const { uploadFile } = require('../utils/imagekit');

// @desc    Add a result with optional answer sheets
// @route   POST /api/results
// @access  Private (Admin)
exports.addResult = async (req, res) => {
    try {
        const { studentId, testId, marks, answerSheetImages } = req.body;
        const mongoose = require('mongoose');

        // Basic string sanitization for IDs
        const safeStudentId = studentId ? studentId.toString().trim() : null;
        const safeTestId = testId ? testId.toString().trim() : null;

        // Check required fields
        if (!safeStudentId || !safeTestId || marks === undefined || marks === null || marks === '') {
            return res.status(400).json({ success: false, message: 'Please provide studentId, testId, and marks' });
        }

        // Prevent invalid ObjectIDs from crashing the DB query
        if (!mongoose.Types.ObjectId.isValid(safeStudentId) || !mongoose.Types.ObjectId.isValid(safeTestId)) {
            return res.status(400).json({ success: false, message: 'Invalid studentId or testId format' });
        }

        const test = await Test.findById(safeTestId).select('maxMarks').lean();
        if (!test) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }

        // Safely convert marks to number
        const numericMarks = Number(marks);
        const maxMarks = Number(test.maxMarks || 100);

        // Validate marks constraints
        if (isNaN(numericMarks) || numericMarks < 0 || numericMarks > maxMarks) {
            return res.status(400).json({ success: false, message: `Marks must be a valid number between 0 and ${maxMarks}` });
        }

        // Check if result already exists for this student and test
        let existingResult = await Result.findOne({ studentId: safeStudentId, testId: safeTestId });
        if (existingResult) {
            // Update marks
            existingResult.marks = numericMarks;

            // Update answer sheets if provided
            if (answerSheetImages && Array.isArray(answerSheetImages) && answerSheetImages.length > 0) {
                if (!existingResult.answerSheets) existingResult.answerSheets = [];
                existingResult.answerSheets.push(...answerSheetImages);
            }
            await existingResult.save();

            return res.status(200).json({
                success: true,
                data: existingResult,
                message: 'Result updated successfully'
            });
        }

        // Create the result
        // Token is auto-generated in pre-save middleware
        const result = await Result.create({
            studentId: safeStudentId,
            testId: safeTestId,
            marks: numericMarks,
            answerSheets: (answerSheetImages && Array.isArray(answerSheetImages)) ? answerSheetImages : []
        });

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        // Fallback for race conditions during duplicate inserts
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Result already exists for this test.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Fetch Public Results (Leaderboard, return specific fields, handle ties)
// @route   GET /api/results/public/:testId
// @access  Public
exports.getPublicResults = async (req, res) => {
    try {
        const { testId } = req.params;
        const test = await Test.findById(testId).select('maxMarks').lean();
        const maxMarks = Number(test?.maxMarks || 100);

        // Fetch and sort all results directly from DB
        const results = await Result.find({ testId })
            .populate('studentId', 'name rollNo')
            .sort({ marks: -1 })
            .lean();

        if (!results || results.length === 0) {
            return res.status(404).json({ success: false, message: 'No results found for this test' });
        }

        let totalMarks = 0;
        let currentRank = 1;

        // O(N) single-pass rank calculation and data formatting
        const processedResults = results.map((r, index) => {
            totalMarks += r.marks;

            // Standard Rank logic (1, 1, 3)
            // Rank only updates to current index + 1 if marks are strictly lower than previous
            if (index > 0 && r.marks < results[index - 1].marks) {
                currentRank = index + 1;
            }

            return {
                name: r.studentId ? r.studentId.name : 'Unknown',
                rollNo: r.studentId ? r.studentId.rollNo : 'Unknown',
                marks: r.marks,
                rank: currentRank
            };
        });

        const totalStudents = results.length;
        const highestMarks = results[0].marks;
        const lowestMarks = results[results.length - 1].marks;
        const averageMarks = (totalMarks / totalStudents).toFixed(2);

        // Separate out leaderboard (Top 3 ranks)
        const leaderboard = processedResults.filter(r => r.rank <= 3);

        const analytics = {
            totalStudents,
            averageMarks,
            highestMarks,
            lowestMarks,
            maxMarks
        };

        res.status(200).json({
            success: true,
            analytics,
            leaderboard,
            data: results
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Fetch Private Result by Token
// @route   GET /api/results/private/:token
// @access  Public (Accessed via token)
exports.getPrivateResult = async (req, res) => {
    try {
        const { token } = req.params;
        const mongoose = require('mongoose');

        // 1. First find the result by token to ensure it exists and get its testId
        const result = await Result.findOne({ token })
            .populate('studentId', 'name rollNo')
            .populate('testId', 'name date maxMarks')
            .lean();

        if (!result) {
            return res.status(404).json({ success: false, message: 'Invalid token or result not found' });
        }

        // 2. O(1) query to find exact standard rank perfectly consistent with public API
        // Rank = (Number of students with strictly higher marks) + 1
        const higherMarksCount = await Result.countDocuments({
            testId: result.testId._id,
            marks: { $gt: result.marks }
        });
        
        const studentRank = higherMarksCount + 1;

        const responseData = {
            student: result.studentId,
            test: result.testId,
            marks: result.marks,
            rank: studentRank,
            maxMarks: result.testId?.maxMarks || 100,
            answerSheets: result.answerSheets || []
        };

        res.status(200).json({
            success: true,
            data: responseData
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all results (admin view)
// @route   GET /api/results
// @access  Private (Admin)
exports.getAllResults = async (req, res) => {
    try {
        const results = await Result.find()
            .populate('studentId', 'name rollNo phone')
            .populate('testId', 'name date maxMarks')
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Upload multiple answer sheet images for a result
// @route   POST /api/results/:resultId/uploads
// @access  Private (Admin)
exports.uploadAnswerSheets = async (req, res) => {
    try {
        const { resultId } = req.params;
        const mongoose = require('mongoose');
        const folder = process.env.IMAGEKIT_FOLDER || 'Dilip';

        // 1. Check if files are uploaded
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'Please upload at least one image' });
        }

        // 2. Validate Result ID Format
        if (!mongoose.Types.ObjectId.isValid(resultId)) {
            return res.status(400).json({ success: false, message: 'Invalid result ID format' });
        }

        // 3. Check if result actually exists in DB
        const result = await Result.findById(resultId);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Result not found. Uploaded files discarded.' });
        }

        // 4. Upload buffers to ImageKit and collect returned URLs
        const uploadedFiles = [];
        for (const file of req.files) {
            try {
                const uploaded = await uploadFile({
                    buffer: file.buffer,
                    fileName: file.originalname,
                    folder
                });
                console.log('ImageKit upload response for', file.originalname, uploaded);
                if (uploaded && uploaded.url) uploadedFiles.push(uploaded.url);
            } catch (err) {
                console.error('ImageKit upload error for', file.originalname, err && err.message ? err.message : err);
            }
        }

        // 5. Append ImageKit URLs to existing answer sheets
        if (!result.answerSheets) result.answerSheets = [];
        result.answerSheets.push(...uploadedFiles);
        await result.save();

        res.status(200).json({
            success: true,
            message: 'Images uploaded successfully',
            data: uploadedFiles
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update result marks
// @route   PUT /api/results/:id
// @access  Private (Admin)
exports.updateResult = async (req, res) => {
    try {
        const { marks } = req.body;
        const mongoose = require('mongoose');

        if (marks === undefined || marks === null || marks === '') {
            return res.status(400).json({ success: false, message: 'Please provide marks' });
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid result ID format' });
        }

        const numericMarks = Number(marks);

        let result = await Result.findById(req.params.id);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Result not found' });
        }

        const test = await Test.findById(result.testId).select('maxMarks').lean();
        const maxMarks = Number(test?.maxMarks || 100);
        if (isNaN(numericMarks) || numericMarks < 0 || numericMarks > maxMarks) {
            return res.status(400).json({ success: false, message: `Marks must be between 0 and ${maxMarks}` });
        }

        result.marks = numericMarks;
        await result.save();

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete result
// @route   DELETE /api/results/:id
// @access  Private (Admin)
exports.deleteResult = async (req, res) => {
    try {
        const mongoose = require('mongoose');

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid result ID format' });
        }

        const result = await Result.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Result not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Result deleted',
            data: result
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
