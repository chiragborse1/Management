import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../app.js';

let mongo: MongoMemoryServer;
let app: Express;

/** Reads the refresh token from the HttpOnly cookie set by the API. */
const refreshTokenFrom = (res: request.Response): string => {
  const setCookie = res.headers['set-cookie'] as unknown as string[] | undefined;
  const cookie = setCookie?.find((c) => c.startsWith('refreshToken='));
  if (!cookie) throw new Error('refreshToken cookie not set');
  return cookie.split(';')[0]!.split('=')[1]!;
};

const validStudent = {
  name: 'Test Student',
  email: 'test.student@example.com',
  phone: '+919999999999',
  password: 'StrongPass123!',
  confirmPassword: 'StrongPass123!',
  role: 'student',
  studentId: 'STU2024099',
};

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  app = createApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await mongoose.connection.dropDatabase();
});

describe('POST /api/auth/register', () => {
  it('registers a student and sets auth cookies', async () => {
    const res = await request(app).post('/api/auth/register').send(validStudent);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(validStudent.email);
    expect(res.body.data.user.password).toBeUndefined(); // never leak the hash
    expect(typeof res.body.data.accessToken).toBe('string');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app).post('/api/auth/register').send(validStudent);
    const res = await request(app).post('/api/auth/register').send(validStudent);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('USER_EXISTS');
  });

  it('rejects invalid payloads with a validation error', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validStudent, email: 'not-an-email', confirmPassword: 'different' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/auth/login', () => {
  it('returns 401 for wrong password with a consistent envelope', async () => {
    await request(app).post('/api/auth/register').send(validStudent);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validStudent.email, password: 'WrongPass123!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('logs in and returns user + access token', async () => {
    await request(app).post('/api/auth/register').send(validStudent);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validStudent.email, password: validStudent.password });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(validStudent.email);
    expect(typeof res.body.data.accessToken).toBe('string');
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user with a valid bearer token', async () => {
    const reg = await request(app).post('/api/auth/register').send(validStudent);
    const token = reg.body.data.accessToken as string;

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.studentId).toBe(validStudent.studentId);
  });

  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh (rotation)', () => {
  it('rotates the refresh token on every use', async () => {
    const reg = await request(app).post('/api/auth/register').send(validStudent);
    const refreshToken = refreshTokenFrom(reg);

    const first = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(first.status).toBe(200);
    expect(typeof first.body.data.accessToken).toBe('string');

    // Replay of the SAME token must fail — rotation revoked it
    const replay = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(replay.status).toBe(401);
    expect(replay.body.error.code).toBe('INVALID_REFRESH_TOKEN');
  });
});

describe('POST /api/auth/logout', () => {
  it('revokes the refresh token so it cannot be used again', async () => {
    const reg = await request(app).post('/api/auth/register').send(validStudent);
    const refreshToken = refreshTokenFrom(reg);
    const accessToken = reg.body.data.accessToken as string;

    const out = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });
    expect(out.status).toBe(200);

    const reuse = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(reuse.status).toBe(401);
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('always returns 200 regardless of whether the email exists', async () => {
    const existing = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: validStudent.email });
    expect(existing.status).toBe(200);

    const unknown = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@example.com' });
    expect(unknown.status).toBe(200);
  });
});

describe('404 + error envelope', () => {
  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
