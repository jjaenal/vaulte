const express = require('express');
const request = require('supertest');
const { createLogger } = require('../../src/middleware/logging');

describe('Logging Middleware', () => {
  test('does not interfere with responses in test env', async () => {
    process.env.NODE_ENV = 'test';
    const app = express();
    app.use(createLogger());
    app.get('/ping', (req, res) => res.json({ pong: true }));

    const res = await request(app).get('/ping');
    expect(res.status).toBe(200);
    expect(res.body.pong).toBe(true);
  });
});