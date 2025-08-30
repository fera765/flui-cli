import request from 'supertest';
import { app } from '@/app';
import { prisma } from '@/database/client';

describe('User API Integration', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/v1/users', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/v1/users')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          email: userData.email,
          name: userData.name,
        },
      });
      
      expect(response.body.data.password).toBeUndefined();
      
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      
      expect(user).toBeTruthy();
    });

    it('should return 400 for duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      };

      await prisma.user.create({ data: userData });

      const response = await request(app)
        .post('/api/v1/users')
        .send(userData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('already exists'),
      });
    });
  });

  describe('GET /api/v1/users', () => {
    it('should return all users', async () => {
      await prisma.user.createMany({
        data: [
          { email: 'user1@example.com', password: 'pass1', name: 'User 1' },
          { email: 'user2@example.com', password: 'pass2', name: 'User 2' },
        ],
      });

      const response = await request(app)
        .get('/api/v1/users')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ email: 'user1@example.com' }),
          expect.objectContaining({ email: 'user2@example.com' }),
        ]),
      });
    });

    it('should support pagination', async () => {
      for (let i = 1; i <= 15; i++) {
        await prisma.user.create({
          data: {
            email: `user${i}@example.com`,
            password: 'password',
            name: `User ${i}`,
          },
        });
      }

      const response = await request(app)
        .get('/api/v1/users?page=2&limit=5')
        .expect(200);

      expect(response.body.data).toHaveLength(5);
      expect(response.body.meta).toMatchObject({
        page: 2,
        limit: 5,
        total: 15,
        totalPages: 3,
      });
    });
  });
});