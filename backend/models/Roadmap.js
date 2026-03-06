const mongoose = require('mongoose');

// Practice task within a week
const practiceTaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    type: {
        type: String,
        enum: ['exercise', 'quiz', 'mini-project', 'reading', 'video'],
        default: 'exercise',
    },
    isCompleted: { type: Boolean, default: false },
});

// Project within a milestone
const projectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium',
    },
    isCompleted: { type: Boolean, default: false },
});

// Weekly milestone
const milestoneSchema = new mongoose.Schema({
    week: { type: Number, required: true },
    title: { type: String, required: true },
    description: String,
    concepts: [String],
    practiceTasks: [practiceTaskSchema],
    projects: [projectSchema],
    resources: [
        {
            title: String,
            url: String,
            type: { type: String, default: 'other' },
        },
    ],
    estimatedHours: { type: Number, default: 0 },
    order: { type: Number, required: true },
    isCompleted: { type: Boolean, default: false },
    completedAt: Date,
});

const roadmapSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: [true, 'Roadmap title is required'],
        },
        description: String,
        category: {
            type: String,
            required: true,
        },
        // User inputs
        goal: {
            type: String,
            required: true,
        },
        currentLevel: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'expert'],
            default: 'beginner',
        },
        targetLevel: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'expert'],
            default: 'intermediate',
        },
        timeline: {
            type: String, // e.g. "3 months", "6 weeks"
            required: true,
        },
        dailyLearningTime: {
            type: String, // e.g. "2 hours", "30 minutes"
            required: true,
        },
        // Generated content
        milestones: [milestoneSchema],
        totalWeeks: { type: Number, default: 0 },
        estimatedCompletion: String,
        // Progress tracking
        completedMilestones: { type: Number, default: 0 },
        progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
        isActive: { type: Boolean, default: true },
        isGenerated: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Compound index for common queries (user's active roadmaps sorted by date)
roadmapSchema.index({ user: 1, isActive: 1, updatedAt: -1 });

// Auto-calculate progress before saving
roadmapSchema.pre('save', function (next) {
    if (this.milestones.length > 0) {
        let totalItems = 0;
        let completedItems = 0;

        // Count all milestones, tasks, and projects
        this.milestones.forEach((m) => {
            // Milestone itself counts as an item
            totalItems++;
            if (m.isCompleted) completedItems++;

            // Count tasks
            if (m.practiceTasks && m.practiceTasks.length > 0) {
                totalItems += m.practiceTasks.length;
                completedItems += m.practiceTasks.filter((t) => t.isCompleted).length;
            }

            // Count projects
            if (m.projects && m.projects.length > 0) {
                totalItems += m.projects.length;
                completedItems += m.projects.filter((p) => p.isCompleted).length;
            }
        });

        // Set completed milestones count directly
        this.completedMilestones = this.milestones.filter((m) => m.isCompleted).length;

        // Calculate granular progress percentage
        this.progressPercentage = Math.round((completedItems / totalItems) * 100);
    }
    next();
});

module.exports = mongoose.model('Roadmap', roadmapSchema);
