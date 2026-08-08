import { useQuery } from '@tanstack/react-query';
import { apiClient, unwrap } from '@/lib/apiClient';
import { cleanFilters, queryKeys } from '@/lib/queryKeys';
import type { MessFilters } from '@/lib/types';
import type {
  ApiResponse,
  MenuResponse,
  MessDetailResponse,
  MessListResponse,
  WeeklyMenuResponse,
} from '@shared/types/api';

/** GET /api/mess — browse messes with optional type/city/search filters. */
export function useMesses(filters?: MessFilters) {
  const params = cleanFilters(filters);
  return useQuery({
    queryKey: queryKeys.messes(params),
    queryFn: () => apiClient.get<ApiResponse<MessListResponse>>('/mess', { params }).then(unwrap),
  });
}

/** GET /api/mess/:id — mess detail (owner id is stripped by the server). */
export function useMess(id: string) {
  return useQuery({
    queryKey: queryKeys.mess(id),
    queryFn: () => apiClient.get<ApiResponse<MessDetailResponse>>(`/mess/${id}`).then(unwrap),
    enabled: Boolean(id),
  });
}

/** GET /api/mess/:id/menu/today — today's published menu (may be null). */
export function useMenuToday(messId: string) {
  return useQuery({
    queryKey: queryKeys.menuToday(messId),
    queryFn: () =>
      apiClient.get<ApiResponse<MenuResponse>>(`/mess/${messId}/menu/today`).then(unwrap),
    enabled: Boolean(messId),
  });
}

/** GET /api/mess/:id/menu/week — this week's published menus. */
export function useWeeklyMenu(messId: string) {
  return useQuery({
    queryKey: queryKeys.weeklyMenu(messId),
    queryFn: () =>
      apiClient.get<ApiResponse<WeeklyMenuResponse>>(`/mess/${messId}/menu/week`).then(unwrap),
    enabled: Boolean(messId),
  });
}
