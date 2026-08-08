import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient, unwrap } from '@/lib/apiClient';
import { getApiErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/queryKeys';
import type {
  ApiResponse,
  PopulatedSubscription,
  SubscriptionRequest,
  SubscriptionResponse,
} from '@shared/types/api';

/** GET /api/subscriptions/my — the student's subscriptions (mess populated). */
export function useMySubscriptions() {
  return useQuery({
    queryKey: queryKeys.mySubscriptions(),
    queryFn: () =>
      apiClient
        .get<ApiResponse<{ subscriptions: PopulatedSubscription[] }>>('/subscriptions/my')
        .then(unwrap),
  });
}

/** POST /api/subscriptions — request a new mess subscription. */
export function useRequestSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubscriptionRequest) =>
      apiClient.post<ApiResponse<SubscriptionResponse>>('/subscriptions', payload).then(unwrap),
    onSuccess: () => {
      toast.success('Subscription request submitted');
      void queryClient.invalidateQueries({ queryKey: queryKeys.allSubscriptions });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

/** POST /api/subscriptions/:id/cancel — cancel an existing subscription. */
export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subscriptionId: string) =>
      apiClient
        .post<ApiResponse<SubscriptionResponse>>(`/subscriptions/${subscriptionId}/cancel`)
        .then(unwrap),
    onSuccess: () => {
      toast.success('Subscription cancelled');
      void queryClient.invalidateQueries({ queryKey: queryKeys.allSubscriptions });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
