export interface Feedback {
  id: string;
  studentId: string;
  targetId: string;
  targetType: FeedbackTargetType;
  rating: number;
  comment?: string;
  categories: FeedbackCategory[];
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
}

export type FeedbackTargetType = 'hostel' | 'mess' | 'room' | 'admin' | 'mess_owner';

export type FeedbackCategory =
  | 'cleanliness'
  | 'food_quality'
  | 'service'
  | 'value_for_money'
  | 'amenities'
  | 'staff_behavior'
  | 'response_time'
  | 'overall';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export type NotificationType =
  | 'complaint_submitted'
  | 'complaint_updated'
  | 'complaint_resolved'
  | 'payment_due'
  | 'payment_received'
  | 'payment_failed'
  | 'subscription_requested'
  | 'subscription_approved'
  | 'subscription_rejected'
  | 'subscription_cancelled'
  | 'subscription_expiring'
  | 'menu_published'
  | 'room_allocated'
  | 'room_change_request'
  | 'announcement'
  | 'feedback_received'
  | 'system';
