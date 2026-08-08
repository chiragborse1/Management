import mongoose, { Schema } from 'mongoose';
import type { Document } from 'mongoose';

export interface IMess extends Document {
  name: string;
  description: string;
  type: 'hostel' | 'outside';
  hostelId?: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  images: string[];
  cuisineTypes: string[];
  pricing: {
    monthly: number;
    quarterly: number;
    halfYearly: number;
    yearly: number;
    perMeal?: {
      breakfast: number;
      lunch: number;
      dinner: number;
    };
  };
  operatingHours: {
    breakfast: { start: string; end: string };
    lunch: { start: string; end: string };
    dinner: { start: string; end: string };
  };
  isActive: boolean;
  rating: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

const messSchema = new Schema<IMess>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    type: {
      type: String,
      enum: ['hostel', 'outside'],
      required: true,
      index: true,
    },
    hostelId: {
      type: Schema.Types.ObjectId,
      ref: 'Hostel',
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'MessOwner',
      required: true,
      index: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
      match: /^[1-9][0-9]{5}$/,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    cuisineTypes: [
      {
        type: String,
        trim: true,
      },
    ],
    pricing: {
      monthly: { type: Number, required: true, min: 0 },
      quarterly: { type: Number, required: true, min: 0 },
      halfYearly: { type: Number, required: true, min: 0 },
      yearly: { type: Number, required: true, min: 0 },
      perMeal: {
        breakfast: { type: Number, min: 0 },
        lunch: { type: Number, min: 0 },
        dinner: { type: Number, min: 0 },
      },
    },
    operatingHours: {
      breakfast: {
        start: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
        end: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      },
      lunch: {
        start: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
        end: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      },
      dinner: {
        start: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
        end: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Text index for search
messSchema.index({ name: 'text', description: 'text', city: 'text', cuisineTypes: 'text' });
messSchema.index({ type: 1, isActive: 1, city: 1 });

export const Mess = mongoose.model<IMess>('Mess', messSchema);

export interface IMenu extends Document {
  messId: mongoose.Types.ObjectId;
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  date?: Date;
  meals: {
    breakfast: Array<{
      name: string;
      description?: string;
      isVeg: boolean;
      allergens?: string[];
      calories?: number;
    }>;
    lunch: Array<{
      name: string;
      description?: string;
      isVeg: boolean;
      allergens?: string[];
      calories?: number;
    }>;
    dinner: Array<{
      name: string;
      description?: string;
      isVeg: boolean;
      allergens?: string[];
      calories?: number;
    }>;
  };
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const menuItemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    isVeg: { type: Boolean, default: true },
    allergens: [{ type: String, trim: true }],
    calories: { type: Number, min: 0 },
  },
  { _id: true }
);

const menuSchema = new Schema<IMenu>(
  {
    messId: {
      type: Schema.Types.ObjectId,
      ref: 'Mess',
      required: true,
      index: true,
    },
    dayOfWeek: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true,
      index: true,
    },
    date: {
      type: Date,
      index: true,
    },
    meals: {
      breakfast: [menuItemSchema],
      lunch: [menuItemSchema],
      dinner: [menuItemSchema],
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique menu per mess per day
menuSchema.index({ messId: 1, dayOfWeek: 1, date: 1 }, { unique: true });

export const Menu = mongoose.model<IMenu>('Menu', menuSchema);

export interface ISubscription extends Document {
  studentId: mongoose.Types.ObjectId;
  messId: mongoose.Types.ObjectId;
  plan: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
  status: 'active' | 'expired' | 'cancelled' | 'pending' | 'rejected';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  amountPaid: number;
  paymentHistory: Array<{
    id: string;
    amount: number;
    date: Date;
    method: 'cash' | 'upi' | 'card' | 'net_banking' | 'wallet';
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    transactionId?: string;
    receiptUrl?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentRecordSchema = new Schema(
  {
    id: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    method: {
      type: String,
      enum: ['cash', 'upi', 'card', 'net_banking', 'wallet'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    transactionId: { type: String, trim: true },
    receiptUrl: { type: String, trim: true },
  },
  { _id: false }
);

const subscriptionSchema = new Schema<ISubscription>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    messId: {
      type: Schema.Types.ObjectId,
      ref: 'Mess',
      required: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ['monthly', 'quarterly', 'half_yearly', 'yearly'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'pending', 'rejected'],
      default: 'pending',
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentHistory: [paymentRecordSchema],
  },
  {
    timestamps: true,
  }
);

subscriptionSchema.index({ studentId: 1, status: 1 });
subscriptionSchema.index({ messId: 1, status: 1 });
subscriptionSchema.index({ endDate: 1, status: 1 });

export const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema);
