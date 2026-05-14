/**
 * Service Category React Query Hooks
 *
 * Provides paginated list, create, update, toggle, and delete
 * operations for the admin service-category module.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { startTransition } from 'react';
import {
  serviceCategoryController,
  ServiceCategory,
  ServiceCategoryCreateInput,
  ServiceCategoryUpdateInput,
} from '@/services/api/admin/service-categories';

export const SERVICE_CATEGORIES_KEY = ['admin', 'service-categories'];

// ─── Queries ─────────────────────────────────────────────────

/**
 * Get paginated service categories.
 */
export function useServiceCategories(page = 1, search = '', parentId?: string) {
  return useQuery({
    queryKey: [...SERVICE_CATEGORIES_KEY, page, search, parentId],
    queryFn: () => serviceCategoryController.list({ page, pageSize: 20, q: search, parentId }),
  });
}

/**
 * Get all service categories (flat list, up to 100).
 * Useful for parent dropdowns.
 */
export function useAllServiceCategories() {
  return useQuery({
    queryKey: [...SERVICE_CATEGORIES_KEY, 'all'],
    queryFn: () => serviceCategoryController.list({ page: 1, pageSize: 100 }),
  });
}

/**
 * Get a single category by id or slug.
 */
export function useServiceCategory(id?: string) {
  return useQuery({
    queryKey: [...SERVICE_CATEGORIES_KEY, 'detail', id],
    queryFn: () => {
      if (!id) throw new Error('Category ID required');
      return serviceCategoryController.get(id);
    },
    enabled: !!id,
  });
}

// ─── Mutations ───────────────────────────────────────────────

/**
 * Create a service category.
 */
export function useCreateServiceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ServiceCategoryCreateInput) =>
      serviceCategoryController.create(data),
    onSuccess: () => {
      startTransition(() => {
        queryClient.invalidateQueries({ queryKey: SERVICE_CATEGORIES_KEY });
      });
    },
  });
}

/**
 * Update a service category.
 */
export function useUpdateServiceCategory(id?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ServiceCategoryUpdateInput) => {
      if (!id) throw new Error('Category ID required');
      return serviceCategoryController.update(id, data);
    },
    onSuccess: () => {
      startTransition(() => {
        queryClient.invalidateQueries({ queryKey: SERVICE_CATEGORIES_KEY });
      });
    },
  });
}

/**
 * Toggle category active status.
 */
export function useToggleServiceCategoryActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      serviceCategoryController.toggle(id, { isActive }),
    onSuccess: () => {
      startTransition(() => {
        queryClient.invalidateQueries({ queryKey: SERVICE_CATEGORIES_KEY });
      });
    },
  });
}

/**
 * Delete a service category.
 */
export function useDeleteServiceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => serviceCategoryController.delete(id),
    onSuccess: () => {
      startTransition(() => {
        queryClient.invalidateQueries({ queryKey: SERVICE_CATEGORIES_KEY });
      });
    },
  });
}

/**
 * Bulk reorder service categories.
 */
export function useReorderServiceCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: { id: string; sortOrder: number }[]) =>
      serviceCategoryController.reorder(items),
    onSuccess: () => {
      startTransition(() => {
        queryClient.invalidateQueries({ queryKey: SERVICE_CATEGORIES_KEY });
      });
    },
  });
}
