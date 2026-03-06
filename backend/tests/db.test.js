const mongoose = require('mongoose');
const User = require('../models/User');
const SkillDiagnosis = require('../models/SkillDiagnosis');
const Roadmap = require('../models/Roadmap');

describe('Database Operations', () => {
    it('should create and retrieve a user with hashed password', async () => {
        const user = await User.create({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
        });

        expect(user.name).toBe('Test User');
        expect(user.email).toBe('test@example.com');
        expect(user.password).not.toBe('password123'); // Password should be hashed

        const retrievedUser = await User.findOne({ email: 'test@example.com' }).select('+password');
        expect(retrievedUser).toBeDefined();

        const isMatch = await retrievedUser.comparePassword('password123');
        expect(isMatch).toBe(true);
    });

    it('should enforce unique email', async () => {
        await User.create({
            name: 'User 1',
            email: 'unique@example.com',
            password: 'password123',
        });

        await expect(
            User.create({
                name: 'User 2',
                email: 'unique@example.com',
                password: 'password456',
            })
        ).rejects.toThrow(); // Mongoose unique validation should fail or MongoError
    });

    it('should calculate roadmap progress correctly', async () => {
        const roadmap = await Roadmap.create({
            user: new mongoose.Types.ObjectId(),
            goal: 'Learn MERN',
            currentLevel: 'beginner',
            timeline: '4 weeks',
            dailyLearningTime: '1 hour',
            category: 'Web Dev',
            title: 'Test Roadmap',
            description: 'Desc',
            milestones: [
                {
                    week: 1,
                    order: 1,
                    title: 'Week 1',
                    description: 'Desc',
                    concepts: ['HTML'],
                    practiceTasks: [],
                    projects: [],
                    isCompleted: false,
                },
                {
                    week: 2,
                    order: 2,
                    title: 'Week 2',
                    description: 'Desc',
                    concepts: ['CSS'],
                    practiceTasks: [],
                    projects: [],
                    isCompleted: false,
                }
            ],
            totalWeeks: 2
        });

        // Initial progress should be 0
        expect(roadmap.progressPercentage).toBe(0);

        // Complete first milestone
        roadmap.milestones[0].isCompleted = true;
        await roadmap.save();

        // Progress should be 50%
        expect(roadmap.progressPercentage).toBe(50);

        // Complete second milestone
        roadmap.milestones[1].isCompleted = true;
        await roadmap.save();

        // Progress should be 100%
        expect(roadmap.progressPercentage).toBe(100);
    });
});
