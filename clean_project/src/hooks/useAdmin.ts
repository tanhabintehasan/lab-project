/**
 * Admin React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, APIResponse } from '@/lib/api-client';

interface PaymentProvider {
  id: string;
  name: string;
  type: string;
  mode: string;
  isEnabled: boolean;
  isDefault: boolean;
  apiKeyMasked?: string;
  lastTestedAt?: string;
  lastTestResult?: string;
}

interface Integration {
  id: string;
  name: string;
  type: string;
  provider: string;
  mode: string;
  isEnabled: boolean;
  isDefault: boolean;
  apiKeyMasked?: string;
  lastTestedAt?: string;
  lastTestResult?: string;
}

/**
 * Get all payment providers
 */
export function usePaymentProviders() {
  return useQuery({
    queryKey: ['admin', 'payment-providers'],
    queryFn: async () => {
      const response = await apiClient.get<APIResponse<PaymentProvider[]>>(
        '/api/admin/payment-providers'
      );
      return response.data;
    }
  });
}

/**
 * Get payment provider by ID
 */
export function usePaymentProvider(id?: string) {
  return useQuery({
    queryKey: ['admin', 'payment-providers', id],
    queryFn: async () => {
      if (!id) throw new Error('Provider ID required');
      const response = await apiClient.get<APIResponse<PaymentProvider>>(
        `/api/admin/payment-providers/${id}`
      );
      return response.data;
    },
    enabled: !!id
  });
}

/**
 * Create payment provider
 */
export function useCreatePaymentProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      return apiClient.post<APIResponse<PaymentProvider>>(
        '/api/admin/payment-providers',
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-providers'] });
    }
  });
}

/**
 * Update payment provider
 */
export function useUpdatePaymentProvider(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      return apiClient.put<APIResponse<PaymentProvider>>(
        `/api/admin/payment-providers/${id}`,
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-providers'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-providers', id] });
    }
  });
}

/**
 * Delete payment provider
 */
export function useDeletePaymentProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete<APIResponse>(`/api/admin/payment-providers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-providers'] });
    }
  });
}

/**
 * Test payment provider connection
 */
export function useTestPaymentProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.post<APIResponse>(
        `/api/admin/payment-providers/${id}/test`
      );
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-providers', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-providers'] });
    }
  });
}

/**
 * Get all integrations
 */
export function useIntegrations(type?: string) {
  return useQuery({
    queryKey: ['admin', 'integrations', type],
    queryFn: async () => {
      const url = type
        ? `/api/admin/integrations?type=${type}`
        : '/api/admin/integrations';
      const response = await apiClient.get<APIResponse<Integration[]>>(url);
      return response.data;
    }
  });
}

/**
 * Get integration by ID
 */
export function useIntegration(id?: string) {
  return useQuery({
    queryKey: ['admin', 'integrations', id],
    queryFn: async () => {
      if (!id) throw new Error('Integration ID required');
      const response = await apiClient.get<APIResponse<Integration>>(
        `/api/admin/integrations/${id}`
      );
      return response.data;
    },
    enabled: !!id
  });
}

/**
 * Create integration
 */
export function useCreateIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      return apiClient.post<APIResponse<Integration>>(
        '/api/admin/integrations',
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'integrations'] });
    }
  });
}

/**
 * Update integration
 */
export function useUpdateIntegration(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      return apiClient.put<APIResponse<Integration>>(
        `/api/admin/integrations/${id}`,
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'integrations'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'integrations', id] });
    }
  });
}

/**
 * Delete integration
 */
export function useDeleteIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete<APIResponse>(`/api/admin/integrations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'integrations'] });
    }
  });
}

/**
 * Test integration connection
 */
export function useTestIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.post<APIResponse>(`/api/admin/integrations/${id}/test`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'integrations', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'integrations'] });
    }
  });
}
