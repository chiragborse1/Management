export interface Complaint {
  id: string;
  studentId: string;
  hostelId: string;
  roomId?: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  title: string;
  description: string;
  images: string[];
  assignedTo?: string;
  resolution?: string;
  resolvedAt?: string;
  feedback?: ComplaintFeedback;
  createdAt: string;
  updatedAt: string;
}

export type ComplaintCategory =
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

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ComplaintStatus =
  'submitted' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed' | 'rejected';

export interface ComplaintFeedback {
  rating: number;
  comment?: string;
  submittedAt: string;
}

export interface ComplaintComment {
  id: string;
  complaintId: string;
  userId: string;
  userRole: 'student' | 'admin';
  message: string;
  isInternal: boolean;
  createdAt: string;
}
