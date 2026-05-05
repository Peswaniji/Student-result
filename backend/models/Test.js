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
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Test', testSchema);
