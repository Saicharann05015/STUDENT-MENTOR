const request = require('supertest');
const { app } = require('./setup');
const User = require('../models/User');

describe('Skill Diagnosis API Endpoints', () => {
    let token;
    let userId;

    beforeEach(async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({ name: 'Diag User', email: 'diag@example.com', password: 'password123' });
        token = res.body.data.token;
        userId = res.body.data.user.id;
    });

    describe('POST /api/v1/skills/diagnose/start', () => {
        it('should start diagnosis and return first question', async () => {
            const res = await request(app)
                .post('/api/v1/skills/diagnose/start')
                .set('Authorization', `Bearer ${token}`)
                .send({ category: 'JavaScript' });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.diagnosisId).toBeDefined();
            expect(res.body.data.currentQuestion.number).toBe(1);
            expect(res.body.data.totalQuestions).toBe(9);
        });

        it('should return 400 if category is missing', async () => {
            const res = await request(app)
                .post('/api/v1/skills/diagnose/start')
                .set('Authorization', `Bearer ${token}`)
                .send({});

            expect(res.statusCode).toBe(400);
        });
    });

    describe('Diagnosis Flow', () => {
        let diagnosisId;

        beforeEach(async () => {
            const res = await request(app)
                .post('/api/v1/skills/diagnose/start')
                .set('Authorization', `Bearer ${token}`)
                .send({ category: 'JavaScript' });
            diagnosisId = res.body.data.diagnosisId;
        });

        it('should get current question', async () => {
            const res = await request(app)
                .get(`/api/v1/skills/diagnose/${diagnosisId}/current`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.currentQuestion.number).toBe(1);
        });

        it('should submit answer and move to next question', async () => {
            const res = await request(app)
                .post(`/api/v1/skills/diagnose/${diagnosisId}/answer`)
                .set('Authorization', `Bearer ${token}`)
                .send({ answer: 'My answer' });

            expect(res.statusCode).toBe(200);
            expect(res.body.data.completed).toBe(false);
            expect(res.body.data.evaluation.isCorrect).toBe(true);
            expect(res.body.data.nextQuestion.number).toBe(2);
        });

        it('should complete diagnosis after 9 answers', async () => {
            // We already have a diagnosis started. Answer 9 times.
            for (let i = 0; i < 8; i++) {
                await request(app)
                    .post(`/api/v1/skills/diagnose/${diagnosisId}/answer`)
                    .set('Authorization', `Bearer ${token}`)
                    .send({ answer: 'My answer' });
            }

            // 9th answer
            const res = await request(app)
                .post(`/api/v1/skills/diagnose/${diagnosisId}/answer`)
                .set('Authorization', `Bearer ${token}`)
                .send({ answer: 'Final answer' });

            expect(res.statusCode).toBe(200);
            expect(res.body.data.completed).toBe(true);
            expect(res.body.data.scores.programming_score).toBe(85);
            expect(res.body.data.overallLevel).toBeDefined();
        });
    });
});
