const request = require('supertest');
const { app } = require('./setup');
const geminiService = require('../services/geminiService');

describe('Roadmap API Endpoints', () => {
    let token;
    let userId;
    let spy;

    beforeEach(async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({ name: 'Roadmap User', email: 'roadmap@example.com', password: 'password123' });
        token = res.body.data.token;
        userId = res.body.data.user.id;

        // Mock AI response
        spy = jest.spyOn(geminiService, 'generateAIResponse').mockImplementation(async (prompt) => {
            const lowerPrompt = prompt.toLowerCase();
            if (lowerPrompt.includes('regenerate')) {
                return JSON.stringify({
                    description: 'Refined description',
                    milestones: [
                        {
                            week: 1,
                            title: 'Refined Week',
                            description: 'Refined description',
                            concepts: ['New Concept'],
                            practiceTasks: [],
                            projects: [],
                            resources: [],
                            estimatedHours: 10,
                            order: 1
                        }
                    ]
                });
            } else {
                return JSON.stringify({
                    title: 'Test Roadmap generated',
                    description: 'Description generated',
                    milestones: [
                        {
                            week: 1,
                            title: 'Week 1',
                            description: 'Desc',
                            concepts: ['JS'],
                            practiceTasks: [{ title: 'T1', description: 'Task 1', type: 'exercise' }],
                            projects: [{ title: 'P1', description: 'Proj 1', difficulty: 'easy' }],
                            resources: [],
                            estimatedHours: 10,
                            order: 1
                        },
                        {
                            week: 2,
                            title: 'Week 2',
                            description: 'Desc',
                            concepts: ['React'],
                            practiceTasks: [],
                            projects: [],
                            resources: [],
                            estimatedHours: 10,
                            order: 2
                        }
                    ]
                });
            }
        });
    });

    afterEach(() => {
        if (spy) spy.mockRestore();
    });

    describe('POST /api/v1/roadmaps/generate', () => {
        const roadmapData = {
            goal: 'Full Stack',
            currentLevel: 'beginner',
            timeline: '2 months',
            dailyLearningTime: '2 hours',
            category: 'Web Dev'
        };

        it('should generate a roadmap', async () => {
            const res = await request(app)
                .post('/api/v1/roadmaps/generate')
                .set('Authorization', `Bearer ${token}`)
                .send(roadmapData);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.milestones).toHaveLength(2);
            expect(res.body.data.title).toBeDefined();
        });

        it('should return 400 if fields are missing', async () => {
            const res = await request(app)
                .post('/api/v1/roadmaps/generate')
                .set('Authorization', `Bearer ${token}`)
                .send({ goal: 'Incomplete' });

            expect(res.statusCode).toBe(400);
        });
    });

    describe('Roadmap Milestone Completion', () => {
        let roadmapId;
        let milestoneId;

        beforeEach(async () => {
            const res = await request(app)
                .post('/api/v1/roadmaps/generate')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    goal: 'Full Stack',
                    currentLevel: 'beginner',
                    timeline: '2 months',
                    dailyLearningTime: '2 hours',
                    category: 'Web Dev'
                });
            roadmapId = res.body.data._id;
            milestoneId = res.body.data.milestones[0]._id;
        });

        it('should complete milestone and update progress', async () => {
            const res = await request(app)
                .put(`/api/v1/roadmaps/${roadmapId}/milestones/${milestoneId}/complete`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.progressPercentage).toBe(75); // 3 out of 4 completed
        });

        it('should refine a roadmap', async () => {
            const res = await request(app)
                .put(`/api/v1/roadmaps/${roadmapId}/refine`)
                .set('Authorization', `Bearer ${token}`)
                .send({ feedback: 'Make it harder' });

            expect(res.statusCode).toBe(200);
            expect(res.body.data.milestones[0].title).toBe('Refined Week');
        });
    });
});
