const express = require('express');
const { addResult, getPublicResults, getPrivateResult, uploadAnswerSheets, updateResult, deleteResult, getAllResults } = require('../controllers/resultController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const router = express.Router();

// Static/specific routes FIRST
router.get('/public/:testId', getPublicResults);
router.get('/private/:token', getPrivateResult);

// Dynamic routes AFTER
router.get('/', protect, getAllResults);
router.post('/', protect, addResult);
router.put('/:id', protect, updateResult);
router.delete('/:id', protect, deleteResult);
router.post('/:resultId/uploads', protect, upload.array('images', 10), uploadAnswerSheets);

module.exports = router;