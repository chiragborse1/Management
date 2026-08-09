import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient, unwrap } from '@/lib/apiClient';
import { getApiErrorMessage } from '@/lib/errors';
import type {
  DayOfWeek,
  Menu,
  Mess,
  MessPricing,
  MessType,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@shared/types';
import type { ApiResponse, WeeklyMenuResponse } from '@shared/types/api';

// ---------- Shared types for the Mess Owner module ----------

/** Full profile payload accepted by POST/PUT /api/mess-owner/me. */
export interface MessOwnerProfileInput {
  name: string;
  description: string;
  type: MessType;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  cuisineTypes: string[];
  images: string[];
  pricing: MessPricing;
  operatingHours: Mess['operatingHours'];
  isActive: boolean;
}

/** Response of GET /api/mess-owner/me — null when no profile exists yet. */
export interface MessOwnerProfileResponse {
  mess: Mess | null;
}

/** A menu item as accepted by the upsert endpoint (id is server-generated). */
export interface MenuItemInput {
  name: string;
  description?: string;
  isVeg: boolean;
  calories?: number;
}

export interface MealsInput {
  breakfast: MenuItemInput[];
  lunch: MenuItemInput[];
  dinner: MenuItemInput[];
}

/** Body of PUT /api/mess-owner/menu/:dayOfWeek. */
export interface MenuDayInput {
  meals: MealsInput;
  isPublished: boolean;
}

/** Populated student reference on owner-scoped subscriptions. */
export interface MessOwnerStudentRef {
  name: string;
  studentId: string;
  phone: string;
  avatar?: string;
}

/** Subscription as returned by the mess-owner endpoints (uses `_id`). */
export interface OwnerSubscription {
  _id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
  studentId: MessOwnerStudentRef | string;
}

export interface SubscriptionRequestsResponse {
  requests: OwnerSubscription[];
  count: number;
}

export interface SubscribersResponse {
  subscribers: OwnerSubscription[];
}

/** Aggregate numbers from GET /api/mess-owner/stats. */
export interface MessOwnerStats {
  subscribers: number;
  pendingRequests: number;
  monthlyRevenue: number;
  avgRating: number;
  totalReviews: number;
  menusPublished: number;
}

/** A review of the owner's mess (public feedback endpoint shape). */
export interface MessOwnerReview {
  _id?: string;
  id?: string;
  rating: number;
  comment?: string;
  isAnonymous: boolean;
  createdAt: string;
}

// ---------- Profile ----------

/** GET /api/mess-owner/me — the owner's mess profile (null until created). */
export function useMyMess() {
  return useQuery({
    queryKey: ['mess-owner', 'me'],
    queryFn: () =>
      apiClient.get<ApiResponse<MessOwnerProfileResponse>>('/mess-owner/me').then(unwrap),
  });
}

/** POST /api/mess-owner/me — create the mess profile. */
export function useCreateMess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MessOwnerProfileInput) =>
      apiClient.post<ApiResponse<MessOwnerProfileResponse>>('/mess-owner/me', payload).then(unwrap),
    onSuccess: () => {
      toast.success('Mess profile created');
      void queryClient.invalidateQueries({ queryKey: ['mess-owner', 'me'] });
      void queryClient.invalidateQueries({ queryKey: ['mess-owner', 'stats'] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

/** PUT /api/mess-owner/me — partial update of the mess profile. */
export function useUpdateMess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<MessOwnerProfileInput>) =>
      apiClient.put<ApiResponse<MessOwnerProfileResponse>>('/mess-owner/me', payload).then(unwrap),
    onSuccess: () => {
      toast.success('Mess profile updated');
      void queryClient.invalidateQueries({ queryKey: ['mess-owner', 'me'] });
      void queryClient.invalidateQueries({ queryKey: ['mess-owner', 'stats'] });
      void queryClient.invalidateQueries({ queryKey: ['mess'] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

// ---------- Weekly menu ----------

/** GET /api/mess/:id/menu/week — the owner's weekly menu (published + drafts). */
export function useMessOwnerMenu(messId: string) {
  return useQuery({
    queryKey: ['mess-owner', 'menu'],
    queryFn: () =>
      apiClient.get<ApiResponse<WeeklyMenuResponse>>(`/mess/${messId}/menu/week`).then(unwrap),
    enabled: Boolean(messId),
  });
}

/** PUT /api/mess-owner/menu/:dayOfWeek — upsert one day's meals (draft or publish). */
export function useUpsertMenu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dayOfWeek, meals, isPublished }: MenuDayInput & { dayOfWeek: DayOfWeek }) =>
      apiClient
        .put<ApiResponse<{ menu: Menu }>>(`/mess-owner/menu/${dayOfWeek}`, { meals, isPublished })
        .then(unwrap),
    onSuccess: (_data, variables) => {
      toast.success(variables.isPublished ? 'Menu published — subscribers notified' : 'Menu saved');
      void queryClient.invalidateQueries({ queryKey: ['mess-owner', 'menu'] });
      void queryClient.invalidateQueries({ queryKey: ['mess-owner', 'stats'] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

/** DELETE /api/mess-owner/menu/:dayOfWeek — remove a day's menu. */
export function useDeleteMenu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dayOfWeek: DayOfWeek) =>
      apiClient
        .delete<ApiResponse<{ success: true }>>(`/mess-owner/menu/${dayOfWeek}`)
        .then(unwrap),
    onSuccess: () => {
      toast.success('Menu day deleted');
      void queryClient.invalidateQueries({ queryKey: ['mess-owner', 'menu'] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

// ---------- Subscription requests & subscribers ----------

/** GET /api/mess-owner/requests?status= — pending or full request history. */
export function useSubscriptionRequests(status?: SubscriptionStatus) {
  const { data: profileData } = useMyMess();
  const messId = profileData?.mess?._id ?? profileData?.mess?.id ?? '';
  return useQuery({
    queryKey: ['mess-owner', 'requests', status ?? 'all'],
    queryFn: () =>
      apiClient
        .get<ApiResponse<SubscriptionRequestsResponse>>('/mess-owner/requests', {
          params: status ? { status } : undefined,
        })
        .then(unwrap),
    enabled: Boolean(messId),
  });
}

/** POST /api/mess-owner/subscriptions/:id/accept — approve a pending request. */
export function useAcceptSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subscriptionId: string) =>
      apiClient
        .post<ApiResponse<{ subscription: OwnerSubscription }>>(
          `/mess-owner/subscriptions/${subscriptionId}/accept`
        )
        .then(unwrap),
    onSuccess: () => {
      toast.success('Subscription accepted');
      void queryClient.invalidateQueries({ queryKey: ['mess-owner', 'requests'] });
      void queryClient.invalidateQueries({ queryKey: ['mess-owner', 'subscribers'] });
      void queryClient.invalidateQueries({ queryKey: ['mess-owner', 'stats'] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

/** POST /api/mess-owner/subscriptions/:id/reject — decline with an optional reason. */
export function useRejectSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiClient
        .post<ApiResponse<{ subscription: OwnerSubscription }>>(
          `/mess-owner/subscriptions/${id}/reject`,
          { reason }
        )
        .then(unwrap),
    onSuccess: () => {
      toast.success('Subscription rejected');
      void queryClient.invalidateQueries({ queryKey: ['mess-owner', 'requests'] });
      void queryClient.invalidateQueries({ queryKey: ['mess-owner', 'stats'] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

/** GET /api/mess-owner/subscribers — current subscribers of the mess. */
export function useMySubscribers() {
  const { data: profileData } = useMyMess();
  const messId = profileData?.mess?._id ?? profileData?.mess?.id ?? '';
  return useQuery({
    queryKey: ['mess-owner', 'subscribers'],
    queryFn: () =>
      apiClient.get<ApiResponse<SubscribersResponse>>('/mess-owner/subscribers').then(unwrap),
    enabled: Boolean(messId),
  });
}

// ---------- Stats & reviews ----------

/** GET /api/mess-owner/stats — aggregates, refreshed every minute. */
export function useMessStats() {
  const { data: profileData } = useMyMess();
  const messId = profileData?.mess?._id ?? profileData?.mess?.id ?? '';
  return useQuery({
    queryKey: ['mess-owner', 'stats'],
    queryFn: () =>
      apiClient.get<ApiResponse<{ stats: MessOwnerStats }>>('/mess-owner/stats').then(unwrap),
    enabled: Boolean(messId),
    refetchInterval: 60_000,
  });
}

/** GET /api/feedback/target/mess/:messId — public reviews of the owner's mess. */
export function useMyReviews() {
  const { data: profileData } = useMyMess();
  const messId = profileData?.mess?._id ?? profileData?.mess?.id ?? '';
  return useQuery({
    queryKey: ['mess-owner', 'reviews'],
    queryFn: () =>
      apiClient
        .get<ApiResponse<{ feedback: MessOwnerReview[] }>>(`/feedback/target/mess/${messId}`)
        .then(unwrap),
    enabled: Boolean(messId),
  });
}
