const request = require('supertest');
const app = require('../server'); // Adjust this path according to your project structure

let token;

beforeAll(async () => {
    // Initialize a user and get a token for authenticated requests
    await request(app)
        .post('/users')
        .send({ email: 'test@test.com', password: 'password123' });

    const res = await request(app)
        .get('/connect')
        .set('Authorization', 'Basic ' + Buffer.from('test@test.com:password123').toString('base64'));
    
    token = res.body.token;
});

describe('API Endpoints', () => {
    test('GET /status', async () => {
        const res = await request(app).get('/status');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ redis: true, db: true });
    });

    test('GET /stats', async () => {
        const res = await request(app).get('/stats');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('users');
        expect(res.body).toHaveProperty('files');
    });

    test('POST /users', async () => {
        const res = await request(app)
            .post('/users')
            .send({ email: 'new@test.com', password: 'password123' });
        expect(res.status).toBe(201);
        expect(res.body.email).toBe('new@test.com');
    });

    test('GET /connect', async () => {
        const res = await request(app)
            .get('/connect')
            .set('Authorization', 'Basic ' + Buffer.from('new@test.com:password123').toString('base64'));
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    test('GET /disconnect', async () => {
        const res = await request(app)
            .get('/disconnect')
            .set('X-Token', token);
        expect(res.status).toBe(204);
    });

    test('GET /users/me', async () => {
        const res = await request(app)
            .get('/users/me')
            .set('X-Token', token);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('email', 'test@test.com');
    });

    test('POST /files', async () => {
        const res = await request(app)
            .post('/files')
            .set('X-Token', token)
            .send({
                name: 'test.txt',
                type: 'file',
                data: Buffer.from('Hello World').toString('base64')
            });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
    });

    test('GET /files/:id', async () => {
        const fileRes = await request(app)
            .post('/files')
            .set('X-Token', token)
            .send({
                name: 'test.txt',
                type: 'file',
                data: Buffer.from('Hello World').toString('base64')
            });

        const res = await request(app)
            .get(`/files/${fileRes.body.id}`)
            .set('X-Token', token);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id');
    });

    test('GET /files (pagination)', async () => {
        const res = await request(app)
            .get('/files')
            .set('X-Token', token)
            .query({ page: 1 });
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('PUT /files/:id/publish', async () => {
        const fileRes = await request(app)
            .post('/files')
            .set('X-Token', token)
            .send({
                name: 'test.txt',
                type: 'file',
                data: Buffer.from('Hello World').toString('base64')
            });

        const res = await request(app)
            .put(`/files/${fileRes.body.id}/publish`)
            .set('X-Token', token);
        expect(res.status).toBe(200);
        expect(res.body.isPublic).toBe(true);
    });

    test('PUT /files/:id/unpublish', async () => {
        const fileRes = await request(app)
            .post('/files')
            .set('X-Token', token)
            .send({
                name: 'test.txt',
                type: 'file',
                data: Buffer.from('Hello World').toString('base64')
            });

        const res = await request(app)
            .put(`/files/${fileRes.body.id}/unpublish`)
            .set('X-Token', token);
        expect(res.status).toBe(200);
        expect(res.body.isPublic).toBe(false);
    });

    test('GET /files/:id/data', async () => {
        const fileRes = await request(app)
            .post('/files')
            .set('X-Token', token)
            .send({
                name: 'test.txt',
                type: 'file',
                data: Buffer.from('Hello World').toString('base64')
            });

        const res = await request(app)
            .get(`/files/${fileRes.body.id}/data`)
            .set('X-Token', token);
        expect(res.status).toBe(200);
        expect(res.text).toBe('Hello World');
    });

    test('GET /files/:id/data with size', async () => {
        const fileRes = await request(app)
            .post('/files')
            .set('X-Token', token)
            .send({
                name: 'image.png',
                type: 'image',
                data: Buffer.from('fake image data').toString('base64')
            });

        await request(app)
            .put(`/files/${fileRes.body.id}/publish`)
            .set('X-Token', token);

        const res = await request(app)
            .get
