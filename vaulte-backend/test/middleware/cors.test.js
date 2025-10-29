const express = require('express');
const request = require('supertest');
const { createCors } = require('../../src/middleware/cors');

describe('CORS Middleware', () => {
  test('allows configured origin and sets headers', async () => {
    process.env.CORS_ORIGIN = 'http://example.com';
    const app = express();
    app.use(createCors());
    app.get('/ok', (req, res) => res.json({ ok: true }));

    const res = await request(app)
      .get('/ok')
      .set('Origin', 'http://example.com');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://example.com');
  });
});