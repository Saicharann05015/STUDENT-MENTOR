const User = require('../models/User');
const Chat = require('../models/Chat');
const Roadmap = require('../models/Roadmap');
const SkillDiagnosis = require('../models/SkillDiagnosis');
const SkillProfile = require('../models/SkillProfile');
const Progress = require('../models/Progress');
const logger = require('../utils/logger');

class UserService {
    // Get user by ID
    static async getUserById(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw Object.assign(new Error('User not found'), { statusCode: 404 });
        }
        return user;
    }

    // Update user profile
    static async updateProfile(userId, updateData) {
        const allowedFields = ['name', 'avatar'];
        const filteredData = {};
        Object.keys(updateData).forEach((key) => {
            if (allowedFields.includes(key)) filteredData[key] = updateData[key];
        });

        const user = await User.findByIdAndUpdate(userId, filteredData, {
            new: true,
            runValidators: true,
        });

        if (!user) {
            throw Object.assign(new Error('User not found'), { statusCode: 404 });
        }
        return user;
    }

    // Delete user account — cascade delete all related data
    static async deleteUser(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw Object.assign(new Error('User not found'), { statusCode: 404 });
        }

        // Cascade delete all user data in parallel
        await Promise.all([
            Chat.deleteMany({ user: userId }),
            Roadmap.deleteMany({ user: userId }),
            SkillDiagnosis.deleteMany({ user: userId }),
            SkillProfile.deleteMany({ user: userId }),
            Progress.deleteMany({ user: userId }),
        ]);

        await User.findByIdAndDelete(userId);

        logger.info(`User ${userId} and all related data deleted`);
        return { message: 'User account and all related data deleted successfully' };
    }

    // Get all users (admin only)
    static async getAllUsers(query = {}) {
        const { page = 1, limit = 10, role } = query;
        const filter = {};
        if (role) filter.role = role;

        const users = await User.find(filter)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(filter);

        return { users, total, page: parseInt(page), pages: Math.ceil(total / limit) };
    }
}

module.exports = UserService;
