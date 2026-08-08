import type { Response } from 'express';
import mongoose from 'mongoose';
import { Payment } from '../models/Feedback.js';
import { Subscription } from '../models/Mess.js';
import { Room } from '../models/Hostel.js';
import { Student } from '../models/User.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * Payment history + monthly bill for the logged-in student.
 * The monthly bill is computed on the fly from live data:
 *   room rent + active mess subscription fee − already paid this month.
 */
export const getMyPayments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const studentId = req.user!._id.toString();

  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { studentId };
  if (req.query.type) filter.type = req.query.type;
  if (req.query.status) filter.status = req.query.status;

  const [payments, total] = await Promise.all([
    Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Payment.countDocuments(filter),
  ]);

  sendSuccess(res, {
    payments,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

/** Records a payment the student initiated (e.g. UPI/cash). Status defaults to pending. */
export const createPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const studentId = req.user!._id.toString();
  const { type, amount, method, referenceId, description, transactionId } = req.body;

  const payment = await Payment.create({
    studentId,
    type,
    amount,
    method,
    status: 'pending',
    referenceId,
    description,
    transactionId,
  });

  sendSuccess(res, { payment }, 201, { message: 'Payment recorded' });
};

export const getMonthlyBill = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const studentId = req.user!._id.toString();

  const student = await Student.findById(studentId);
  if (!student) throw AppError.notFound('Student not found');

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // --- Room rent ---
  let roomRent = 0;
  let room: { rentPerMonth: number; roomNumber: string } | null = null;
  if (student.roomId) {
    room = await Room.findById(student.roomId).select('rentPerMonth roomNumber').lean();
    roomRent = room?.rentPerMonth ?? 0;
  }

  // --- Active mess subscription (fee prorated by plan duration) ---
  let messFee = 0;
  type ActiveSubscription = {
    plan: string;
    messId: { name: string; pricing: Record<string, number> } | null;
  };
  let subscription: ActiveSubscription | null = null;
  subscription = (await Subscription.findOne({
    studentId,
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now },
  })
    .populate('messId', 'name pricing')
    .lean()) as ActiveSubscription | null;

  if (subscription?.messId) {
    const pricing = subscription.messId.pricing;
    const planKey: Record<string, string> = {
      monthly: 'monthly',
      quarterly: 'quarterly',
      half_yearly: 'halfYearly',
      yearly: 'yearly',
    };
    const totalPrice = pricing[planKey[subscription.plan] ?? 'monthly'] ?? 0;
    const durationDays: Record<string, number> = {
      monthly: 30,
      quarterly: 90,
      half_yearly: 180,
      yearly: 365,
    };
    // Prorate the plan price to the current month
    messFee = Math.round((totalPrice / (durationDays[subscription.plan] ?? 30)) * 30);
  }

  // --- Already paid this month (completed payments) ---
  const paidThisMonth = await Payment.aggregate([
    {
      $match: {
        studentId: new mongoose.Types.ObjectId(studentId),
        status: 'completed',
        createdAt: { $gte: monthStart },
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const totalDue = roomRent + messFee;
  const paid = paidThisMonth[0]?.total ?? 0;
  const outstanding = Math.max(0, totalDue - paid);

  sendSuccess(res, {
    bill: {
      month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      items: [
        { label: 'Room rent', amount: roomRent, roomNumber: room?.roomNumber ?? null },
        {
          label: 'Mess subscription',
          amount: messFee,
          messName: subscription?.messId?.name ?? null,
        },
      ],
      totalDue,
      paidThisMonth: paid,
      outstanding,
    },
  });
};
