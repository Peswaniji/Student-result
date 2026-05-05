const mongoose = require('mongoose');
const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a student name'],
        trim: true
    },
    rollNo: {
        type: String,
        required: [true, 'Please add a roll number'],
        unique: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true,
        default: ''
    }
}, {
    timestamps: true
});
module.exports = mongoose.model('Student', studentSchema);