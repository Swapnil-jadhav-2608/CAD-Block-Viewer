// backend/tests/api.test.js
const request = require('supertest');
const app = require('../app');

test('GET /api/blocks returns 200 and array', async () => {
  const res = await request(app).get('/api/blocks');
  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body.rows)).toBe(true);
});
