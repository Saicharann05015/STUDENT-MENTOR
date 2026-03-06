const mongoose = require('mongoose');

const skillProfileSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        strongTopics: {
            type: [String],
            default: [],
        },
        weakTopics: {
            type: [String],
            default: [],
        },
        difficultyLevel: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'expert'],
            default: 'beginner',
        },
        lastAssessmentScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
    },
    { timestamps: true }
);

// Unique compound index — one profile per user per category
skillProfileSchema.index({ user: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('SkillProfile', skillProfileSchema);
