import type { Response } from 'express';
import { Mess, Menu, Subscription } from '../models/Mess.js';
import { Student } from '../models/User.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { createNotification } from '../services/notificationService.js';

/**
 * Mess Owner module (Step 5) — everything an owner does with their own mess:
 * profile CRUD, weekly menus, subscription requests, subscribers and stats.
 * Every endpoint requires the mess_owner role (enforced in routes/messOwner.ts)
 * and all queries are scoped to the authenticated owner's mess (ownerId).
 */

const PLAN_DURATION_DAYS: Record<string, number> = {
  monthly: 30,
  quarterly: 90,
  half_yearly: 180,
  yearly: 365,
};

/** Maps a subscription plan to the matching pricing key on the Mess doc. */
const PRICING_KEY: Record<string, 'monthly' | 'quarterly' | 'halfYearly' | 'yearly'> = {
  monthly: 'monthly',
  quarterly: 'quarterly',
  half_yearly: 'halfYearly',
  yearly: 'yearly',
};

const MESS_UPDATE_FIELDS = [
  'name',
  'description',
  'hostelId',
  'address',
  'city',
  'state',
  'pincode',
  'phone',
  'email',
  'images',
  'cuisineTypes',
  'pricing',
  'operatingHours',
] as const;

const REQUEST_STATUSES = ['pending', 'active', 'cancelled', 'rejected', 'expired'];

/** The authenticated owner's mess profile, or null when none exists yet. */
const findMyMess = (ownerId: string) => Mess.findOne({ ownerId });

// ---------- Profile ----------

/** Creates the owner's mess profile (one mess per owner). */
export const createMyMess = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const ownerId = req.user!._id;

  const existing = await Mess.exists({ ownerId });
  if (existing) throw AppError.conflict('You already have a mess profile');

  const mess = await Mess.create({ ...req.body, ownerId });

  sendSuccess(res, { mess }, 201, { message: 'Mess profile created' });
};

/** Returns the owner's mess — `mess: null` (200) when none exists yet. */
export const getMyMess = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const mess = await findMyMess(req.user!._id.toString());

  sendSuccess(res, { mess: mess ?? null });
};

/** Updates the owner's mess profile (whitelisted fields only). */
export const updateMyMess = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const mess = await findMyMess(req.user!._id.toString());
  if (!mess) throw AppError.notFound('Mess profile not found');

  const updates: Record<string, unknown> = {};
  for (const field of MESS_UPDATE_FIELDS) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  if (Object.keys(updates).length === 0) throw AppError.badRequest('No updatable fields provided');

  const updated = await Mess.findByIdAndUpdate(
    mess._id,
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!updated) throw AppError.notFound('Mess profile not found');

  sendSuccess(res, { mess: updated }, 200, { message: 'Mess profile updated' });
};

// ---------- Weekly menu ----------

/** Upserts my mess's menu for a day; publishes (and notifies) when isPublished is true. */
export const upsertMenu = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { dayOfWeek } = req.params;

  const mess = await findMyMess(req.user!._id.toString());
  if (!mess) throw AppError.notFound('Mess profile not found');

  const setFields: Record<string, unknown> = {};
  if (req.body.meals !== undefined) setFields.meals = req.body.meals;
  if (req.body.isPublished !== undefined) setFields.isPublished = req.body.isPublished;
  if (Object.keys(setFields).length === 0) throw AppError.badRequest('No menu fields provided');

  const filter = { messId: mess._id, dayOfWeek };
  const existed = await Menu.exists(filter);
  const menu = await Menu.findOneAndUpdate(
    filter,
    { $set: setFields },
    { new: true, upsert: true, runValidators: true }
  );
  if (!menu) throw AppError.badRequest('Menu could not be saved');

  // Publishing notifies every active subscriber of this mess.
  if (setFields.isPublished === true) {
    const subscribers = await Subscription.find({ messId: mess._id, status: 'active' }).select(
      'studentId'
    );
    await Promise.all(
      subscribers.map((sub) =>
        createNotification({
          userId: sub.studentId.toString(),
          type: 'menu_published',
          title: 'Menu published',
          message: `${mess.name} published ${dayOfWeek}'s menu`,
          data: { dayOfWeek },
        })
      )
    );
  }

  sendSuccess(res, { menu }, existed ? 200 : 201, { message: 'Menu saved' });
};

/** Deletes my mess's menu for a day. */
export const deleteMenu = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { dayOfWeek } = req.params;

  const mess = await findMyMess(req.user!._id.toString());
  if (!mess) throw AppError.notFound('Mess profile not found');

  const result = await Menu.deleteOne({ messId: mess._id, dayOfWeek });
  if (result.deletedCount === 0) throw AppError.notFound('Menu not found');

  sendSuccess(res, { deleted: true }, 200, { message: 'Menu deleted' });
};

// ---------- Subscription requests ----------

/** Lists subscription requests for my mess (default status: pending). */
export const getRequests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const mess = await findMyMess(req.user!._id.toString());
  if (!mess) throw AppError.notFound('Mess profile not found');

  const status = req.query.status === undefined ? 'pending' : String(req.query.status);
  if (!REQUEST_STATUSES.includes(status)) throw AppError.badRequest('Invalid status filter');

  const requests = await Subscription.find({ messId: mess._id, status })
    .populate({ path: 'studentId', model: Student, select: 'name studentId phone avatar' })
    .sort({ createdAt: -1 });

  sendSuccess(res, { requests, count: requests.length });
};

/** The mess that owns a subscription, with the ownership check applied. */
const getOwnedSubscription = async (req: AuthenticatedRequest) => {
  const subscription = await Subscription.findById(req.params.id);
  if (!subscription) throw AppError.notFound('Subscription not found');

  const mess = await Mess.findById(subscription.messId);
  if (!mess || mess.ownerId.toString() !== req.user!._id.toString()) {
    throw AppError.forbidden('You do not own this mess');
  }

  return { subscription, mess };
};

/** Accepts a pending request: activates it, recomputes dates, notifies the student. */
export const acceptSubscription = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { subscription, mess } = await getOwnedSubscription(req);
  if (subscription.status !== 'pending') {
    throw AppError.badRequest('Only pending requests can be accepted');
  }

  // A request can sit for days — never backdate an accepted subscription.
  const now = new Date();
  let startDate = subscription.startDate;
  if (startDate.getTime() < now.getTime()) startDate = now;
  const endDate = new Date(
    startDate.getTime() + (PLAN_DURATION_DAYS[subscription.plan] ?? 0) * 24 * 60 * 60 * 1000
  );

  subscription.status = 'active';
  subscription.startDate = startDate;
  subscription.endDate = endDate;
  await subscription.save();

  await createNotification({
    userId: subscription.studentId.toString(),
    type: 'subscription_approved',
    title: 'Subscription approved',
    message: `Your ${subscription.plan} subscription at ${mess.name} is active`,
    data: { subscriptionId: subscription._id.toString() },
  });

  const populated = await Subscription.findById(subscription._id)
    .populate('messId', 'name type')
    .populate({ path: 'studentId', model: Student, select: 'name studentId phone avatar' });

  sendSuccess(res, { subscription: populated }, 200, { message: 'Subscription approved' });
};

/** Rejects a pending request and notifies the student with the reason. */
export const rejectSubscription = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const reason = req.body.reason as string | undefined;

  const { subscription, mess } = await getOwnedSubscription(req);
  if (subscription.status !== 'pending') {
    throw AppError.badRequest('Only pending requests can be rejected');
  }

  subscription.status = 'rejected';
  await subscription.save();

  await createNotification({
    userId: subscription.studentId.toString(),
    type: 'subscription_rejected',
    title: 'Subscription rejected',
    message: reason
      ? `Your ${subscription.plan} subscription at ${mess.name} was rejected: ${reason}`
      : `Your ${subscription.plan} subscription at ${mess.name} was rejected`,
    data: { subscriptionId: subscription._id.toString() },
  });

  const populated = await Subscription.findById(subscription._id)
    .populate('messId', 'name type')
    .populate({ path: 'studentId', model: Student, select: 'name studentId phone avatar' });

  sendSuccess(res, { subscription: populated }, 200, { message: 'Subscription rejected' });
};

// ---------- Subscribers & stats ----------

/** Lists all active subscribers of my mess (soonest expiry first). */
export const getSubscribers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const mess = await findMyMess(req.user!._id.toString());
  if (!mess) throw AppError.notFound('Mess profile not found');

  const subscribers = await Subscription.find({ messId: mess._id, status: 'active' })
    .populate({ path: 'studentId', model: Student, select: 'name studentId phone avatar' })
    .sort({ endDate: 1 });

  sendSuccess(res, { subscribers });
};

/** Aggregate stats for the owner dashboard. */
export const getStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const mess = await findMyMess(req.user!._id.toString());
  if (!mess) throw AppError.notFound('Mess profile not found');

  const [statusAgg, menusPublished, activeSubscriptions] = await Promise.all([
    Subscription.aggregate<{ _id: string; count: number }>([
      { $match: { messId: mess._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Menu.countDocuments({ messId: mess._id, isPublished: true }),
    Subscription.find({ messId: mess._id, status: 'active' }).select('plan'),
  ]);

  const countFor = (status: string): number =>
    statusAgg.find((entry) => entry._id === status)?.count ?? 0;

  // Prorate each plan's price to a monthly figure: price / planDays * 30.
  const monthlyRevenue = Math.round(
    activeSubscriptions.reduce((sum, sub) => {
      const pricingKey = PRICING_KEY[sub.plan];
      const price = pricingKey ? mess.pricing[pricingKey] : 0;
      const planDays = PLAN_DURATION_DAYS[sub.plan] ?? 0;
      return planDays > 0 ? sum + ((price ?? 0) / planDays) * 30 : sum;
    }, 0)
  );

  sendSuccess(res, {
    stats: {
      subscribers: countFor('active'),
      pendingRequests: countFor('pending'),
      monthlyRevenue,
      avgRating: mess.rating,
      totalReviews: mess.totalReviews,
      menusPublished,
    },
  });
};
