import type { Response } from 'express';
import mongoose from 'mongoose';
import { Feedback } from '../models/Feedback.js';
import { Mess } from '../models/Mess.js';
import { Hostel, Room } from '../models/Hostel.js';
import { Admin } from '../models/User.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { createNotification } from '../services/notificationService.js';

const TARGET_MODELS: Record<
  string,
  (id: string) => Promise<{ ownerId?: string; name?: string } | null>
> = {
  mess: async (id) => Mess.findById(id).select('ownerId name'),
  hostel: async (id) => Hostel.findById(id).select('name'),
  room: async (id) => Room.findById(id),
  admin: async (id) => Admin.findById(id).select('name'),
  mess_owner: async (id) => Mess.findOne({ ownerId: id }).select('ownerId name'),
};

/**
 * Student gives a rating + optional comment for a hostel/mess/room/etc.
 * One review per (student, target) — re-submitting updates the existing one.
 */
export const createFeedback = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const studentId = req.user!._id.toString();
  const { targetId, targetType, rating, comment, categories, isAnonymous } = req.body;

  // Sanity-check the target exists
  const lookup = TARGET_MODELS[targetType];
  if (!lookup) throw AppError.badRequest('Invalid target type');
  const target = await lookup(targetId);
  if (!target) throw AppError.notFound(`${targetType} not found`);

  // Upsert semantics: one review per student per target
  const feedback = await Feedback.findOneAndUpdate(
    { studentId, targetId, targetType },
    { $set: { rating, comment, categories, isAnonymous } },
    { new: true, upsert: true, runValidators: true }
  );

  // Recompute the mess's aggregate rating so browse endpoints stay accurate
  if (targetType === 'mess') {
    const agg = await Feedback.aggregate([
      { $match: { targetId: new mongoose.Types.ObjectId(targetId), targetType: 'mess' } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    const row = agg[0];
    await Mess.findByIdAndUpdate(targetId, {
      $set: { rating: Math.round((row?.avg ?? rating) * 10) / 10, totalReviews: row?.count ?? 1 },
    });
  }

  // Notify the mess owner when someone reviews their mess
  if (targetType === 'mess' && target.ownerId) {
    await createNotification({
      userId: target.ownerId.toString(),
      type: 'feedback_received',
      title: 'New review',
      message: `Someone rated your mess ${rating}/5`,
      data: { targetId },
    });
  }

  sendSuccess(res, { feedback }, 201, { message: 'Feedback submitted' });
};

export const getMyFeedback = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const studentId = req.user!._id.toString();
  const feedback = await Feedback.find({ studentId }).sort({ createdAt: -1 });
  sendSuccess(res, { feedback });
};

/** Public ratings for a target (mess/hostel) — used for rating displays. */
export const getTargetFeedback = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { targetType, targetId } = req.params;

  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { targetId, targetType };
  // Anonymous reviews show no author info in public listings
  const [feedback, total] = await Promise.all([
    Feedback.find(filter)
      .select('-studentId -isAnonymous')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Feedback.countDocuments(filter),
  ]);

  sendSuccess(res, {
    feedback,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};
