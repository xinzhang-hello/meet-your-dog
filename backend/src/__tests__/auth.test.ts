import request from 'supertest';
import app from '../app';
import { prisma } from './setup';

describe('Auth Routes', () => {
  describe('POST /api/auth/login', () => {
    it('should create a new user and return token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('testuser');
    });

    it('should login existing user', async () => {
      // First create a user
      await request(app)
        .post('/api/auth/login')
        .send({ username: 'existinguser' });

      // Login again
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'existinguser' });

      expect(response.status).toBe(200);
      expect(response.body.user.username).toBe('existinguser');
    });

    it('should reject invalid username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'ab' }); // Too short

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject empty username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
    });
  });
});