import type { Response } from 'express';
import { Notification } from '../models/Feedback.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';

/** Notifications are per-user; every role reads their own. */
export const getMyNotifications = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = req.user!._id.toString();

  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { userId };
  if (req.query.unreadOnly === 'true') filter.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  sendSuccess(res, {
    notifications,
    unreadCount,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

export const getUnreadCount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!._id.toString();
  const unreadCount = await Notification.countDocuments({ userId, isRead: false });
  sendSuccess(res, { unreadCount });
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!._id.toString();

  const result = await Notification.updateOne(
    { _id: req.params.id, userId },
    { $set: { isRead: true, readAt: new Date() } }
  );
  if (result.matchedCount === 0) throw AppError.notFound('Notification not found');

  sendSuccess(res, null, 200, { message: 'Marked as read' });
};

export const markAllAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!._id.toString();
  await Notification.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
  sendSuccess(res, null, 200, { message: 'All notifications marked as read' });
};
