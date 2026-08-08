import type { Response } from 'express';
import { Student } from '../models/User.js';
import { Room, RoomAllocation } from '../models/Hostel.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';

/** Full student profile with hostel + room populated. */
export const getMyProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const studentId = req.user!._id.toString();

  const student = await Student.findById(studentId)
    .populate('hostelId', 'name address city phone')
    .populate('roomId', 'roomNumber floor type rentPerMonth');
  if (!student) throw AppError.notFound('Student not found');

  sendSuccess(res, { student });
};

/** Updates editable profile fields (whitelist — students can't change role/email/studentId). */
export const updateMyProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const studentId = req.user!._id.toString();

  const allowedFields = ['name', 'phone', 'avatar', 'address', 'parentPhone', 'emergencyContact'];
  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  if (Object.keys(updates).length === 0) throw AppError.badRequest('No updatable fields provided');

  const student = await Student.findByIdAndUpdate(
    studentId,
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!student) throw AppError.notFound('Student not found');

  sendSuccess(res, { student }, 200, { message: 'Profile updated' });
};

/** Current room + allocation history for the student. */
export const getMyRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const studentId = req.user!._id.toString();

  const student = await Student.findById(studentId).select('roomId');
  if (!student) throw AppError.notFound('Student not found');

  if (!student.roomId) {
    sendSuccess(res, { room: null, allocation: null });
    return;
  }

  const [room, allocation] = await Promise.all([
    Room.findById(student.roomId).populate('hostelId', 'name address'),
    RoomAllocation.findOne({ studentId, isActive: true }).sort({ allocatedAt: -1 }),
  ]);

  sendSuccess(res, { room, allocation });
};
