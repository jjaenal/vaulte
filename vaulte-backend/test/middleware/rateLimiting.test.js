const express = require('express');
const request = require('supertest');

const {
  generalLimiter,
  writeLimiter,
  authLimiter,
  progressiveSlowdown,
  rateLimitInfo,
  createDynamicLimiter
} = require('../../src/middleware/rateLimiting');

describe('Rate Limiting Middleware', () => {
  test('createDynamicLimiter should return 429 after exceeding max', async () => {
    const app = express();
    const limiter = createDynamicLimiter({ windowMs: 60 * 1000, max: 3, message: 'Too many requests' });

    app.use(rateLimitInfo);
    app.use(limiter);
    app.get('/test', (req, res) => res.status(200).json({ ok: true }));

    // 3 allowed requests
    await request(app).get('/test').expect(200);
    await request(app).get('/test').expect(200);
    await request(app).get('/test').expect(200);
    // 4th should be rate limited
    const res = await request(app).get('/test').expect(429);
    expect(res.body.error).toBe('Rate limit exceeded');
    expect(res.body.message).toBe('Too many requests');
    expect(res.headers['x-ratelimit-limit']).toBeDefined();
    expect(res.headers['x-ratelimit-remaining']).toBeDefined();
  });

  test('writeLimiter should limit POST operations', async () => {
    const app = express();
    app.use(express.json());
    app.use(writeLimiter);
    app.post('/write', (req, res) => res.status(201).json({ ok: true }));

    // 50 allowed requests (but we only send 5 for test brevity)
    for (let i = 0; i < 5; i++) {
      await request(app).post('/write').send({ i }).expect(201);
    }

    // Create a strict limiter to assert 429 behavior without sending 50+ requests
    const strictLimiter = createDynamicLimiter({ windowMs: 60 * 1000, max: 2, message: 'Write limit exceeded' });
    const app2 = express();
    app2.use(express.json());
    app2.use(strictLimiter);
    app2.post('/write', (req, res) => res.status(201).json({ ok: true }));

    await request(app2).post('/write').send({ i: 1 }).expect(201);
    await request(app2).post('/write').send({ i: 2 }).expect(201);
    await request(app2).post('/write').send({ i: 3 }).expect(429);
  });

  test('generalLimiter applies globally', async () => {
    const app = express();
    app.use(generalLimiter);
    app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

    // We cannot exceed 1000 in test; just ensure it allows normal requests
    await request(app).get('/health').expect(200);
  });

  test('authLimiter skips successful requests', async () => {
    const app = express();
    app.use(authLimiter);
    app.post('/login', (req, res) => res.status(200).json({ success: true }));

    // Send more than max successful requests; should not be limited due to skipSuccessfulRequests: true
    for (let i = 0; i < 15; i++) {
      await request(app).post('/login').expect(200);
    }
  });

  test('progressiveSlowdown adds delay after threshold (smoke)', async () => {
    const app = express();
    app.use(progressiveSlowdown);
    app.get('/test', (req, res) => res.status(200).json({ ok: true }));

    // Just ensure requests still succeed; measuring actual delay is flaky
    for (let i = 0; i < 5; i++) {
      await request(app).get('/test').expect(200);
    }
  });
});