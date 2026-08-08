import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as notificationController from '../controllers/notificationController.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notificationQuerySchema } from '../validators/index.js';

const router = Router();

router.use(authenticate);

// Notifications work for every role (students, admins, mess owners)
router.get(
  '/',
  validate(notificationQuerySchema, 'query'),
  asyncHandler(notificationController.getMyNotifications)
);
router.get('/unread-count', asyncHandler(notificationController.getUnreadCount));
router.patch('/:id/read', asyncHandler(notificationController.markAsRead));
router.patch('/read-all', asyncHandler(notificationController.markAllAsRead));

export default router;
