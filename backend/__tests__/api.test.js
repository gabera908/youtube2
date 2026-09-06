jest.mock('../config/database', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
  release: jest.fn(),
}));

const request = require('supertest');
const app = require('../app');
const pool = require('../config/database');

describe('API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return health status when DB connected', async () => {
      pool.query.mockResolvedValue([[{ 1: 1 }]]);
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('database', 'connected');
    });

    it('should return 500 when DB fails', async () => {
      pool.query.mockRejectedValue(new Error('Connection refused'));
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/videos', () => {
    it('should return list of videos', async () => {
      pool.query
        .mockResolvedValueOnce([[{ id: 1, title: 'Test' }]])
        .mockResolvedValueOnce([[{ total: 1 }]]);
      const res = await request(app).get('/api/videos');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should support pagination', async () => {
      pool.query
        .mockResolvedValueOnce([[{ id: 1, title: 'Test' }]])
        .mockResolvedValueOnce([[{ total: 10 }]]);
      const res = await request(app).get('/api/videos?page=1&limit=5');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination).toHaveProperty('page', 1);
      expect(res.body.pagination).toHaveProperty('limit', 5);
    });

    it('should support search', async () => {
      pool.query
        .mockResolvedValueOnce([[{ id: 1, title: 'Test video' }]])
        .mockResolvedValueOnce([[{ total: 1 }]]);
      const res = await request(app).get('/api/videos?search=test');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });

    it('should support category filter', async () => {
      pool.query
        .mockResolvedValueOnce([[{ id: 1, title: 'Tech video' }]])
        .mockResolvedValueOnce([[{ total: 1 }]]);
      const res = await request(app).get('/api/videos?category=tech');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });

    it('should handle DB errors gracefully', async () => {
      pool.query.mockRejectedValue(new Error('DB error'));
      const res = await request(app).get('/api/videos');
      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/videos/:id', () => {
    it('should return 404 for non-existent video', async () => {
      pool.query.mockResolvedValue([[]]);
      const res = await request(app).get('/api/videos/99999');
      expect(res.statusCode).toBe(404);
    });

    it('should return video when found', async () => {
      pool.query.mockResolvedValue([
        [{ id: 1, title: 'Test', url: 'https://youtube.com/watch?v=abc' }],
      ]);
      const res = await request(app).get('/api/videos/1');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });
  });

  describe('POST /api/videos', () => {
    it('should return 400 for missing required fields', async () => {
      const res = await request(app).post('/api/videos').send({});
      expect(res.statusCode).toBe(400);
    });

    it('should return 400 for invalid title', async () => {
      const res = await request(app)
        .post('/api/videos')
        .send({ title: '', url: 'https://youtube.com/watch?v=abc' });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/categories', () => {
    it('should return list of categories', async () => {
      pool.query.mockResolvedValue([[{ id: 1, name: 'Tech', slug: 'tech' }]]);
      const res = await request(app).get('/api/categories');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/channels', () => {
    it('should return list of channels', async () => {
      pool.query.mockResolvedValue([[{ id: 1, name: 'Channel', slug: 'channel' }]]);
      const res = await request(app).get('/api/channels');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/unknown');
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('success', false);
    });
  });
});
