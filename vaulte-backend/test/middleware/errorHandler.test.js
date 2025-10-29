const express = require('express');
const request = require('supertest');
const { errorHandler } = require('../../src/middleware/errorHandler');

describe('Error Handler Middleware', () => {
  test('returns 500 and hides stack in test env', async () => {
    const app = express();
    app.get('/boom', () => {
      throw new Error('Boom');
    });
    app.use(errorHandler);

    const res = await request(app).get('/boom');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe(true);
    expect(res.body.message).toBe('Boom');
    expect(res.body.stack).toBeUndefined();
  });
});