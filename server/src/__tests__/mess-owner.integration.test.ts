import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../app.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { Mess, Subscription, Notification } from '../models/index.js';

let mongo: MongoMemoryServer;
let app: Express;

// ---------- Fixture helpers ----------

/** Registers a mess owner through the real API and returns the supertest response. */
const registerOwner = (overrides: Record<string, unknown> = {}) =>
  request(app)
    .post('/api/auth/register')
    .send({
      name: 'Mess Owner',
      email: 'owner@example.com',
      phone: '+919876000001',
      password: 'StrongPass123!',
      confirmPassword: 'StrongPass123!',
      role: 'mess_owner',
      businessName: 'Test Mess Co',
      ...overrides,
    });

/** Registers a student through the real API and returns the supertest response. */
const registerStudent = (overrides: Record<string, unknown> = {}) =>
  request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test Student',
      email: 'student@example.com',
      phone: '+919876000002',
      password: 'StrongPass123!',
      confirmPassword: 'StrongPass123!',
      role: 'student',
      studentId: 'STU2024001',
      ...overrides,
    });

const authToken = (res: request.Response): string => res.body.data.accessToken as string;
const userIdOf = (res: request.Response): string => res.body.data.user._id as string;
const auth = (token: string): { Authorization: string } => ({ Authorization: `Bearer ${token}` });

const messPayload = {
  name: 'Sunrise Mess',
  description: 'Pure veg mess serving healthy meals to students',
  type: 'outside',
  address: '123 Main Street',
  city: 'Pune',
  state: 'Maharashtra',
  pincode: '411007',
  phone: '+919876000003',
  email: 'mess@example.com',
  cuisineTypes: ['North Indian'],
  pricing: { monthly: 3500, quarterly: 9900, halfYearly: 18900, yearly: 36000 },
  operatingHours: {
    breakfast: { start: '07:30', end: '09:30' },
    lunch: { start: '12:00', end: '14:30' },
    dinner: { start: '19:00', end: '21:30' },
  },
};

const menuPayload = {
  meals: {
    breakfast: [{ name: 'Idli', isVeg: true, calories: 200 }],
    lunch: [{ name: 'Rice Dal', isVeg: true }],
    dinner: [{ name: 'Roti Sabzi', isVeg: true }],
  },
};

/** Registers an owner, creates their mess via the API, returns owner token + mess doc. */
const setupOwnerWithMess = async () => {
  const reg = await registerOwner();
  const ownerToken = authToken(reg);
  await request(app).post('/api/mess-owner/me').set(auth(ownerToken)).send(messPayload);
  const mess = (await Mess.findOne({ ownerId: userIdOf(reg) }))!;
  return { ownerToken, mess, ownerId: userIdOf(reg) };
};

/** Student requests a subscription for the given mess; returns the created subscription id. */
const requestSubscription = async (messId: string, plan = 'monthly') => {
  const reg = await registerStudent();
  const res = await request(app)
    .post('/api/subscriptions')
    .set(auth(authToken(reg)))
    .send({ messId, plan });
  expect(res.status).toBe(201);
  return { studentId: userIdOf(reg), subscriptionId: res.body.data.subscription._id as string };
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
  // The auth limiter allows only 20 /register calls per 15 min per IP —
  // reset it so every test can register fresh users.
  await authLimiter.resetKey('::ffff:127.0.0.1');
});

describe('Mess owner profile', () => {
  it('creates the mess profile and returns it via GET /me', async () => {
    const reg = await registerOwner();
    const token = authToken(reg);

    const create = await request(app).post('/api/mess-owner/me').set(auth(token)).send(messPayload);
    expect(create.status).toBe(201);
    expect(create.body.success).toBe(true);
    expect(create.body.data.mess.ownerId).toBe(userIdOf(reg));
    expect(create.body.data.mess.name).toBe('Sunrise Mess');

    const get = await request(app).get('/api/mess-owner/me').set(auth(token));
    expect(get.status).toBe(200);
    expect(get.body.data.mess.name).toBe('Sunrise Mess');
  });

  it('rejects a duplicate mess profile with 409', async () => {
    const reg = await registerOwner();
    const token = authToken(reg);
    await request(app).post('/api/mess-owner/me').set(auth(token)).send(messPayload);

    const res = await request(app).post('/api/mess-owner/me').set(auth(token)).send(messPayload);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('returns mess null when no profile exists yet', async () => {
    const reg = await registerOwner();
    const res = await request(app)
      .get('/api/mess-owner/me')
      .set(auth(authToken(reg)));
    expect(res.status).toBe(200);
    expect(res.body.data.mess).toBeNull();
  });

  it('updates the mess profile', async () => {
    const { ownerToken, ownerId } = await setupOwnerWithMess();

    const res = await request(app)
      .put('/api/mess-owner/me')
      .set(auth(ownerToken))
      .send({ name: 'Sunrise Mess 2', city: 'Mumbai' });
    expect(res.status).toBe(200);
    expect(res.body.data.mess.name).toBe('Sunrise Mess 2');
    expect(res.body.data.mess.city).toBe('Mumbai');

    const stored = await Mess.findOne({ ownerId });
    expect(stored?.name).toBe('Sunrise Mess 2');
    expect(stored?.city).toBe('Mumbai');
  });

  it('returns 404 when updating without a profile', async () => {
    const reg = await registerOwner();
    const res = await request(app)
      .put('/api/mess-owner/me')
      .set(auth(authToken(reg)))
      .send({ name: 'Updated Name' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('blocks non-owner roles with 403', async () => {
    const student = await registerStudent();
    const res = await request(app)
      .get('/api/mess-owner/me')
      .set(auth(authToken(student)));
    expect(res.status).toBe(403);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/mess-owner/me');
    expect(res.status).toBe(401);
  });
});

describe('Menu management', () => {
  it('upserts a weekly menu (201 create, 200 update)', async () => {
    const { ownerToken } = await setupOwnerWithMess();

    const create = await request(app)
      .put('/api/mess-owner/menu/monday')
      .set(auth(ownerToken))
      .send(menuPayload);
    expect(create.status).toBe(201);
    expect(create.body.data.menu.dayOfWeek).toBe('monday');
    expect(create.body.data.menu.meals.breakfast[0].name).toBe('Idli');
    expect(create.body.data.menu.isPublished).toBe(false);

    const update = await request(app)
      .put('/api/mess-owner/menu/monday')
      .set(auth(ownerToken))
      .send({ meals: { ...menuPayload.meals, lunch: [{ name: 'Rajma Chawal', isVeg: true }] } });
    expect(update.status).toBe(200);
    expect(update.body.data.menu.meals.lunch[0].name).toBe('Rajma Chawal');

    const count = await mongoose.model('Menu').countDocuments({ dayOfWeek: 'monday' });
    expect(count).toBe(1);
  });

  it('notifies active subscribers when a menu is published', async () => {
    const { ownerToken, mess } = await setupOwnerWithMess();
    const { studentId } = await requestSubscription(mess._id.toString());
    const subscription = await Subscription.findOne({ studentId });
    await request(app)
      .post(`/api/mess-owner/subscriptions/${subscription!._id.toString()}/accept`)
      .set(auth(ownerToken));

    const res = await request(app)
      .put('/api/mess-owner/menu/monday')
      .set(auth(ownerToken))
      .send({ ...menuPayload, isPublished: true });
    expect(res.status).toBe(201);
    expect(res.body.data.menu.isPublished).toBe(true);

    const notification = await Notification.findOne({
      userId: studentId,
      type: 'menu_published',
    });
    expect(notification).toBeTruthy();
    expect(notification?.message).toContain('published monday');
    expect(notification?.data?.dayOfWeek).toBe('monday');
  });

  it('does not notify subscribers when a menu is saved unpublished', async () => {
    const { ownerToken, mess } = await setupOwnerWithMess();
    const { studentId } = await requestSubscription(mess._id.toString());

    await request(app).put('/api/mess-owner/menu/monday').set(auth(ownerToken)).send(menuPayload);

    const notification = await Notification.findOne({ userId: studentId, type: 'menu_published' });
    expect(notification).toBeNull();
  });

  it('deletes a menu and 404s when it is missing', async () => {
    const { ownerToken } = await setupOwnerWithMess();
    await request(app).put('/api/mess-owner/menu/tuesday').set(auth(ownerToken)).send(menuPayload);

    const del = await request(app).delete('/api/mess-owner/menu/tuesday').set(auth(ownerToken));
    expect(del.status).toBe(200);
    expect(del.body.data.deleted).toBe(true);

    const missing = await request(app).delete('/api/mess-owner/menu/tuesday').set(auth(ownerToken));
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('NOT_FOUND');
  });

  it('rejects an invalid dayOfWeek param with 400', async () => {
    const { ownerToken } = await setupOwnerWithMess();
    const res = await request(app)
      .put('/api/mess-owner/menu/funday')
      .set(auth(ownerToken))
      .send(menuPayload);
    expect(res.status).toBe(400);
  });
});

describe('Subscription requests', () => {
  it('lists pending requests with the student populated', async () => {
    const { ownerToken, mess } = await setupOwnerWithMess();
    await requestSubscription(mess._id.toString());

    const res = await request(app).get('/api/mess-owner/requests').set(auth(ownerToken));
    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(1);
    expect(res.body.data.requests[0].status).toBe('pending');
    expect(res.body.data.requests[0].studentId.name).toBe('Test Student');
    expect(res.body.data.requests[0].studentId.studentId).toBe('STU2024001');
  });

  it('filters requests by status', async () => {
    const { ownerToken, mess } = await setupOwnerWithMess();
    const { studentId, subscriptionId } = await requestSubscription(mess._id.toString());
    await request(app)
      .post(`/api/mess-owner/subscriptions/${subscriptionId}/accept`)
      .set(auth(ownerToken));
    void studentId;

    const res = await request(app)
      .get('/api/mess-owner/requests?status=active')
      .set(auth(ownerToken));
    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(1);
    expect(res.body.data.requests[0].status).toBe('active');
  });

  it('accepts a pending request and notifies the student', async () => {
    const { ownerToken, mess } = await setupOwnerWithMess();
    const { studentId, subscriptionId } = await requestSubscription(
      mess._id.toString(),
      'quarterly'
    );

    const res = await request(app)
      .post(`/api/mess-owner/subscriptions/${subscriptionId}/accept`)
      .set(auth(ownerToken));
    expect(res.status).toBe(200);
    expect(res.body.data.subscription.status).toBe('active');
    expect(res.body.data.subscription.messId.name).toBe('Sunrise Mess');
    expect(res.body.data.subscription.studentId.name).toBe('Test Student');

    const stored = await Subscription.findById(subscriptionId);
    expect(stored?.status).toBe('active');
    // endDate was recomputed from the (fresh) startDate + 90 days
    expect(
      (stored!.endDate.getTime() - stored!.startDate.getTime()) / (24 * 60 * 60 * 1000)
    ).toBeCloseTo(90, 0);

    const notification = await Notification.findOne({
      userId: studentId,
      type: 'subscription_approved',
    });
    expect(notification).toBeTruthy();
    expect(notification?.message).toContain('quarterly subscription at Sunrise Mess');
  });

  it('rejects accepting an already-active subscription with 400', async () => {
    const { ownerToken, mess } = await setupOwnerWithMess();
    const { subscriptionId } = await requestSubscription(mess._id.toString());
    await request(app)
      .post(`/api/mess-owner/subscriptions/${subscriptionId}/accept`)
      .set(auth(ownerToken));

    const res = await request(app)
      .post(`/api/mess-owner/subscriptions/${subscriptionId}/accept`)
      .set(auth(ownerToken));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('rejects a pending request with a reason and notifies the student', async () => {
    const { ownerToken, mess } = await setupOwnerWithMess();
    const { studentId, subscriptionId } = await requestSubscription(mess._id.toString());

    const res = await request(app)
      .post(`/api/mess-owner/subscriptions/${subscriptionId}/reject`)
      .set(auth(ownerToken))
      .send({ reason: 'Kitchen closed this month' });
    expect(res.status).toBe(200);
    expect(res.body.data.subscription.status).toBe('rejected');

    const stored = await Subscription.findById(subscriptionId);
    expect(stored?.status).toBe('rejected');

    const notification = await Notification.findOne({
      userId: studentId,
      type: 'subscription_rejected',
    });
    expect(notification).toBeTruthy();
    expect(notification?.message).toContain('Kitchen closed this month');
  });

  it("forbids an owner from acting on another mess's requests", async () => {
    const { mess } = await setupOwnerWithMess();
    const { subscriptionId } = await requestSubscription(mess._id.toString());

    const other = await registerOwner({
      name: 'Other Owner',
      email: 'owner2@example.com',
      phone: '+919876000011',
      businessName: 'Other Mess Co',
    });
    const otherToken = authToken(other);
    await request(app)
      .post('/api/mess-owner/me')
      .set(auth(otherToken))
      .send({
        ...messPayload,
        name: 'Other Mess',
        email: 'other@example.com',
      });

    const accept = await request(app)
      .post(`/api/mess-owner/subscriptions/${subscriptionId}/accept`)
      .set(auth(otherToken));
    expect(accept.status).toBe(403);

    const reject = await request(app)
      .post(`/api/mess-owner/subscriptions/${subscriptionId}/reject`)
      .set(auth(otherToken))
      .send({ reason: 'Not yours' });
    expect(reject.status).toBe(403);
  });
});

describe('Subscribers', () => {
  it('lists active subscribers populated with student details', async () => {
    const { ownerToken, mess } = await setupOwnerWithMess();
    const { subscriptionId } = await requestSubscription(mess._id.toString());
    await request(app)
      .post(`/api/mess-owner/subscriptions/${subscriptionId}/accept`)
      .set(auth(ownerToken));

    const res = await request(app).get('/api/mess-owner/subscribers').set(auth(ownerToken));
    expect(res.status).toBe(200);
    expect(res.body.data.subscribers).toHaveLength(1);
    expect(res.body.data.subscribers[0].studentId.name).toBe('Test Student');
    expect(res.body.data.subscribers[0].studentId.studentId).toBe('STU2024001');
    expect(res.body.data.subscribers[0].status).toBe('active');
  });

  it('excludes pending and rejected subscriptions', async () => {
    const { ownerToken, mess } = await setupOwnerWithMess();
    await requestSubscription(mess._id.toString());

    const res = await request(app).get('/api/mess-owner/subscribers').set(auth(ownerToken));
    expect(res.status).toBe(200);
    expect(res.body.data.subscribers).toHaveLength(0);
  });
});

describe('Stats', () => {
  it('returns aggregate counts and prorated monthly revenue', async () => {
    const { ownerToken, mess } = await setupOwnerWithMess();

    // 1 pending request (monthly plan)
    await requestSubscription(mess._id.toString());
    // 1 active subscription (yearly plan → 36000/365*30 ≈ 2959/month)
    const second = await registerStudent({
      email: 'student2@example.com',
      phone: '+919876000012',
      studentId: 'STU2024002',
    });
    const created = await request(app)
      .post('/api/subscriptions')
      .set(auth(authToken(second)))
      .send({ messId: mess._id.toString(), plan: 'yearly' });
    await request(app)
      .post(`/api/mess-owner/subscriptions/${created.body.data.subscription._id}/accept`)
      .set(auth(ownerToken));

    // 1 published menu + 1 draft menu
    await request(app)
      .put('/api/mess-owner/menu/wednesday')
      .set(auth(ownerToken))
      .send({ ...menuPayload, isPublished: true });
    await request(app).put('/api/mess-owner/menu/thursday').set(auth(ownerToken)).send(menuPayload);

    const res = await request(app).get('/api/mess-owner/stats').set(auth(ownerToken));
    expect(res.status).toBe(200);
    const stats = res.body.data.stats as {
      subscribers: number;
      pendingRequests: number;
      monthlyRevenue: number;
      avgRating: number;
      totalReviews: number;
      menusPublished: number;
    };
    expect(stats.subscribers).toBe(1);
    expect(stats.pendingRequests).toBe(1);
    expect(stats.monthlyRevenue).toBe(2959);
    expect(stats.avgRating).toBe(0);
    expect(stats.totalReviews).toBe(0);
    expect(stats.menusPublished).toBe(1);
  });

  it('returns zeroed stats when there is no activity', async () => {
    const { ownerToken } = await setupOwnerWithMess();

    const res = await request(app).get('/api/mess-owner/stats').set(auth(ownerToken));
    expect(res.status).toBe(200);
    expect(res.body.data.stats).toEqual({
      subscribers: 0,
      pendingRequests: 0,
      monthlyRevenue: 0,
      avgRating: 0,
      totalReviews: 0,
      menusPublished: 0,
    });
  });
});
