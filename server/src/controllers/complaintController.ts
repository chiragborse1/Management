import type { Response } from 'express';
import { Complaint, ComplaintComment } from '../models/Complaint.js';
import { Admin } from '../models/User.js';
import type { IStudent } from '../models/User.js';
import { Hostel, Room } from '../models/Hostel.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { createNotification } from '../services/notificationService.js';

/** Student raises a complaint against their hostel (or a room). */
export const createComplaint = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const student = req.user as IStudent;
  const studentId = student._id.toString();
  const { hostelId, roomId, category, priority, title, description, images } = req.body;

  // Cross-tenant guard: students may only complain about their own hostel.
  // Without this, any authenticated student could spam arbitrary hostels'
  // admins and pollute their complaint kanban.
  const hostel = await Hostel.findById(hostelId);
  if (!hostel || !hostel.isActive) throw AppError.notFound('Hostel not found');
  if (!student.hostelId || student.hostelId.toString() !== hostelId) {
    throw AppError.forbidden('You can only raise complaints for your own hostel');
  }
  // A room reference, if supplied, must belong to the same hostel.
  if (roomId) {
    const room = await Room.findById(roomId);
    if (!room || room.hostelId.toString() !== hostelId) {
      throw AppError.badRequest('Invalid room for this hostel');
    }
  }

  const complaint = await Complaint.create({
    studentId,
    hostelId,
    roomId,
    category,
    priority,
    status: 'submitted',
    title,
    description,
    images,
  });

  // Notify every admin of that hostel so it lands on their kanban
  const admins = await Admin.find({ hostelId }).select('_id');
  await Promise.all(
    admins.map((admin) =>
      createNotification({
        userId: admin._id.toString(),
        type: 'complaint_submitted',
        title: 'New complaint',
        message: `${title} (${priority} priority)`,
        data: { complaintId: complaint._id.toString() },
      })
    )
  );

  sendSuccess(res, { complaint }, 201, { message: 'Complaint submitted' });
};

export const getMyComplaints = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const studentId = req.user!._id.toString();

  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { studentId };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;

  const [complaints, total] = await Promise.all([
    Complaint.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Complaint.countDocuments(filter),
  ]);

  sendSuccess(res, {
    complaints,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

/** Students can only view their own complaints (admins get their own module later). */
export const getComplaintById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const studentId = req.user!._id.toString();

  const complaint = await Complaint.findOne({ _id: req.params.id, studentId });
  if (!complaint) throw AppError.notFound('Complaint not found');

  const comments = await ComplaintComment.find({
    complaintId: complaint._id,
    isInternal: false,
  }).sort({
    createdAt: 1,
  });

  sendSuccess(res, { complaint, comments });
};

/** Students can attach a comment to their complaint. */
export const addComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const studentId = req.user!._id.toString();
  const { message } = req.body;

  const complaint = await Complaint.findOne({ _id: req.params.id, studentId });
  if (!complaint) throw AppError.notFound('Complaint not found');

  const comment = await ComplaintComment.create({
    complaintId: complaint._id,
    userId: studentId,
    userRole: 'student',
    message,
    isInternal: false,
  });

  // Ping the hostel admins again so they see the follow-up
  const admins = await Admin.find({ hostelId: complaint.hostelId }).select('_id');
  await Promise.all(
    admins.map((admin) =>
      createNotification({
        userId: admin._id.toString(),
        type: 'complaint_updated',
        title: 'Complaint updated',
        message: `A student replied to "${complaint.title}"`,
        data: { complaintId: complaint._id.toString() },
      })
    )
  );

  sendSuccess(res, { comment }, 201);
};
