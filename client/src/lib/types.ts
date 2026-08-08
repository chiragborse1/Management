import type {
  ComplaintCategory,
  ComplaintStatus,
  Feedback,
  MessType,
  PaymentMethod,
  PaymentStatus,
  Room,
  RoomAllocation,
} from '@shared/types';

/** Query filters for GET /api/mess. */
export interface MessFilters {
  type?: MessType;
  city?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/** Query filters for GET /api/payments/my. */
export interface PaymentFilters {
  type?: string;
  status?: PaymentStatus;
  page?: number;
  limit?: number;
}

/** Query filters for GET /api/complaints/my. */
export interface ComplaintFilters {
  status?: ComplaintStatus;
  category?: ComplaintCategory;
  page?: number;
  limit?: number;
}

/** Payment document returned by the payments endpoints (no shared DTO exists). */
export interface Payment {
  id: string;
  studentId: string;
  type: 'room_rent' | 'mess_subscription' | 'deposit' | 'maintenance' | 'other';
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  referenceId?: string;
  description?: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

/** Response shape of GET /api/students/me/room. */
export interface MyRoomData {
  room: Room | null;
  allocation: RoomAllocation | null;
}

/**
 * Public feedback for a target — the server strips author identity
 * (studentId/isAnonymous) from these listings.
 */
export type TargetFeedback = Omit<Feedback, 'studentId' | 'isAnonymous'>;

/** Whitelisted editable profile fields (PATCH /api/students/me). */
export interface UpdateProfileInput {
  name?: string;
  phone?: string;
  avatar?: string;
  address?: string;
  parentPhone?: string;
  emergencyContact?: { name: string; phone: string; relation: string };
}
