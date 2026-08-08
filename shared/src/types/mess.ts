export interface Mess {
  id: string;
  name: string;
  description: string;
  type: MessType;
  hostelId?: string;
  ownerId: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  images: string[];
  cuisineTypes: string[];
  pricing: MessPricing;
  operatingHours: {
    breakfast: { start: string; end: string };
    lunch: { start: string; end: string };
    dinner: { start: string; end: string };
  };
  isActive: boolean;
  rating: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
}

export type MessType = 'hostel' | 'outside';

export interface MessPricing {
  monthly: number;
  quarterly: number;
  halfYearly: number;
  yearly: number;
  perMeal?: {
    breakfast: number;
    lunch: number;
    dinner: number;
  };
}

export interface Menu {
  id: string;
  messId: string;
  dayOfWeek: DayOfWeek;
  date?: string;
  meals: {
    breakfast: MenuItem[];
    lunch: MenuItem[];
    dinner: MenuItem[];
  };
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DayOfWeek =
  'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  isVeg: boolean;
  allergens?: string[];
  calories?: number;
}

export interface Subscription {
  id: string;
  studentId: string;
  messId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  amountPaid: number;
  paymentHistory: PaymentRecord[];
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionPlan = 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending' | 'rejected';

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  receiptUrl?: string;
}

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'net_banking' | 'wallet';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
