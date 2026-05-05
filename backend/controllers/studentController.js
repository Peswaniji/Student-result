const Student = require('../models/Student');

// @desc    Add a student (manual entry)
// @route   POST /api/students
// @access  Private (Admin)
exports.addStudent = async (req, res) => {
    try {
        const { name, rollNo, phone } = req.body;

        if (!name || !rollNo) {
            return res.status(400).json({ success: false, message: 'Please provide name and roll number' });
        }

        // Check if student exists
        let student = await Student.findOne({ rollNo });
        if (student) {
            return res.status(400).json({ success: false, message: 'Student with this roll number already exists' });
        }

        student = await Student.create({ name, rollNo, phone: phone || '' });

        res.status(201).json({
            success: true,
            data: student
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a student
// @route   PUT /api/students/:id
// @access  Private (Admin)
exports.updateStudent = async (req, res) => {
    try {
        const { name, rollNo, phone } = req.body;
        
        let student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Check if new roll number already exists (and it's not the same student)
        if (rollNo && rollNo !== student.rollNo) {
            const exists = await Student.findOne({ rollNo });
            if (exists) {
                return res.status(400).json({ success: false, message: 'Roll number already exists' });
            }
        }

        student.name = name || student.name;
        student.rollNo = rollNo || student.rollNo;
        student.phone = phone !== undefined ? phone : student.phone;
        
        await student.save();

        res.status(200).json({
            success: true,
            data: student
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a student
// @route   DELETE /api/students/:id
// @access  Private (Admin)
exports.deleteStudent = async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Student deleted',
            data: student
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all students
// @route   GET /api/students
// @access  Private (Admin)
exports.getStudents = async (req, res) => {
    try {
        const students = await Student.find().sort({ name: 1 });
        res.status(200).json({
            success: true,
            count: students.length,
            data: students
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Bulk import students from CSV
// @route   POST /api/students/bulk-import
// @access  Private (Admin)
exports.bulkImportStudents = async (req, res) => {
    try {
        const { students: studentsList } = req.body;

        if (!Array.isArray(studentsList) || studentsList.length === 0) {
            return res.status(400).json({ success: false, message: 'Please provide students array' });
        }

        const imported = [];
        const errors = [];

        for (let i = 0; i < studentsList.length; i++) {
            const { name, rollNo, phone } = studentsList[i];

            if (!name || !rollNo) {
                errors.push(`Row ${i + 1}: Missing name or roll number`);
                continue;
            }

            const exists = await Student.findOne({ rollNo });
            if (exists) {
                errors.push(`Row ${i + 1}: Roll number ${rollNo} already exists`);
                continue;
            }

            try {
                const student = await Student.create({ 
                    name, 
                    rollNo, 
                    phone: phone || '' 
                });
                imported.push(student);
            } catch (err) {
                errors.push(`Row ${i + 1}: ${err.message}`);
            }
        }

        res.status(200).json({
            success: true,
            message: `Imported ${imported.length} students${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
            imported,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
