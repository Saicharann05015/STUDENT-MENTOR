const Progress = require('../models/Progress');
const Roadmap = require('../models/Roadmap');

class ProgressService {
    // Get or create progress record for a user
    static async getOrCreateProgress(userId) {
        let progress = await Progress.findOne({ user: userId });
        if (!progress) {
            progress = await Progress.create({ user: userId });
        }
        return progress;
    }

    // Get user progress (dashboard data)
    static async getUserProgress(userId) {
        const progress = await this.getOrCreateProgress(userId);

        // Find latest active roadmap to show current progress percentage
        const activeRoadmap = await Roadmap.findOne({ user: userId, isActive: true }).sort({ updatedAt: -1 });

        return {
            ...progress.toObject(),
            currentRoadmap: activeRoadmap ? {
                id: activeRoadmap._id,
                title: activeRoadmap.title,
                progressPercentage: activeRoadmap.progressPercentage
            } : null,
            learningHours: parseFloat((progress.totalStudyTime / 60).toFixed(1))
        };
    }

    // Log an activity
    static async logActivity(userId, { type, description, metadata }) {
        const progress = await this.getOrCreateProgress(userId);

        progress.activities.push({ type, description, metadata });

        // Update stats based on activity type
        if (type === 'chat') progress.stats.totalChats += 1;
        if (type === 'diagnosis') progress.stats.totalDiagnoses += 1;
        if (type === 'roadmap') progress.stats.totalRoadmaps += 1;

        await progress.save();
        return progress;
    }

    // Update streak
    static async updateStreak(userId) {
        const progress = await this.getOrCreateProgress(userId);
        const today = new Date().toDateString();
        const lastActive = progress.streak.lastActiveDate
            ? progress.streak.lastActiveDate.toDateString()
            : null;

        if (lastActive === today) return progress; // Already updated today

        const yesterday = new Date(Date.now() - 86400000).toDateString();

        if (lastActive === yesterday) {
            progress.streak.current += 1;
        } else {
            progress.streak.current = 1;
        }

        if (progress.streak.current > progress.streak.longest) {
            progress.streak.longest = progress.streak.current;
        }

        progress.streak.lastActiveDate = new Date();
        await progress.save();
        return progress;
    }

    // Mark milestone completed in progress
    static async completeMilestone(userId, milestoneId) {
        const progress = await this.getOrCreateProgress(userId);

        // Avoid duplicates
        const exists = progress.completedMilestones.find(m => m.milestoneId.toString() === milestoneId.toString());
        if (!exists) {
            progress.completedMilestones.push({ milestoneId });
            progress.stats.totalLessons += 1;
            await progress.save();
        }
        return progress;
    }

    // Mark task completed in progress
    static async completeTask(userId, taskId) {
        const progress = await this.getOrCreateProgress(userId);

        // Avoid duplicates
        const exists = progress.completedTasks.find(t => t.taskId.toString() === taskId.toString());
        if (!exists) {
            progress.completedTasks.push({ taskId });
            progress.stats.totalTasks += 1;
            await progress.save();
        }
        return progress;
    }

    // Add study time
    static async addStudyTime(userId, minutes) {
        const progress = await this.getOrCreateProgress(userId);
        progress.totalStudyTime += minutes;
        await progress.save();
        return progress;
    }

    // Get activity history
    static async getActivityHistory(userId, query = {}) {
        const { limit = 20 } = query;
        const progress = await this.getOrCreateProgress(userId);
        const activities = progress.activities
            .sort((a, b) => b.date - a.date)
            .slice(0, parseInt(limit));
        return activities;
    }
}

module.exports = ProgressService;
