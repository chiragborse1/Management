import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient, unwrap } from '@/lib/apiClient';
import { getApiErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/queryKeys';
import type { MyRoomData, UpdateProfileInput } from '@/lib/types';
import type { Student } from '@shared/types';
import type { ApiResponse, StudentProfileResponse } from '@shared/types/api';

/** GET /api/students/me — full profile with hostel + room populated. */
export function useMyProfile() {
  return useQuery({
    queryKey: queryKeys.myProfile(),
    queryFn: () => apiClient.get<ApiResponse<StudentProfileResponse>>('/students/me').then(unwrap),
  });
}

/** GET /api/students/me/room — current room allocation (may be null). */
export function useMyRoom() {
  return useQuery({
    queryKey: queryKeys.myRoom(),
    queryFn: () => apiClient.get<ApiResponse<MyRoomData>>('/students/me/room').then(unwrap),
  });
}

/** PATCH /api/students/me — update whitelisted profile fields. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfileInput) =>
      apiClient.patch<ApiResponse<{ student: Student }>>('/students/me', payload).then(unwrap),
    onSuccess: () => {
      toast.success('Profile updated');
      void queryClient.invalidateQueries({ queryKey: queryKeys.myProfile() });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
