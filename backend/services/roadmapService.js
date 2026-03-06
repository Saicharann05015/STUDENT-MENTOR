const Roadmap = require('../models/Roadmap');
const ProgressService = require('./progressService');

class RoadmapService {
    // Get all roadmaps for a user
    static async getUserRoadmaps(userId, query = {}) {
        const { page = 1, limit = 10, category } = query;
        const filter = { user: userId };
        if (category) filter.category = category;

        const roadmaps = await Roadmap.find(filter)
            .select('title category goal currentLevel timeline progressPercentage isActive createdAt')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Roadmap.countDocuments(filter);
        return { roadmaps, total, page: parseInt(page), pages: Math.ceil(total / limit) };
    }

    // Get single roadmap
    static async getRoadmapById(roadmapId, userId) {
        const roadmap = await Roadmap.findOne({ _id: roadmapId, user: userId });
        if (!roadmap) {
            throw Object.assign(new Error('Roadmap not found'), { statusCode: 404 });
        }
        return roadmap;
    }

    // Update a roadmap
    static async updateRoadmap(roadmapId, userId, updateData) {
        const roadmap = await Roadmap.findOneAndUpdate(
            { _id: roadmapId, user: userId },
            updateData,
            { new: true, runValidators: true }
        );
        if (!roadmap) {
            throw Object.assign(new Error('Roadmap not found'), { statusCode: 404 });
        }
        return roadmap;
    }

    // Complete a milestone
    static async completeMilestone(roadmapId, userId, milestoneId) {
        const roadmap = await Roadmap.findOne({ _id: roadmapId, user: userId });
        if (!roadmap) {
            throw Object.assign(new Error('Roadmap not found'), { statusCode: 404 });
        }

        const milestone = roadmap.milestones.id(milestoneId);
        if (!milestone) {
            throw Object.assign(new Error('Milestone not found'), { statusCode: 404 });
        }

        milestone.isCompleted = true;
        milestone.completedAt = new Date();

        // Also mark all tasks and projects as done
        milestone.practiceTasks.forEach((t) => (t.isCompleted = true));
        milestone.projects.forEach((p) => (p.isCompleted = true));

        await roadmap.save(); // pre-save hook auto-updates progressPercentage

        // Update global progress
        await ProgressService.completeMilestone(userId, milestoneId);

        return roadmap;
    }

    // Complete a practice task
    static async completeTask(roadmapId, userId, milestoneId, taskId) {
        const roadmap = await Roadmap.findOne({ _id: roadmapId, user: userId });
        if (!roadmap) throw Object.assign(new Error('Roadmap not found'), { statusCode: 404 });

        const milestone = roadmap.milestones.id(milestoneId);
        if (!milestone) throw Object.assign(new Error('Milestone not found'), { statusCode: 404 });

        const task = milestone.practiceTasks.id(taskId);
        if (!task) throw Object.assign(new Error('Task not found'), { statusCode: 404 });

        task.isCompleted = true;
        await roadmap.save();

        // Update global progress
        await ProgressService.completeTask(userId, taskId);

        return roadmap;
    }

    // Complete a project
    static async completeProject(roadmapId, userId, milestoneId, projectId) {
        const roadmap = await Roadmap.findOne({ _id: roadmapId, user: userId });
        if (!roadmap) throw Object.assign(new Error('Roadmap not found'), { statusCode: 404 });

        const milestone = roadmap.milestones.id(milestoneId);
        if (!milestone) throw Object.assign(new Error('Milestone not found'), { statusCode: 404 });

        const project = milestone.projects.id(projectId);
        if (!project) throw Object.assign(new Error('Project not found'), { statusCode: 404 });

        project.isCompleted = true;
        await roadmap.save();

        // Update global progress
        await ProgressService.completeTask(userId, projectId);

        return roadmap;
    }

    // Delete a roadmap
    static async deleteRoadmap(roadmapId, userId) {
        const roadmap = await Roadmap.findOneAndDelete({ _id: roadmapId, user: userId });
        if (!roadmap) {
            throw Object.assign(new Error('Roadmap not found'), { statusCode: 404 });
        }
        return { message: 'Roadmap deleted successfully' };
    }
}

module.exports = RoadmapService;
