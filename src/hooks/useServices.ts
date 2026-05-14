/**
 * Services React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { startTransition } from 'react';
import { apiClient, APIResponse } from '@/lib/api-client';

interface ServiceCategory {
  id: string;
  nameZh: string;
  slug?: string;
}

interface CustomField {
  id?: string;
  label: string;
  fieldType: 'TEXT' | 'NUMBER' | 'SELECT' | 'TEXTAREA';
  options?: string | null;
  isRequired: boolean;
  placeholder?: string | null;
  sortOrder: number;
}

interface ServiceItem {
  id: string;
  slug: string;
  nameZh: string;
  shortDescZh?: string;
  categoryId?: string;
  category?: {
    id?: string;
    nameZh?: string;
    slug?: string;
  };
  priceMin?: number | null;
  turnaroundDays?: number | null;
  sampleCount?: string | null;
  sampleSize?: string | null;
  sampleWeight?: string | null;
  sampleCondition?: string | null;
  samplePreservation?: string | null;
  samplePreparation?: string | null;
  customFields?: CustomField[];
  isActive?: boolean;
}

interface PaginatedServices {
  data: ServiceItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface SaveServicePayload {
  nameZh: string;
  shortDescZh?: string;
  categoryId: string;
  labId?: string;
  priceMin?: number;
  turnaroundDays?: number;
  sampleCount?: string;
  sampleSize?: string;
  sampleWeight?: string;
  sampleCondition?: string;
  samplePreservation?: string;
  samplePreparation?: string;
  customFields?: Omit<CustomField, 'id'>[];
}

export const SERVICES_KEY = ['admin', 'services'];
const CATEGORIES_KEY = ['admin', 'service-categories'];

/**
 * Get paginated services
 */
export function useServices(page: number, search: string) {
  return useQuery({
    queryKey: [...SERVICES_KEY, page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '15',
      });
      if (search) params.set('q', search);
      const response = await apiClient.get<{
        success: boolean;
        data: ServiceItem[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
      }>(`/api/admin/services?${params.toString()}`);
      return {
        data: response.data || [],
        total: response.total || 0,
        page: response.page || page,
        pageSize: response.pageSize || 15,
        totalPages: response.totalPages || 1,
      } as PaginatedServices;
    },
  });
}

/**
 * Get all service categories
 */
export function useServiceCategories() {
  return useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: async () => {
      const response = await apiClient.get<APIResponse<ServiceCategory[]>>(
        '/api/admin/service-categories?page=1&pageSize=100'
      );
      return (response.data as ServiceCategory[]) || [];
    },
  });
}

/**
 * Create service
 */
export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SaveServicePayload) => {
      return apiClient.post<APIResponse<ServiceItem>>('/api/admin/services', payload);
    },
    onSuccess: () => {
      startTransition(() => {
        queryClient.invalidateQueries({ queryKey: SERVICES_KEY });
      });
    },
  });
}

/**
 * Update service
 */
export function useUpdateService(id?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<SaveServicePayload>) => {
      if (!id) throw new Error('Service ID required');
      return apiClient.put<APIResponse<ServiceItem>>(`/api/admin/services/${id}`, payload);
    },
    onSuccess: () => {
      startTransition(() => {
        queryClient.invalidateQueries({ queryKey: SERVICES_KEY });
      });
    },
  });
}

/**
 * Toggle service active status
 */
export function useToggleServiceActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiClient.patch<APIResponse<ServiceItem>>(`/api/admin/services/${id}`, { isActive });
    },
    onSuccess: () => {
      startTransition(() => {
        queryClient.invalidateQueries({ queryKey: SERVICES_KEY });
      });
    },
  });
}

/**
 * Delete service
 */
export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete<APIResponse>(`/api/admin/services/${id}`);
    },
    onSuccess: () => {
      startTransition(() => {
        queryClient.invalidateQueries({ queryKey: SERVICES_KEY });
      });
    },
  });
}
