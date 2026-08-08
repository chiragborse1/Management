import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient, unwrap } from '@/lib/apiClient';
import { getApiErrorMessage } from '@/lib/errors';
import { cleanFilters, queryKeys } from '@/lib/queryKeys';
import type { Payment, PaymentFilters } from '@/lib/types';
import type { ApiResponse, MonthlyBillResponse, Pagination } from '@shared/types/api';
import type { PaymentMethod } from '@shared/types';

/** GET /api/payments/my — payment history with optional type/status filters. */
export function useMyPayments(filters?: PaymentFilters) {
  const params = cleanFilters(filters);
  return useQuery({
    queryKey: queryKeys.myPayments(params),
    queryFn: () =>
      apiClient
        .get<ApiResponse<{ payments: Payment[]; pagination: Pagination }>>('/payments/my', {
          params,
        })
        .then(unwrap),
  });
}

/** GET /api/payments/bill/monthly — computed room rent + mess bill for the month. */
export function useMonthlyBill() {
  return useQuery({
    queryKey: queryKeys.monthlyBill(),
    queryFn: () =>
      apiClient.get<ApiResponse<MonthlyBillResponse>>('/payments/bill/monthly').then(unwrap),
  });
}

export interface CreatePaymentInput {
  type: Payment['type'];
  amount: number;
  method: PaymentMethod;
  description?: string;
  referenceId?: string;
  transactionId?: string;
}

/** POST /api/payments — record a student-initiated payment. */
export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePaymentInput) =>
      apiClient.post<ApiResponse<{ payment: Payment }>>('/payments', payload).then(unwrap),
    onSuccess: () => {
      toast.success('Payment recorded');
      void queryClient.invalidateQueries({ queryKey: queryKeys.allPayments });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
