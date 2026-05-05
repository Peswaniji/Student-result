const mongoose = require('mongoose');
const crypto = require('crypto');

const resultSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test',
        required: true
    },
    marks: {
        type: Number,
        required: [true, 'Please add marks']
    },
    token: {
        type: String,
        unique: true
    },
    answerSheets: [{
        type: String
    }]
}, {
    timestamps: true
});

// Compound unique index to ensure one result per student per test
resultSchema.index({ studentId: 1, testId: 1 }, { unique: true });

// Index to speed up rank calculations and leaderboard sorting
resultSchema.index({ testId: 1, marks: -1 });

// Generate random unguessable token before saving — no next() in Express 5
resultSchema.pre('save', async function () {
    if (!this.token) {
        let isUnique = false;
        while (!isUnique) {
            const generatedToken = crypto.randomBytes(32).toString('hex');
            const existingToken = await this.constructor.findOne({ token: generatedToken });
            if (!existingToken) {
                this.token = generatedToken;
                isUnique = true;
            }
        }
    }
});

module.exports = mongoose.model('Result', resultSchema);