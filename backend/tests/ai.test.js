const request = require('supertest');
const { app } = require('./setup');
const User = require('../models/User');
const Chat = require('../models/Chat');

describe('AI Chat API Endpoints', () => {
    let token;
    let userId;

    beforeEach(async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({ name: 'Chat User', email: 'chat@example.com', password: 'password123' });
        token = res.body.data.token;
        userId = res.body.data.user.id;
    });

    describe('POST /api/ai/chat/new', () => {
        it('should start a new AI chat and return response', async () => {
            const res = await request(app)
                .post('/api/ai/chat/new')
                .set('Authorization', `Bearer ${token}`)
                .send({ message: 'Hello AI', context: 'general' });

            if (res.statusCode !== 201) console.log("ERROR BODY:", res.body);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.chatId).toBeDefined();
            expect(res.body.data.message).toMatch(/General response/i);

            // Verify chat was saved in DB
            const chat = await Chat.findById(res.body.data.chatId);
            expect(chat).toBeDefined();
            expect(chat.messages.length).toBe(2); // user msg + AI msg
        });

        it('should return 401 without auth', async () => {
            const res = await request(app)
                .post('/api/ai/chat/new')
                .send({ message: 'Hello AI' });

            expect(res.statusCode).toBe(401);
        });

        it('should return 400 for empty message', async () => {
            const res = await request(app)
                .post('/api/ai/chat/new')
                .set('Authorization', `Bearer ${token}`)
                .send({ message: '' });

            expect(res.statusCode).toBe(400);
        });
    });

    describe('POST /api/ai/chat (continue)', () => {
        let chatId;

        beforeEach(async () => {
            // First create a chat
            const chatRes = await request(app)
                .post('/api/ai/chat/new')
                .set('Authorization', `Bearer ${token}`)
                .send({ message: 'Hi' });

            chatId = chatRes.body.data.chatId;
        });

        it('should continue chat with existing chatId', async () => {
            const res = await request(app)
                .post('/api/ai/chat')
                .set('Authorization', `Bearer ${token}`)
                .send({ message: 'How are you?', chatId, context: 'doubt-solving' });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.message).toMatch(/General response/i);

            // DB should now have 4 messages (2 from before + 2 new)
            const chat = await Chat.findById(chatId);
            expect(chat.messages.length).toBe(4);
        });
    });
});
