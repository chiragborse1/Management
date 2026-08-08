import mongoose, { Schema } from 'mongoose';
import type { Document } from 'mongoose';

export interface IComplaint extends Document {
  studentId: mongoose.Types.ObjectId;
  hostelId: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId;
  category:
    | 'cleanliness'
    | 'maintenance'
    | 'food_quality'
    | 'water_supply'
    | 'electricity'
    | 'internet'
    | 'security'
    | 'noise'
    | 'roommate'
    | 'mess_service'
    | 'billing'
    | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'submitted' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed' | 'rejected';
  title: string;
  description: string;
  images: string[];
  assignedTo?: mongoose.Types.ObjectId;
  resolution?: string;
  resolvedAt?: Date;
  feedback?: {
    rating: number;
    comment?: string;
    submittedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const complaintSchema = new Schema<IComplaint>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    hostelId: {
      type: Schema.Types.ObjectId,
      ref: 'Hostel',
      required: true,
      index: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      index: true,
    },
    category: {
      type: String,
      enum: [
        'cleanliness',
        'maintenance',
        'food_quality',
        'water_supply',
        'electricity',
        'internet',
        'security',
        'noise',
        'roommate',
        'mess_service',
        'billing',
        'other',
      ],
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['submitted', 'acknowledged', 'in_progress', 'resolved', 'closed', 'rejected'],
      default: 'submitted',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      index: true,
    },
    resolution: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    resolvedAt: {
      type: Date,
    },
    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String, trim: true, maxlength: 1000 },
      submittedAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
complaintSchema.index({ studentId: 1, status: 1 });
complaintSchema.index({ hostelId: 1, status: 1, priority: -1, createdAt: -1 });
complaintSchema.index({ assignedTo: 1, status: 1 });
complaintSchema.index({ createdAt: -1 });

export const Complaint = mongoose.model<IComplaint>('Complaint', complaintSchema);

export interface IComplaintComment extends Document {
  complaintId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userRole: 'student' | 'admin';
  message: string;
  isInternal: boolean;
  createdAt: Date;
}

const complaintCommentSchema = new Schema<IComplaintComment>(
  {
    complaintId: {
      type: Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    userRole: {
      type: String,
      enum: ['student', 'admin'],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    isInternal: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

complaintCommentSchema.index({ complaintId: 1, createdAt: 1 });

export const ComplaintComment = mongoose.model<IComplaintComment>(
  'ComplaintComment',
  complaintCommentSchema
);
