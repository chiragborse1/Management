import mongoose, { Schema } from 'mongoose';
import type { Document } from 'mongoose';

export interface IHostel extends Document {
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  images: string[];
  amenities: string[];
  rules: string[];
  adminId: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const hostelSchema = new Schema<IHostel>(
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
    amenities: [
      {
        type: String,
        trim: true,
      },
    ],
    rules: [
      {
        type: String,
        trim: true,
      },
    ],
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Text index for search
hostelSchema.index({ name: 'text', description: 'text', city: 'text' });

export const Hostel = mongoose.model<IHostel>('Hostel', hostelSchema);

export interface IRoom extends Document {
  hostelId: mongoose.Types.ObjectId;
  roomNumber: string;
  floor: number;
  type: 'single' | 'double' | 'triple' | 'quad' | 'dormitory';
  capacity: number;
  currentOccupancy: number;
  rentPerMonth: number;
  depositAmount: number;
  amenities: string[];
  images: string[];
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new Schema<IRoom>(
  {
    hostelId: {
      type: Schema.Types.ObjectId,
      ref: 'Hostel',
      required: true,
      index: true,
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    floor: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ['single', 'double', 'triple', 'quad', 'dormitory'],
      required: true,
      index: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
    },
    currentOccupancy: {
      type: Number,
      default: 0,
      min: 0,
    },
    rentPerMonth: {
      type: Number,
      required: true,
      min: 0,
    },
    depositAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    amenities: [
      {
        type: String,
        trim: true,
      },
    ],
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ['available', 'occupied', 'maintenance', 'reserved'],
      default: 'available',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique room number per hostel
roomSchema.index({ hostelId: 1, roomNumber: 1 }, { unique: true });
roomSchema.index({ hostelId: 1, status: 1 });

export const Room = mongoose.model<IRoom>('Room', roomSchema);

export interface IRoomAllocation extends Document {
  roomId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  allocatedAt: Date;
  vacatedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const roomAllocationSchema = new Schema<IRoomAllocation>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    allocatedAt: {
      type: Date,
      default: Date.now,
    },
    vacatedAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a student can only have one active allocation
roomAllocationSchema.index(
  { studentId: 1, isActive: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);
// Ensure a room can only have one active allocation per student (but room can have multiple students based on capacity)
// This is handled at application level

export const RoomAllocation = mongoose.model<IRoomAllocation>(
  'RoomAllocation',
  roomAllocationSchema
);
