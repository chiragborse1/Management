import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient, unwrap } from '@/lib/apiClient';
import { getApiErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/queryKeys';
import type { TargetFeedback } from '@/lib/types';
import type { Feedback } from '@shared/types';
import type { ApiResponse, FeedbackCreateRequest, Pagination } from '@shared/types/api';

/** GET /api/feedback/my — everything the student has submitted. */
export function useMyFeedback() {
  return useQuery({
    queryKey: queryKeys.myFeedback(),
    queryFn: () =>
      apiClient.get<ApiResponse<{ feedback: Feedback[] }>>('/feedback/my').then(unwrap),
  });
}

/** GET /api/feedback/target/:targetType/:targetId — public ratings for a target. */
export function useTargetFeedback(targetType: string, targetId: string) {
  return useQuery({
    queryKey: queryKeys.targetFeedback(targetType, targetId),
    queryFn: () =>
      apiClient
        .get<ApiResponse<{ feedback: TargetFeedback[]; pagination: Pagination }>>(
          `/feedback/target/${targetType}/${targetId}`
        )
        .then(unwrap),
    enabled: Boolean(targetType && targetId),
  });
}

/** POST /api/feedback — submit (or update) a rating for a target. */
export function useSubmitFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FeedbackCreateRequest) =>
      apiClient.post<ApiResponse<{ feedback: Feedback }>>('/feedback', payload).then(unwrap),
    onSuccess: (_feedback, variables) => {
      toast.success('Feedback submitted');
      void queryClient.invalidateQueries({ queryKey: queryKeys.allFeedback });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.targetFeedback(variables.targetType, variables.targetId),
      });
      // A mess review updates the mess's aggregate rating.
      if (variables.targetType === 'mess') {
        void queryClient.invalidateQueries({ queryKey: queryKeys.mess(variables.targetId) });
      }
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
