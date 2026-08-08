import { z } from 'zod';

// Auth schemas
export const registerSchema = z
  .object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    phone: z.string().min(10).max(15),
    password: z.string().min(8).max(128),
    confirmPassword: z.string(),
    role: z.enum(['student', 'admin', 'mess_owner']),
    studentId: z.string().optional(),
    hostelId: z.string().optional(),
    businessName: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      if (data.role === 'student') return data.studentId && data.studentId.length > 0;
      if (data.role === 'admin') return data.hostelId && data.hostelId.length > 0;
      if (data.role === 'mess_owner') return data.businessName && data.businessName.length > 0;
      return true;
    },
    {
      message: 'Required field for selected role is missing',
      path: ['role'],
    }
  );

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8).max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Hostel schemas
export const createHostelSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(10).max(1000),
  address: z.string().min(5).max(200),
  city: z.string().min(2).max(50),
  state: z.string().min(2).max(50),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/),
  phone: z.string().min(10).max(15),
  email: z.string().email(),
  images: z.array(z.string().url()).optional(),
  amenities: z.array(z.string()).optional(),
  rules: z.array(z.string()).optional(),
});

export const updateHostelSchema = createHostelSchema.partial();

// Room schemas
export const createRoomSchema = z.object({
  hostelId: z.string().min(1),
  roomNumber: z.string().min(1).max(20),
  floor: z.number().int().min(0).max(100),
  type: z.enum(['single', 'double', 'triple', 'quad', 'dormitory']),
  capacity: z.number().int().min(1).max(20),
  rentPerMonth: z.number().min(0),
  depositAmount: z.number().min(0),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string().url()).optional(),
});

export const updateRoomSchema = createRoomSchema.partial().omit({ hostelId: true });

export const allocateRoomSchema = z.object({
  roomId: z.string().min(1),
  studentId: z.string().min(1),
});

// Mess schemas
export const createMessSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(10).max(1000),
  type: z.enum(['hostel', 'outside']),
  hostelId: z.string().optional(),
  address: z.string().min(5).max(200),
  city: z.string().min(2).max(50),
  state: z.string().min(2).max(50),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/),
  phone: z.string().min(10).max(15),
  email: z.string().email(),
  images: z.array(z.string().url()).optional(),
  cuisineTypes: z.array(z.string()).optional(),
  pricing: z.object({
    monthly: z.number().min(0),
    quarterly: z.number().min(0),
    halfYearly: z.number().min(0),
    yearly: z.number().min(0),
    perMeal: z
      .object({
        breakfast: z.number().min(0).optional(),
        lunch: z.number().min(0).optional(),
        dinner: z.number().min(0).optional(),
      })
      .optional(),
  }),
  operatingHours: z.object({
    breakfast: z.object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    }),
    lunch: z.object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    }),
    dinner: z.object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    }),
  }),
});

export const updateMessSchema = createMessSchema.partial().omit({ type: true });

// Menu schemas
export const createMenuSchema = z.object({
  messId: z.string().min(1),
  dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  date: z.string().datetime().optional(),
  meals: z.object({
    breakfast: z.array(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        isVeg: z.boolean().default(true),
        allergens: z.array(z.string()).optional(),
        calories: z.number().min(0).optional(),
      })
    ),
    lunch: z.array(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        isVeg: z.boolean().default(true),
        allergens: z.array(z.string()).optional(),
        calories: z.number().min(0).optional(),
      })
    ),
    dinner: z.array(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        isVeg: z.boolean().default(true),
        allergens: z.array(z.string()).optional(),
        calories: z.number().min(0).optional(),
      })
    ),
  }),
  isPublished: z.boolean().default(false),
});

export const updateMenuSchema = createMenuSchema.partial().omit({ messId: true });

// Subscription schemas
export const createSubscriptionSchema = z.object({
  studentId: z.string().min(1),
  messId: z.string().min(1),
  plan: z.enum(['monthly', 'quarterly', 'half_yearly', 'yearly']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  autoRenew: z.boolean().default(false),
});

export const updateSubscriptionSchema = z.object({
  status: z.enum(['active', 'expired', 'cancelled', 'pending', 'rejected']).optional(),
  autoRenew: z.boolean().optional(),
});

// Complaint schemas
export const createComplaintSchema = z.object({
  hostelId: z.string().min(1),
  roomId: z.string().optional(),
  category: z.enum([
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
  ]),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  images: z.array(z.string().url()).optional(),
});

export const updateComplaintSchema = z.object({
  status: z
    .enum(['submitted', 'acknowledged', 'in_progress', 'resolved', 'closed', 'rejected'])
    .optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.string().optional(),
  resolution: z.string().max(2000).optional(),
});

export const addComplaintCommentSchema = z.object({
  message: z.string().min(1).max(2000),
  isInternal: z.boolean().default(false),
});

// Feedback schemas
export const createFeedbackSchema = z.object({
  targetId: z.string().min(1),
  targetType: z.enum(['hostel', 'mess', 'room', 'admin', 'mess_owner']),
  rating: z.number().min(1).max(5),
  comment: z.string().max(2000).optional(),
  categories: z
    .array(
      z.enum([
        'cleanliness',
        'food_quality',
        'service',
        'value_for_money',
        'amenities',
        'staff_behavior',
        'response_time',
        'overall',
      ])
    )
    .optional(),
  isAnonymous: z.boolean().default(false),
});

// Payment schemas
export const createPaymentSchema = z.object({
  studentId: z.string().min(1),
  type: z.enum(['room_rent', 'mess_subscription', 'deposit', 'maintenance', 'other']),
  amount: z.number().min(0),
  method: z.enum(['cash', 'upi', 'card', 'net_banking', 'wallet']),
  referenceId: z.string().optional(),
  description: z.string().max(500).optional(),
  transactionId: z.string().optional(),
});

export const updatePaymentSchema = z.object({
  status: z.enum(['pending', 'completed', 'failed', 'refunded', 'partial']),
  transactionId: z.string().optional(),
  receiptUrl: z.string().url().optional(),
});

// Notification schemas
export const createNotificationSchema = z.object({
  userId: z.string().min(1),
  type: z.string().min(1),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  data: z.record(z.unknown()).optional(),
});

// Query schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
