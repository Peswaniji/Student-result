const express = require('express');
const { addStudent, getStudents, updateStudent, deleteStudent, bulkImportStudents } = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/')
    .post(protect, addStudent)
    .get(protect, getStudents);

router.route('/:id')
    .put(protect, updateStudent)
    .delete(protect, deleteStudent);

router.post('/bulk-import', protect, bulkImportStudents);

module.exports = router;
