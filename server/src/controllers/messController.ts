import type { Response } from 'express';
import { Mess, Menu } from '../models/Mess.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * Student-facing mess browsing. Mess creation/management belongs to the
 * Mess Owner module (Step 5) — these endpoints are read-only for everyone
 * except owners editing their own mess.
 */

const sanitizeMess = (mess: object) => {
  // Students only need the public face of a mess — never leak internal fields
  const { ownerId, ...pub } = mess as { ownerId?: unknown } & Record<string, unknown>;
  void ownerId;
  return pub;
};

const DAY_ORDER: Record<string, number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
};

export const listMesses = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { isActive: true };
  if (req.query.type) filter.type = req.query.type;
  if (req.query.city) filter.city = req.query.city;
  if (req.query.search) {
    // Text search across name/description/cuisine (text index defined on the model)
    filter.$text = { $search: String(req.query.search) };
  }

  const [messes, total] = await Promise.all([
    Mess.find(filter)
      .select('-ownerId')
      .sort({ rating: -1, totalReviews: -1 })
      .skip(skip)
      .limit(limit),
    Mess.countDocuments(filter),
  ]);

  sendSuccess(res, { messes, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
};

export const getMessById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const mess = await Mess.findById(req.params.id);
  if (!mess || !mess.isActive) throw AppError.notFound('Mess not found');

  sendSuccess(res, { mess: sanitizeMess(mess.toObject()) });
};

export const getMessMenuToday = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  // Day name in lowercase for the dayOfWeek field; date-first weekday
  const day = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const menu = await Menu.findOne({
    messId: req.params.id,
    $or: [{ dayOfWeek: day }, { date: today }],
    isPublished: true,
  });

  if (!menu) {
    sendSuccess(res, { menu: null });
    return;
  }
  sendSuccess(res, { menu });
};

export const getMessMenuByDay = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const day = req.query.day as string | undefined;
  const date = req.query.date as string | undefined;

  const filter: Record<string, unknown> = { messId: req.params.id, isPublished: true };
  if (day) filter.dayOfWeek = day;
  if (date) filter.date = new Date(date);

  const menu = await Menu.findOne(filter);
  if (!menu) {
    sendSuccess(res, { menu: null });
    return;
  }
  sendSuccess(res, { menu });
};

export const getMessWeeklyMenu = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const menus = await Menu.find({ messId: req.params.id, isPublished: true });
  // Sort by calendar week order (monday first), not alphabetical day names
  menus.sort((a, b) => (DAY_ORDER[a.dayOfWeek] ?? 0) - (DAY_ORDER[b.dayOfWeek] ?? 0));

  sendSuccess(res, { menus });
};
