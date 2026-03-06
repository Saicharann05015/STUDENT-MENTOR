const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['chat', 'diagnosis', 'milestone', 'roadmap', 'login'],
        required: true,
    },
    description: String,
    metadata: mongoose.Schema.Types.Mixed,
    date: {
        type: Date,
        default: Date.now,
    },
});

const progressSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        roadmap: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Roadmap',
        },
        completedMilestones: [
            {
                milestoneId: mongoose.Schema.Types.ObjectId,
                completedAt: { type: Date, default: Date.now },
            },
        ],
        completedTasks: [
            {
                taskId: mongoose.Schema.Types.ObjectId,
                completedAt: { type: Date, default: Date.now },
            },
        ],
        streak: {
            current: { type: Number, default: 0 },
            longest: { type: Number, default: 0 },
            lastActiveDate: Date,
        },
        totalStudyTime: {
            type: Number,
            default: 0, // in minutes
        },
        activities: [activitySchema],
        stats: {
            totalChats: { type: Number, default: 0 },
            totalDiagnoses: { type: Number, default: 0 },
            totalRoadmaps: { type: Number, default: 0 },
            totalLessons: { type: Number, default: 0 },
            totalTasks: { type: Number, default: 0 },
            skillsImproved: { type: Number, default: 0 },
        },
        recommendations: {
            type: mongoose.Schema.Types.Mixed,
        },
        recommendationsLastGenerated: {
            type: Date,
        },
    },
    { timestamps: true }
);

// Cap activities at 500 to prevent unbounded document growth
const MAX_ACTIVITIES = 500;
progressSchema.pre('save', function (next) {
    if (this.activities.length > MAX_ACTIVITIES) {
        this.activities = this.activities.slice(-MAX_ACTIVITIES);
    }
    next();
});

module.exports = mongoose.model('Progress', progressSchema);
