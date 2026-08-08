import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';
import { getApiErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/queryKeys';
import type { ApiResponse, NotificationListResponse } from '@shared/types/api';

/** GET /api/notifications — the user's notifications (+ unreadCount). */
export function useNotifications(options?: { unreadOnly?: boolean; limit?: number }) {
  const unreadOnly = options?.unreadOnly ?? false;
  const limit = options?.limit ?? 20;
  return useQuery({
    queryKey: queryKeys.notifications(unreadOnly),
    queryFn: () =>
      apiClient
        .get<ApiResponse<NotificationListResponse>>('/notifications', {
          params: { unreadOnly, limit },
        })
        .then((response) => response.data.data),
  });
}

/** GET /api/notifications/unread-count — polled every 30s for the navbar badge. */
export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.unreadCount(),
    queryFn: () =>
      apiClient
        .get<ApiResponse<{ unreadCount: number }>>('/notifications/unread-count')
        .then((response) => response.data.data.unreadCount),
    refetchInterval: 30_000,
  });
}

/** PATCH /api/notifications/:id/read — mark a single notification as read. */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      apiClient.patch(`/notifications/${notificationId}/read`).then(() => undefined),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.allNotifications });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

/** PATCH /api/notifications/read-all — mark every notification as read. */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.patch('/notifications/read-all').then(() => undefined),
    onSuccess: () => {
      toast.success('All notifications marked as read');
      void queryClient.invalidateQueries({ queryKey: queryKeys.allNotifications });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
