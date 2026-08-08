import type { ComplaintFilters, MessFilters, PaymentFilters } from './types';

/**
 * Central query-key factory. List keys include their filters so every distinct
 * filter combination gets its own cache entry; the `all*` constants are the
 * prefixes used to invalidate whole modules after mutations.
 */
export const queryKeys = {
  // Mess browsing
  messes: (filters?: MessFilters) => ['messes', filters ?? {}] as const,
  mess: (id: string) => ['mess', id] as const,
  menuToday: (messId: string) => ['mess', messId, 'menu', 'today'] as const,
  weeklyMenu: (messId: string) => ['mess', messId, 'menu', 'week'] as const,

  // Subscriptions
  mySubscriptions: () => ['subscriptions', 'my'] as const,
  subscription: (id: string) => ['subscriptions', id] as const,

  // Payments & billing
  myPayments: (filters?: PaymentFilters) => ['payments', 'my', filters ?? {}] as const,
  monthlyBill: () => ['payments', 'bill', 'monthly'] as const,

  // Complaints
  myComplaints: (filters?: ComplaintFilters) => ['complaints', 'my', filters ?? {}] as const,
  complaint: (id: string) => ['complaints', id] as const,

  // Feedback
  myFeedback: () => ['feedback', 'my'] as const,
  targetFeedback: (targetType: string, targetId: string) =>
    ['feedback', 'target', targetType, targetId] as const,

  // Notifications
  notifications: (unreadOnly?: boolean) =>
    ['notifications', { unreadOnly: unreadOnly ?? false }] as const,
  unreadCount: () => ['notifications', 'unread-count'] as const,

  // Student profile & room
  myProfile: () => ['students', 'me'] as const,
  myRoom: () => ['students', 'me', 'room'] as const,

  // Invalidation prefixes
  allMesses: ['messes'] as const,
  allSubscriptions: ['subscriptions'] as const,
  allPayments: ['payments'] as const,
  allComplaints: ['complaints'] as const,
  allFeedback: ['feedback'] as const,
  allNotifications: ['notifications'] as const,
} as const;

/** Drops undefined values so cache keys stay stable across calls. */
export function cleanFilters<T extends object>(filters?: T): T | undefined {
  if (!filters) return undefined;
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) cleaned[key] = value;
  }
  return Object.keys(cleaned).length > 0 ? (cleaned as T) : undefined;
}
