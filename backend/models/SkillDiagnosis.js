const mongoose = require('mongoose');

// Individual question + answer record
const questionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['conceptual', 'coding', 'problem-solving'],
        required: true,
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        required: true,
    },
    question: {
        type: String,
        required: true,
    },
    userAnswer: {
        type: String,
        default: '',
    },
    evaluation: {
        isCorrect: { type: Boolean, default: false },
        score: { type: Number, default: 0, min: 0, max: 100 },
        feedback: { type: String, default: '' },
        mistakes: { type: [String], default: [] },
        improvementSuggestions: { type: [String], default: [] },
        correctSolution: { type: String, default: '' }
    },
    answeredAt: Date,
});

// Skill-level result
const skillResultSchema = new mongoose.Schema({
    skill: {
        type: String,
        required: true,
    },
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        required: true,
    },
    feedback: {
        type: String,
        default: '',
    },
});

const skillDiagnosisSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            trim: true,
        },
        // Diagnosis session state
        status: {
            type: String,
            enum: ['in-progress', 'completed'],
            default: 'in-progress',
        },
        currentQuestionIndex: {
            type: Number,
            default: 0,
        },
        questions: [questionSchema],
        // Final scores
        scores: {
            programming_score: { type: Number, default: 0, min: 0, max: 100 },
            logic_score: { type: Number, default: 0, min: 0, max: 100 },
            problem_solving_score: { type: Number, default: 0, min: 0, max: 100 },
        },
        results: [skillResultSchema],
        overallLevel: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'expert'],
            default: 'beginner',
        },
        overallScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        recommendations: [String],
        summary: {
            type: String,
            default: '',
        },
        completedAt: Date,
    },
    { timestamps: true }
);

// Compound index for common queries (user's diagnoses per category sorted by date)
skillDiagnosisSchema.index({ user: 1, category: 1, createdAt: -1 });

module.exports = mongoose.model('SkillDiagnosis', skillDiagnosisSchema);
