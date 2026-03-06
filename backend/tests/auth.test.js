const request = require('supertest');
const { app } = require('./setup');
const User = require('../models/User');

describe('Auth API Endpoints', () => {
    const validUser = {
        name: 'Test Auth User',
        email: 'auth_test@example.com',
        password: 'password123',
    };

    let token;

    describe('POST /api/v1/auth/register', () => {
        it('should register a new user and return token', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send(validUser);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.token).toBeDefined();
            expect(res.body.data.user.email).toBe(validUser.email);
        });

        it('should return 400 if user already exists', async () => {
            // First registration should succeed (setup in previous block but state is cleared between tests, wait, no it is not. it relies on DB state)
            await User.create(validUser);

            const res = await request(app)
                .post('/api/v1/auth/register')
                .send(validUser);

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/Email already registered/i);
        });

        it('should return 400 if required fields are missing', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({ email: 'no_pass@example.com' }); // Missing name and password

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/auth/login', () => {
        beforeEach(async () => {
            // Create user before trying to login
            await request(app).post('/api/v1/auth/register').send(validUser);
        });

        it('should login with valid credentials and return token', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: validUser.email, password: validUser.password });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.token).toBeDefined();
            token = res.body.data.token; // Save token for later tests
        });

        it('should return 401 for wrong password', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: validUser.email, password: 'wrongpassword' });

            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('should return 401 for non-existent email', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: 'notfound@example.com', password: 'password123' });

            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/auth/me', () => {
        beforeEach(async () => {
            const res = await request(app).post('/api/v1/auth/register').send(validUser);
            token = res.body.data.token;
        });

        it('should get user profile with valid token', async () => {
            const res = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.email).toBe(validUser.email);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).get('/api/v1/auth/me');
            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/Not authorized/i);
        });
    });

    describe('Password Reset Flow', () => {
        beforeEach(async () => {
            await request(app).post('/api/v1/auth/register').send(validUser);
        });

        it('should generate token and send email for forgot-password', async () => {
            const res = await request(app)
                .post('/api/v1/auth/forgot-password')
                .send({ email: validUser.email });

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toMatch(/Password reset email sent/i);

            // Check if user has reset token in DB
            const user = await User.findOne({ email: validUser.email });
            expect(user.resetPasswordToken).toBeDefined();
            expect(user.resetPasswordExpire).toBeDefined();
        });
    });
});
