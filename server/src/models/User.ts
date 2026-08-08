import mongoose, { Schema } from 'mongoose';
import type { Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { UserRole, AdminPermission } from '@shared/types';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  phone: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IStudent extends IUser {
  role: 'student';
  studentId: string;
  hostelId?: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId;
  parentPhone?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
}

export interface IAdmin extends IUser {
  role: 'admin';
  hostelId: mongoose.Types.ObjectId;
  permissions: AdminPermission[];
}

export interface IMessOwner extends IUser {
  role: 'mess_owner';
  messId?: mongoose.Types.ObjectId;
  businessName: string;
  gstNumber?: string;
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
  };
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String,
    },
    role: {
      type: String,
      enum: ['student', 'admin', 'mess_owner'],
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    discriminatorKey: 'role',
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (
  this: IUser,
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes
userSchema.index({ email: 1, role: 1 });
userSchema.index({ phone: 1, role: 1 });

export const User = mongoose.model<IUser>('User', userSchema);

// Student discriminator
const studentSchema = new Schema<IStudent>({
  studentId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true,
  },
  hostelId: {
    type: Schema.Types.ObjectId,
    ref: 'Hostel',
    index: true,
  },
  roomId: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
    index: true,
  },
  parentPhone: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  emergencyContact: {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    relation: { type: String, trim: true },
  },
});

export const Student = User.discriminator<IStudent>('Student', studentSchema);

// Admin discriminator
const adminSchema = new Schema<IAdmin>({
  hostelId: {
    type: Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true,
    index: true,
  },
  permissions: {
    type: [String],
    enum: [
      'manage_students',
      'manage_rooms',
      'manage_hostel',
      'manage_mess',
      'manage_complaints',
      'manage_payments',
      'generate_reports',
      'view_analytics',
    ],
    default: [],
  },
});

export const Admin = User.discriminator<IAdmin>('Admin', adminSchema);

// MessOwner discriminator
const messOwnerSchema = new Schema<IMessOwner>({
  messId: {
    type: Schema.Types.ObjectId,
    ref: 'Mess',
    index: true,
  },
  businessName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  gstNumber: {
    type: String,
    trim: true,
    uppercase: true,
  },
  bankDetails: {
    accountNumber: { type: String, trim: true },
    ifscCode: { type: String, trim: true, uppercase: true },
    accountHolderName: { type: String, trim: true },
  },
});

export const MessOwner = User.discriminator<IMessOwner>('MessOwner', messOwnerSchema);
