import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient, unwrap } from '@/lib/apiClient';
import { getApiErrorMessage } from '@/lib/errors';
import { cleanFilters, queryKeys } from '@/lib/queryKeys';
import type { ComplaintFilters } from '@/lib/types';
import type { Complaint, ComplaintComment } from '@shared/types';
import type {
  ApiResponse,
  ComplaintCreateRequest,
  ComplaintResponse,
  Pagination,
} from '@shared/types/api';

/** GET /api/complaints/my — the student's complaints with optional filters. */
export function useMyComplaints(filters?: ComplaintFilters) {
  const params = cleanFilters(filters);
  return useQuery({
    queryKey: queryKeys.myComplaints(params),
    queryFn: () =>
      apiClient
        .get<ApiResponse<{ complaints: Complaint[]; pagination: Pagination }>>('/complaints/my', {
          params,
        })
        .then(unwrap),
  });
}

/** GET /api/complaints/:id — one complaint plus its public comment thread. */
export function useComplaint(id: string) {
  return useQuery({
    queryKey: queryKeys.complaint(id),
    queryFn: () => apiClient.get<ApiResponse<ComplaintResponse>>(`/complaints/${id}`).then(unwrap),
    enabled: Boolean(id),
  });
}

/** POST /api/complaints — raise a new complaint against the student's hostel. */
export function useCreateComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ComplaintCreateRequest) =>
      apiClient.post<ApiResponse<{ complaint: Complaint }>>('/complaints', payload).then(unwrap),
    onSuccess: () => {
      toast.success('Complaint submitted');
      void queryClient.invalidateQueries({ queryKey: queryKeys.allComplaints });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

/** POST /api/complaints/:id/comments — reply to a complaint thread. */
export function useCreateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ complaintId, message }: { complaintId: string; message: string }) =>
      apiClient
        .post<ApiResponse<{ comment: ComplaintComment }>>(`/complaints/${complaintId}/comments`, {
          message,
        })
        .then(unwrap),
    onSuccess: (_comment, variables) => {
      toast.success('Comment added');
      void queryClient.invalidateQueries({ queryKey: queryKeys.complaint(variables.complaintId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.allComplaints });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
