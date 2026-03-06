const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// MOCK GEMINI SERVICE globally before anything else loads
jest.mock('../services/geminiService', () => {
    return {
        generateAIResponse: jest.fn().mockImplementation(async (prompt, options) => {
            const context = options?.context;

            // For roadmap refinement (put this BEFORE generation if checking shared keywords, or use specific ones)
            if (prompt.includes('Regenerate the roadmap milestones')) {
                return JSON.stringify({
                    description: 'Refined description',
                    milestones: [
                        { week: 1, title: 'Refined Week', description: 'Refined description', concepts: ['New Concept'], practiceTasks: [], projects: [] }
                    ]
                });
            }
            // For roadmap generation
            if (prompt.includes('personalized learning roadmap')) {
                return JSON.stringify({
                    title: 'Test Roadmap generated',
                    description: 'Description generated',
                    milestones: [
                        { week: 1, title: 'Week 1', description: 'Desc', concepts: ['JS'], practiceTasks: [{ id: 't1', task: 'Task 1' }], projects: [{ id: 'p1', project: 'Proj 1', description: 'Desc' }] },
                        { week: 2, title: 'Week 2', description: 'Desc', concepts: ['React'], practiceTasks: [], projects: [] }
                    ]
                });
            }
            // For diagnosis
            if (prompt.includes('exactly 9 diagnostic questions')) {
                const questions = [];
                const types = ['conceptual', 'coding', 'problem-solving'];
                const difficulties = ['easy', 'medium', 'hard'];
                for (let type of types) {
                    for (let diff of difficulties) {
                        questions.push({ type, difficulty: diff, question: `Test ${type} ${diff}?` });
                    }
                }
                return JSON.stringify(questions);
            }
            if (prompt.includes("evaluating a student's answer")) {
                return JSON.stringify({ isCorrect: true, score: 85, feedback: 'Good job testing!' });
            }
            if (prompt.includes('just completed a')) {
                return JSON.stringify({ summary: 'Great summary.', tips: ['Tip 1', 'Tip 2'] });
            }
            // For AI Chat
            let responseText = "Generic response";
            if (context === "general") responseText = "General response with a story!";
            if (context === "doubt-solving") responseText = "Here is how you solve your doubt.";
            return responseText;
        })
    };
});

// MOCK EMAIL SERVICE globally
jest.mock('../utils/sendEmail', () => {
    return jest.fn().mockResolvedValue({});
});

const app = require('../app');

let mongoServer;

// Connect to in-memory DB before tests
beforeAll(async () => {
    // Close existing connection if any
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

// Clean up collections between tests
afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});

// Disconnect and stop server after all tests
afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    if (mongoServer) {
        await mongoServer.stop();
    }
});

module.exports = { app };
