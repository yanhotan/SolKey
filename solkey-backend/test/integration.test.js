const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/user.model');
const { generateToken } = require('../src/middleware/auth.middleware');

describe('Security Integration Tests', () => {
    let testUser;
    let authToken;

    beforeAll(async () => {
        // Create test user
        testUser = await User.create({
            email: 'test@example.com',
            name: 'Test User',
            password: 'securePassword123!'
        });
        authToken = generateToken(testUser);
    });

    afterAll(async () => {
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    describe('Security Headers', () => {
        it('should set security headers correctly', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.headers['strict-transport-security']).toBeDefined();
            expect(response.headers['x-frame-options']).toBe('DENY');
            expect(response.headers['x-xss-protection']).toBe('1; mode=block');
            expect(response.headers['x-content-type-options']).toBe('nosniff');
        });
    });

    describe('Rate Limiting', () => {
        it('should limit repeated requests to auth endpoints', async () => {
            for (let i = 0; i < 60; i++) {
                await request(app)
                    .post('/api/auth/login')
                    .send({ email: 'test@example.com', password: 'password' });
            }

            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: 'password' })
                .expect(429);

            expect(response.body.message).toContain('Too many requests');
        });
    });

    describe('Authentication', () => {
        it('should reject invalid tokens', async () => {
            const response = await request(app)
                .get('/api/projects')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(response.body.message).toBe('Invalid token');
        });

        it('should accept valid tokens', async () => {
            await request(app)
                .get('/api/projects')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
    });

    describe('Input Validation', () => {
        it('should reject large request bodies', async () => {
            const largeBody = { data: 'x'.repeat(3 * 1024 * 1024) }; // 3MB
            const response = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${authToken}`)
                .send(largeBody)
                .expect(413);

            expect(response.body.message).toContain('Request entity too large');
        });

        it('should sanitize request body', async () => {
            const maliciousBody = {
                name: 'Test Project ${process.env.SECRET}',
                description: '{"$ne": null}'
            };

            const response = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${authToken}`)
                .send(maliciousBody)
                .expect(201);

            expect(response.body.name).not.toContain('${');
            expect(response.body.description).not.toContain('$ne');
        });
    });

    describe('Database Security', () => {
        it('should enforce schema validation', async () => {
            const invalidProject = {
                // Missing required name field
                owner: testUser._id
            };

            const response = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidProject)
                .expect(400);

            expect(response.body.message).toContain('name');
        });
    });
});