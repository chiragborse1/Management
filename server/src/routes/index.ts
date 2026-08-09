import type { Express } from 'express';
import authRoutes from './auth.js';
import hostelRoutes from './hostel.js';
import roomRoutes from './room.js';
import messRoutes from './mess.js';
import subscriptionRoutes from './subscription.js';
import paymentRoutes from './payment.js';
import complaintRoutes from './complaint.js';
import feedbackRoutes from './feedback.js';
import notificationRoutes from './notification.js';
import studentRoutes from './student.js';
import messOwnerRoutes from './messOwner.js';

/** Mounts every API sub-router under /api/<resource>. */
const routes = (app: Express): void => {
  app.use('/api/auth', authRoutes);
  app.use('/api/hostels', hostelRoutes);
  app.use('/api/rooms', roomRoutes);
  app.use('/api/mess', messRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/complaints', complaintRoutes);
  app.use('/api/feedback', feedbackRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/students', studentRoutes);
  app.use('/api/mess-owner', messOwnerRoutes);
};

export default routes;
