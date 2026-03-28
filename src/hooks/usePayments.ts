/**
 * Payment React Query Hooks
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient, APIResponse } from '@/lib/api-client';

interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  codeUrl?: string;
  redirectUrl?: string;
  expiresAt: string;
}

interface CreatePaymentData {
  orderId: string;
  amount: number;
  method: string;
  description?: string;
}

interface PaymentStatus {
  status: string;
  paidAt?: string;
  amount?: number;
}

/**
 * Create payment
 */
export function useCreatePayment() {
  return useMutation({
    mutationFn: async (data: CreatePaymentData) => {
      return apiClient.post<APIResponse<{ paymentId: string; paymentIntent: PaymentIntent }>>(
        '/api/payments/create',
        data
      );
    }
  });
}

/**
 * Query payment status
 */
export function usePaymentStatus(paymentId?: string) {
  return useQuery({
    queryKey: ['payment', 'status', paymentId],
    queryFn: async () => {
      if (!paymentId) throw new Error('Payment ID required');
      const response = await apiClient.get<APIResponse<PaymentStatus>>(
        `/api/payments/${paymentId}/status`
      );
      if (!response.data) {
        throw new Error('Payment status data not found');
      }
      return response.data;
    },
    enabled: !!paymentId,
    refetchInterval: (query) => {
      // Stop refetching if payment is complete
      const data = query.state.data;
      if (data && (data.status === 'success' || data.status === 'failed')) {
        return false;
      }
      return 3000; // Refetch every 3 seconds
    }
  });
}

/**
 * Get payment details
 */
export function usePaymentDetails(paymentId?: string) {
  return useQuery({
    queryKey: ['payment', 'details', paymentId],
    queryFn: async () => {
      if (!paymentId) throw new Error('Payment ID required');
      const response = await apiClient.get<APIResponse>(`/api/payments/${paymentId}`);
      return response.data;
    },
    enabled: !!paymentId
  });
}
