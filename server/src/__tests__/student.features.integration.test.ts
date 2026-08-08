import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../app.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
  User,
  Student,
  Hostel,
  Room,
  RoomAllocation,
  Mess,
  Menu,
  Subscription,
  Feedback,
  Notification,
} from '../models/index.js';
import type { IMenu } from '../models/index.js';

let mongo: MongoMemoryServer;
let app: Express;

// ---------- Fixture helpers ----------

/** Registers a student through the real API and returns the supertest response. */
const registerStudent = async (app: Express, overrides: Record<string, unknown> = {}) =>
  request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test Student',
      email: 'student@example.com',
      phone: '+919876543210',
      password: 'StrongPass123!',
      confirmPassword: 'StrongPass123!',
      role: 'student',
      studentId: 'STU2024001',
      ...overrides,
    });

/** Extracts the access token from a register/login response. */
const authToken = (res: request.Response): string => res.body.data.accessToken as string;

/** Extracts the created user's _id from a register response. */
const studentIdOf = (res: request.Response): string => res.body.data.user._id as string;

/** Bearer header object for supertest .set(). */
const auth = (token: string): { Authorization: string } => ({ Authorization: `Bearer ${token}` });

const createMessOwner = async () =>
  User.create({
    name: 'Mess Owner',
    email: 'owner@example.com',
    phone: '+919000000001',
    password: 'StrongPass123!',
    role: 'mess_owner',
    businessName: 'Test Mess Co',
  });

const createMess = async (
  ownerId: mongoose.Types.ObjectId,
  overrides: Record<string, unknown> = {}
) =>
  Mess.create({
    name: 'Test Mess',
    description: 'Pure veg mess serving healthy meals',
    type: 'outside',
    ownerId,
    address: '123 Main Street',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411007',
    phone: '+919000000003',
    email: 'mess@example.com',
    cuisineTypes: ['North Indian'],
    pricing: { monthly: 3500, quarterly: 9900, halfYearly: 18900, yearly: 36000 },
    operatingHours: {
      breakfast: { start: '07:30', end: '09:30' },
      lunch: { start: '12:00', end: '14:30' },
      dinner: { start: '19:00', end: '21:30' },
    },
    ...overrides,
  });

/** Creates a hostel plus an admin user whose hostelId points back at it. */
const createHostelWithAdmin = async () => {
  const hostel = await Hostel.create({
    name: 'Sunrise Hostel',
    description: 'A comfortable student hostel in Pune',
    address: '45 College Road',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411007',
    phone: '+919000000004',
    email: 'hostel@example.com',
    adminId: new mongoose.Types.ObjectId(),
  });
  const admin = await User.create({
    name: 'Hostel Admin',
    email: 'admin@example.com',
    phone: '+919000000002',
    password: 'StrongPass123!',
    role: 'admin',
    hostelId: hostel._id.toString(),
  });
  await Hostel.updateOne({ _id: hostel._id }, { $set: { adminId: admin._id } });
  return { hostel, admin };
};

const createRoom = async (hostelId: mongoose.Types.ObjectId) =>
  Room.create({
    hostelId,
    roomNumber: '101',
    floor: 1,
    type: 'double',
    capacity: 2,
    rentPerMonth: 6500,
    depositAmount: 13000,
    currentOccupancy: 1,
    status: 'available',
  });

/** Attaches the student to a hostel + room (mirrors what an admin allocation does). */
const attachStudent = async (
  studentId: string,
  hostelId: mongoose.Types.ObjectId,
  roomId: mongoose.Types.ObjectId
): Promise<void> => {
  await Student.updateOne({ _id: studentId }, { $set: { hostelId, roomId } });
};

/** Attaches the student to a hostel only (required before raising complaints). */
const attachHostel = async (
  studentId: string,
  hostelId: mongoose.Types.ObjectId
): Promise<void> => {
  await Student.updateOne({ _id: studentId }, { $set: { hostelId } });
};

const createMenu = async (
  messId: mongoose.Types.ObjectId,
  dayOfWeek: IMenu['dayOfWeek'],
  isPublished = true
) =>
  Menu.create({
    messId,
    dayOfWeek,
    meals: {
      breakfast: [{ name: 'Idli', isVeg: true }],
      lunch: [{ name: 'Rice Dal', isVeg: true }],
      dinner: [{ name: 'Roti Sabzi', isVeg: true }],
    },
    isPublished,
  });

const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

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
  // reset it so every test can register a fresh student.
  await authLimiter.resetKey('::ffff:127.0.0.1');
});

describe('Mess browsing', () => {
  it('lists active messes without leaking ownerId', async () => {
    const owner = await createMessOwner();
    await createMess(owner._id);
    await createMess(owner._id, { name: 'Hostel Mess', type: 'hostel' });

    const reg = await registerStudent(app);
    const res = await request(app)
      .get('/api/mess')
      .set(auth(authToken(reg)));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const messes = res.body.data.messes as Array<Record<string, unknown>>;
    expect(messes).toHaveLength(2);
    for (const mess of messes) {
      expect(mess.ownerId).toBeUndefined();
    }
  });

  it('returns a single mess without ownerId', async () => {
    const owner = await createMessOwner();
    const mess = await createMess(owner._id);

    const reg = await registerStudent(app);
    const res = await request(app)
      .get(`/api/mess/${mess._id.toString()}`)
      .set(auth(authToken(reg)));

    expect(res.status).toBe(200);
    expect(res.body.data.mess.name).toBe('Test Mess');
    expect(res.body.data.mess.ownerId).toBeUndefined();
  });

  it('filters messes by type', async () => {
    const owner = await createMessOwner();
    await createMess(owner._id);
    await createMess(owner._id, { name: 'Hostel Mess', type: 'hostel' });

    const reg = await registerStudent(app);
    const res = await request(app)
      .get('/api/mess?type=outside')
      .set(auth(authToken(reg)));

    expect(res.status).toBe(200);
    const messes = res.body.data.messes as Array<Record<string, unknown>>;
    expect(messes).toHaveLength(1);
    expect(messes[0]?.type).toBe('outside');
    expect(messes[0]?.name).toBe('Test Mess');
  });

  it("returns today's published menu", async () => {
    const owner = await createMessOwner();
    const mess = await createMess(owner._id);
    await createMenu(mess._id, todayDay as IMenu['dayOfWeek']);

    const reg = await registerStudent(app);
    const res = await request(app)
      .get(`/api/mess/${mess._id.toString()}/menu/today`)
      .set(auth(authToken(reg)));

    expect(res.status).toBe(200);
    expect(res.body.data.menu.dayOfWeek).toBe(todayDay);
    expect(res.body.data.menu.isPublished).toBe(true);
    expect(res.body.data.menu.meals.breakfast[0].name).toBe('Idli');
  });

  it('returns the menu for a requested day', async () => {
    const owner = await createMessOwner();
    const mess = await createMess(owner._id);
    await createMenu(mess._id, 'monday');

    const reg = await registerStudent(app);
    const res = await request(app)
      .get(`/api/mess/${mess._id.toString()}/menu?day=monday`)
      .set(auth(authToken(reg)));

    expect(res.status).toBe(200);
    expect(res.body.data.menu.dayOfWeek).toBe('monday');
    expect(res.body.data.menu.isPublished).toBe(true);
  });

  it('filters out unpublished menus', async () => {
    const owner = await createMessOwner();
    const mess = await createMess(owner._id);
    await createMenu(mess._id, 'tuesday', false);

    const reg = await registerStudent(app);
    const res = await request(app)
      .get(`/api/mess/${mess._id.toString()}/menu?day=tuesday`)
      .set(auth(authToken(reg)));

    expect(res.status).toBe(200);
    expect(res.body.data.menu).toBeNull();
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/mess');
    expect(res.status).toBe(401);
  });
});

describe('Mess subscriptions', () => {
  it('creates a pending subscription and notifies the mess owner', async () => {
    const owner = await createMessOwner();
    const mess = await createMess(owner._id);

    const reg = await registerStudent(app);
    const res = await request(app)
      .post('/api/subscriptions')
      .set(auth(authToken(reg)))
      .send({ messId: mess._id.toString(), plan: 'monthly' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.subscription.status).toBe('pending');
    expect(res.body.data.subscription.studentId).toBe(studentIdOf(reg));
    expect(res.body.data.subscription.messId).toBe(mess._id.toString());

    const notification = await Notification.findOne({
      userId: owner._id,
      type: 'subscription_requested',
    });
    expect(notification).toBeTruthy();
  });

  it('rejects a duplicate subscription request with 409', async () => {
    const owner = await createMessOwner();
    const mess = await createMess(owner._id);

    const reg = await registerStudent(app);
    const authHeader = auth(authToken(reg));
    const payload = { messId: mess._id.toString(), plan: 'monthly' };
    await request(app).post('/api/subscriptions').set(authHeader).send(payload);

    const res = await request(app).post('/api/subscriptions').set(authHeader).send(payload);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('lists the student subscriptions', async () => {
    const owner = await createMessOwner();
    const mess = await createMess(owner._id);

    const reg = await registerStudent(app);
    await request(app)
      .post('/api/subscriptions')
      .set(auth(authToken(reg)))
      .send({ messId: mess._id.toString(), plan: 'monthly' });

    const res = await request(app)
      .get('/api/subscriptions/my')
      .set(auth(authToken(reg)));

    expect(res.status).toBe(200);
    expect(res.body.data.subscriptions).toHaveLength(1);
    expect(res.body.data.subscriptions[0].status).toBe('pending');
  });

  it('cancels a subscription', async () => {
    const owner = await createMessOwner();
    const mess = await createMess(owner._id);

    const reg = await registerStudent(app);
    const token = authToken(reg);
    const created = await request(app)
      .post('/api/subscriptions')
      .set(auth(token))
      .send({ messId: mess._id.toString(), plan: 'monthly' });
    const subscriptionId = created.body.data.subscription._id as string;

    const res = await request(app)
      .post(`/api/subscriptions/${subscriptionId}/cancel`)
      .set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data.subscription.status).toBe('cancelled');

    const stored = await Subscription.findById(subscriptionId);
    expect(stored?.status).toBe('cancelled');
  });
});

describe('Payments & monthly bill', () => {
  it('records a pending payment', async () => {
    const reg = await registerStudent(app);
    const res = await request(app)
      .post('/api/payments')
      .set(auth(authToken(reg)))
      .send({ type: 'room_rent', amount: 6500, method: 'upi' });

    expect(res.status).toBe(201);
    expect(res.body.data.payment.status).toBe('pending');
    expect(res.body.data.payment.type).toBe('room_rent');
    expect(res.body.data.payment.amount).toBe(6500);
  });

  it('lists the student payments', async () => {
    const reg = await registerStudent(app);
    const token = authToken(reg);
    await request(app)
      .post('/api/payments')
      .set(auth(token))
      .send({ type: 'room_rent', amount: 6500, method: 'upi' });

    const res = await request(app).get('/api/payments/my').set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data.payments).toHaveLength(1);
    expect(res.body.data.payments[0].type).toBe('room_rent');
    expect(res.body.data.payments[0].amount).toBe(6500);
  });

  it('computes the monthly bill from room rent', async () => {
    const { hostel, admin } = await createHostelWithAdmin();
    void admin;
    const room = await createRoom(hostel._id);

    const reg = await registerStudent(app);
    const studentId = studentIdOf(reg);
    await attachStudent(studentId, hostel._id, room._id);

    const res = await request(app)
      .get('/api/payments/bill/monthly')
      .set(auth(authToken(reg)));

    expect(res.status).toBe(200);
    const bill = res.body.data.bill as {
      items: Array<{ label: string; amount: number }>;
      totalDue: number;
    };
    const roomRent = bill.items.find((item) => item.label === 'Room rent');
    expect(roomRent).toBeDefined();
    expect(roomRent?.amount).toBe(6500);
    expect(bill.totalDue).toBe(6500);
  });
});

describe('Complaints', () => {
  it('submits a complaint and notifies the hostel admin', async () => {
    const { hostel, admin } = await createHostelWithAdmin();

    const reg = await registerStudent(app);
    await attachHostel(studentIdOf(reg), hostel._id);
    const res = await request(app)
      .post('/api/complaints')
      .set(auth(authToken(reg)))
      .send({
        hostelId: hostel._id.toString(),
        category: 'maintenance',
        priority: 'high',
        title: 'Water Leak',
        description: 'Water leaking in bathroom',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.complaint.status).toBe('submitted');
    expect(res.body.data.complaint.category).toBe('maintenance');

    const notification = await Notification.findOne({
      userId: admin._id,
      type: 'complaint_submitted',
    });
    expect(notification).toBeTruthy();
  });

  it('lists the student complaints', async () => {
    const { hostel } = await createHostelWithAdmin();

    const reg = await registerStudent(app);
    const token = authToken(reg);
    await attachHostel(studentIdOf(reg), hostel._id);
    await request(app).post('/api/complaints').set(auth(token)).send({
      hostelId: hostel._id.toString(),
      category: 'maintenance',
      priority: 'high',
      title: 'Water Leak',
      description: 'Water leaking in bathroom',
    });

    const res = await request(app).get('/api/complaints/my').set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data.complaints).toHaveLength(1);
    expect(res.body.data.complaints[0].status).toBe('submitted');
  });

  it('returns a complaint with an empty comment list', async () => {
    const { hostel } = await createHostelWithAdmin();

    const reg = await registerStudent(app);
    const token = authToken(reg);
    await attachHostel(studentIdOf(reg), hostel._id);
    const created = await request(app).post('/api/complaints').set(auth(token)).send({
      hostelId: hostel._id.toString(),
      category: 'maintenance',
      priority: 'high',
      title: 'Water Leak',
      description: 'Water leaking in bathroom',
    });
    const complaintId = created.body.data.complaint._id as string;

    const res = await request(app).get(`/api/complaints/${complaintId}`).set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data.complaint._id).toBe(complaintId);
    expect(res.body.data.comments).toEqual([]);
  });

  it('adds a comment to a complaint', async () => {
    const { hostel } = await createHostelWithAdmin();

    const reg = await registerStudent(app);
    const token = authToken(reg);
    await attachHostel(studentIdOf(reg), hostel._id);
    const created = await request(app).post('/api/complaints').set(auth(token)).send({
      hostelId: hostel._id.toString(),
      category: 'maintenance',
      priority: 'high',
      title: 'Water Leak',
      description: 'Water leaking in bathroom',
    });
    const complaintId = created.body.data.complaint._id as string;

    const res = await request(app)
      .post(`/api/complaints/${complaintId}/comments`)
      .set(auth(token))
      .send({ message: 'Please fix soon' });

    expect(res.status).toBe(201);
    expect(res.body.data.comment.message).toBe('Please fix soon');
    expect(res.body.data.comment.userRole).toBe('student');
  });
});

describe('Feedback', () => {
  it('submits feedback and updates the mess rating', async () => {
    const owner = await createMessOwner();
    const mess = await createMess(owner._id);

    const reg = await registerStudent(app);
    const res = await request(app)
      .post('/api/feedback')
      .set(auth(authToken(reg)))
      .send({ targetId: mess._id.toString(), targetType: 'mess', rating: 5, comment: 'Great' });

    expect(res.status).toBe(201);
    expect(res.body.data.feedback.rating).toBe(5);

    const stored = await Mess.findById(mess._id);
    expect(stored?.rating).toBe(5);
    expect(stored?.totalReviews).toBe(1);
  });

  it('upserts feedback for the same target (one doc, updated rating)', async () => {
    const owner = await createMessOwner();
    const mess = await createMess(owner._id);

    const reg = await registerStudent(app);
    const token = authToken(reg);
    const payload = (rating: number) => ({
      targetId: mess._id.toString(),
      targetType: 'mess',
      rating,
      comment: 'Great',
    });
    await request(app).post('/api/feedback').set(auth(token)).send(payload(5));

    const second = await request(app).post('/api/feedback').set(auth(token)).send(payload(4));

    expect(second.status).toBe(201);
    expect(second.body.data.feedback.rating).toBe(4);

    const count = await Feedback.countDocuments({
      studentId: studentIdOf(reg),
      targetId: mess._id,
      targetType: 'mess',
    });
    expect(count).toBe(1);

    const stored = await Mess.findById(mess._id);
    expect(stored?.rating).toBe(4);
    expect(stored?.totalReviews).toBe(1);
  });

  it('lists the student feedback', async () => {
    const owner = await createMessOwner();
    const mess = await createMess(owner._id);

    const reg = await registerStudent(app);
    const token = authToken(reg);
    await request(app)
      .post('/api/feedback')
      .set(auth(token))
      .send({ targetId: mess._id.toString(), targetType: 'mess', rating: 5, comment: 'Great' });

    const res = await request(app).get('/api/feedback/my').set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data.feedback).toHaveLength(1);
    expect(res.body.data.feedback[0].targetType).toBe('mess');
  });

  it('returns target feedback without the student id', async () => {
    const owner = await createMessOwner();
    const mess = await createMess(owner._id);

    const reg = await registerStudent(app);
    const token = authToken(reg);
    await request(app)
      .post('/api/feedback')
      .set(auth(token))
      .send({ targetId: mess._id.toString(), targetType: 'mess', rating: 5, comment: 'Great' });

    const res = await request(app)
      .get(`/api/feedback/target/mess/${mess._id.toString()}`)
      .set(auth(token));

    expect(res.status).toBe(200);
    const feedback = res.body.data.feedback as Array<Record<string, unknown>>;
    expect(feedback).toHaveLength(1);
    expect(feedback[0]?.studentId).toBeUndefined();
    expect(feedback[0]?.rating).toBe(5);
  });
});

describe('Notifications', () => {
  it('returns notifications with an unread count', async () => {
    const reg = await registerStudent(app);
    const res = await request(app)
      .get('/api/notifications')
      .set(auth(authToken(reg)));

    expect(res.status).toBe(200);
    expect(res.body.data.unreadCount).toBeGreaterThanOrEqual(1);
    expect(res.body.data.notifications.length).toBeGreaterThanOrEqual(1);
  });

  it('marks a notification as read and decreases the unread count', async () => {
    const reg = await registerStudent(app);
    const token = authToken(reg);

    const list = await request(app).get('/api/notifications').set(auth(token));
    const unreadBefore = list.body.data.unreadCount as number;
    expect(unreadBefore).toBeGreaterThanOrEqual(1);
    const notificationId = (list.body.data.notifications[0] as { _id: string })._id;

    const patch = await request(app)
      .patch(`/api/notifications/${notificationId}/read`)
      .set(auth(token));
    expect(patch.status).toBe(200);

    const after = await request(app).get('/api/notifications/unread-count').set(auth(token));
    expect(after.status).toBe(200);
    expect(after.body.data.unreadCount as number).toBeLessThan(unreadBefore);
  });
});

describe('Student profile', () => {
  it('returns the profile with populated hostel and room', async () => {
    const { hostel, admin } = await createHostelWithAdmin();
    void admin;
    const room = await createRoom(hostel._id);

    const reg = await registerStudent(app);
    await attachStudent(studentIdOf(reg), hostel._id, room._id);

    const res = await request(app)
      .get('/api/students/me')
      .set(auth(authToken(reg)));

    expect(res.status).toBe(200);
    expect(res.body.data.student.hostelId.name).toBe('Sunrise Hostel');
    expect(res.body.data.student.roomId.roomNumber).toBe('101');
  });

  it('updates the student name', async () => {
    const reg = await registerStudent(app);
    const res = await request(app)
      .patch('/api/students/me')
      .set(auth(authToken(reg)))
      .send({ name: 'New Name' });

    expect(res.status).toBe(200);
    expect(res.body.data.student.name).toBe('New Name');
    expect(res.body.data.student.email).toBe('student@example.com');
  });

  it('rejects role changes with 400', async () => {
    const reg = await registerStudent(app);
    const res = await request(app)
      .patch('/api/students/me')
      .set(auth(authToken(reg)))
      .send({ role: 'admin' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('returns the room and its active allocation', async () => {
    const { hostel, admin } = await createHostelWithAdmin();
    void admin;
    const room = await createRoom(hostel._id);

    const reg = await registerStudent(app);
    const studentId = studentIdOf(reg);
    await attachStudent(studentId, hostel._id, room._id);
    await RoomAllocation.create({ roomId: room._id, studentId, isActive: true });

    const res = await request(app)
      .get('/api/students/me/room')
      .set(auth(authToken(reg)));

    expect(res.status).toBe(200);
    expect(res.body.data.room.roomNumber).toBe('101');
    expect(res.body.data.allocation.isActive).toBe(true);
  });
});
