import type { Express } from 'express';
import authRoutes from './auth.js';
import hostelRoutes from './hostel.js';
import roomRoutes from './room.js';

const routes = (app: Express) => {
  app.use('/api/auth', authRoutes);
  app.use('/api/hostels', hostelRoutes);
  app.use('/api/rooms', roomRoutes);
  // More routes will be added here
};

export default routes;
