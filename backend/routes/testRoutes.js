const express = require('express');
const { createTest, getTests, updateTest, deleteTest } = require('../controllers/testController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/')
    .post(protect, createTest)
    .get(protect, getTests);

router.route('/:id')
    .put(protect, updateTest)
    .delete(protect, deleteTest);

module.exports = router;
