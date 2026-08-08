import mongoose, { Schema } from 'mongoose';
import type { Document } from 'mongoose';

export interface IFeedback extends Document {
  studentId: mongoose.Types.ObjectId;
  targetId: mongoose.Types.ObjectId;
  targetType: 'hostel' | 'mess' | 'room' | 'admin' | 'mess_owner';
  rating: number;
  comment?: string;
  categories: Array<
    | 'cleanliness'
    | 'food_quality'
    | 'service'
    | 'value_for_money'
    | 'amenities'
    | 'staff_behavior'
    | 'response_time'
    | 'overall'
  >;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<IFeedback>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ['hostel', 'mess', 'room', 'admin', 'mess_owner'],
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    categories: [
      {
        type: String,
        enum: [
          'cleanliness',
          'food_quality',
          'service',
          'value_for_money',
          'amenities',
          'staff_behavior',
          'response_time',
          'overall',
        ],
      },
    ],
    isAnonymous: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

feedbackSchema.index({ targetId: 1, targetType: 1 });
feedbackSchema.index({ studentId: 1, targetId: 1, targetType: 1 }, { unique: true });

export const Feedback = mongoose.model<IFeedback>('Feedback', feedbackSchema);

export interface IPayment extends Document {
  studentId: mongoose.Types.ObjectId;
  type: 'room_rent' | 'mess_subscription' | 'deposit' | 'maintenance' | 'other';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partial';
  method: 'cash' | 'upi' | 'card' | 'net_banking' | 'wallet';
  referenceId?: mongoose.Types.ObjectId;
  description?: string;
  transactionId?: string;
  receiptUrl?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['room_rent', 'mess_subscription', 'deposit', 'maintenance', 'other'],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'partial'],
      default: 'pending',
      index: true,
    },
    method: {
      type: String,
      enum: ['cash', 'upi', 'card', 'net_banking', 'wallet'],
      required: true,
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    transactionId: {
      type: String,
      trim: true,
      index: true,
    },
    receiptUrl: {
      type: String,
      trim: true,
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ studentId: 1, status: 1, createdAt: -1 });
paymentSchema.index({ referenceId: 1 });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    data: {
      type: Schema.Types.Mixed,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
