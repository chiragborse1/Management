/**
 * API DTO types for the Step 3 student-facing endpoints (mess browsing,
 * subscriptions, payments/billing, complaints, feedback, notifications,
 * student profile). These mirror the JSON envelopes produced by the server
 * (utils/apiResponse.ts + controllers) and are consumed by the React client.
 */
import type {
  Complaint,
  ComplaintCategory,
  ComplaintComment,
  ComplaintPriority,
} from './complaint';
import type { FeedbackCategory, FeedbackTargetType, Notification } from './feedback';
import type { Menu, Mess, Subscription, SubscriptionPlan } from './mess';
import type { RoomType } from './hostel';
import type { Student } from './user';

/** Successful API envelope: { success: true, data, message? } */
export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

/** Error API envelope: { success: false, error: { code, message, details? } } */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ---------- Mess browsing (GET /api/mess, /api/mess/:id) ----------

export interface MessListResponse {
  messes: Mess[];
  pagination: Pagination;
}

/** Detail view never exposes the owner id to students. */
export interface MessDetailResponse {
  mess: Omit<Mess, 'ownerId'>;
}

// ---------- Menus (GET /api/mess/:id/menu[/today|/week]) ----------

export interface MenuResponse {
  menu: Menu | null;
}

export interface WeeklyMenuResponse {
  menus: Menu[];
}

// ---------- Subscriptions (POST /api/subscriptions, GET /:id, /my, POST /:id/cancel) ----------

export interface SubscriptionRequest {
  messId: string;
  plan: SubscriptionPlan;
  startDate?: string;
  autoRenew?: boolean;
}

/**
 * Subscription as returned to the client: `messId` is a populated mess
 * document in list/detail responses and a bare id in history contexts.
 */
export type PopulatedSubscription = Omit<Subscription, 'messId'> & {
  messId: Mess | string;
};

export interface SubscriptionResponse {
  subscription: PopulatedSubscription;
}

// ---------- Payments & monthly bill (GET /api/payments/my, /bill/monthly, POST /api/payments) ----------

export interface BillItem {
  label: string;
  amount: number;
  roomNumber?: string | null;
  messName?: string | null;
}

export interface MonthlyBillResponse {
  bill: {
    month: string;
    items: BillItem[];
    totalDue: number;
    paidThisMonth: number;
    outstanding: number;
  };
}

// ---------- Complaints (POST /api/complaints, GET /my, /:id, POST /:id/comments) ----------

export interface ComplaintCreateRequest {
  hostelId: string;
  roomId?: string;
  category: ComplaintCategory;
  priority?: ComplaintPriority;
  title: string;
  description: string;
  images?: string[];
}

export interface ComplaintResponse {
  complaint: Complaint;
  comments: ComplaintComment[];
}

// ---------- Feedback (POST /api/feedback, GET /my, /target/:targetType/:targetId) ----------

export interface FeedbackCreateRequest {
  targetId: string;
  targetType: FeedbackTargetType;
  rating: number;
  comment?: string;
  categories?: FeedbackCategory[];
  isAnonymous?: boolean;
}

// ---------- Notifications (GET /api/notifications, /unread-count, PATCH /:id/read, /read-all) ----------

export interface NotificationListResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: Pagination;
}

// ---------- Student profile & room (GET /api/students/me, /me/room, PATCH /me) ----------

/** Populated hostel reference (GET /api/students/me with populate). */
export interface PopulatedHostelRef {
  name: string;
  address: string;
  city: string;
  phone: string;
}

/** Populated room reference (GET /api/students/me with populate). */
export interface PopulatedRoomRef {
  roomNumber: string;
  floor: number;
  type: RoomType;
  rentPerMonth: number;
}

export interface StudentProfileResponse {
  student: Omit<Student, 'hostelId' | 'roomId'> & {
    hostelId?: PopulatedHostelRef | string;
    roomId?: PopulatedRoomRef | string;
  };
}
