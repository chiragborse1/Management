import { Notification } from '../models/Feedback.js';
import type { NotificationType } from '@shared/types';
import type { Document } from 'mongoose';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Creates a notification for a user. Used across modules (complaints,
 * payments, subscriptions) so all notifications share one code path.
 */
export const createNotification = async (input: CreateNotificationInput): Promise<Document> => {
  const notification = await Notification.create({
    userId: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    data: input.data,
    isRead: false,
  });
  return notification;
};

export const markNotificationRead = async (
  userId: string,
  notificationId: string
): Promise<boolean> => {
  const result = await Notification.updateOne(
    { _id: notificationId, userId },
    { $set: { isRead: true, readAt: new Date() } }
  );
  return result.modifiedCount > 0;
};

export const markAllNotificationsRead = async (userId: string): Promise<void> => {
  await Notification.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
};

export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  return Notification.countDocuments({ userId, isRead: false });
};
