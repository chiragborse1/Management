import type { Response } from 'express';
import mongoose from 'mongoose';
import { Mess, Subscription } from '../models/Mess.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { createNotification } from '../services/notificationService.js';

const PLAN_DURATION_DAYS: Record<string, number> = {
  monthly: 30,
  quarterly: 90,
  half_yearly: 180,
  yearly: 365,
};

/** Requests a mess subscription. Status starts as 'pending' until the owner accepts. */
export const requestSubscription = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const studentId = req.user!._id.toString();
  const { messId, plan, startDate, autoRenew } = req.body;

  const mess = await Mess.findById(messId);
  if (!mess || !mess.isActive) throw AppError.notFound('Mess not found');

  // A student can't hold two pending/active subscriptions to the same mess
  const existing = await Subscription.findOne({
    studentId,
    messId,
    status: { $in: ['pending', 'active'] },
  });
  if (existing)
    throw AppError.conflict('You already have a pending or active subscription to this mess');

  // Start today (or the requested date), end = start + plan duration
  const start = startDate ? new Date(startDate) : new Date();
  if (Number.isNaN(start.getTime())) throw AppError.badRequest('Invalid start date');
  const end = new Date(start.getTime() + PLAN_DURATION_DAYS[plan]! * 24 * 60 * 60 * 1000);

  let subscription;
  try {
    subscription = await Subscription.create({
      studentId,
      messId,
      plan,
      status: 'pending',
      startDate: start,
      endDate: end,
      autoRenew,
      amountPaid: 0,
    });
  } catch (error) {
    // Lost the find-then-create race (partial unique index on student+mess):
    // another request created a pending/active subscription in between.
    if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) {
      throw AppError.conflict('You already have a pending or active subscription to this mess');
    }
    throw error;
  }

  // Notify the mess owner about the request
  await createNotification({
    userId: mess.ownerId.toString(),
    type: 'subscription_requested',
    title: 'New subscription request',
    message: `A student requested the ${plan} plan at ${mess.name}`,
    data: { subscriptionId: subscription._id.toString() },
  });

  sendSuccess(res, { subscription }, 201, { message: 'Subscription request submitted' });
};

export const getMySubscriptions = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const studentId = req.user!._id.toString();

  const subscriptions = await Subscription.find({ studentId })
    .populate('messId', 'name type images pricing')
    .sort({ createdAt: -1 });

  sendSuccess(res, { subscriptions });
};

export const getSubscriptionById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const studentId = req.user!._id.toString();

  const subscription = await Subscription.findOne({ _id: req.params.id, studentId }).populate(
    'messId',
    'name type images pricing operatingHours'
  );
  if (!subscription) throw AppError.notFound('Subscription not found');

  sendSuccess(res, { subscription });
};

export const cancelSubscription = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const studentId = req.user!._id.toString();

  const subscription = await Subscription.findOne({ _id: req.params.id, studentId });
  if (!subscription) throw AppError.notFound('Subscription not found');
  if (subscription.status === 'cancelled' || subscription.status === 'rejected') {
    throw AppError.badRequest('Subscription is already closed');
  }

  subscription.status = 'cancelled';
  await subscription.save();

  const mess = await Mess.findById(subscription.messId).select('ownerId name');
  if (mess) {
    await createNotification({
      userId: mess.ownerId.toString(),
      type: 'system',
      title: 'Subscription cancelled',
      message: `A student cancelled their ${subscription.plan} subscription at ${mess.name}`,
      data: { subscriptionId: subscription._id.toString() },
    });
  }

  sendSuccess(res, { subscription }, 200, { message: 'Subscription cancelled' });
};
