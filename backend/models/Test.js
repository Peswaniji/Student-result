const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a test name'],
        trim: true
    },
    date: {
        type: Date,
        required: [true, 'Please add a test date'],
        default: Date.now
    },
    maxMarks: {
        type: Number,
        required: [true, 'Please add max marks'],
        min: [1, 'Max marks must be at least 1'],
        default: 100
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Test', testSchema);
