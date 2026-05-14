/**
 * BaseAdminController
 *
 * Generic, reusable client-side controller for all admin API modules.
 * Provides standardized CRUD operations that map 1:1 to the server-side
 * admin API foundation (`src/lib/admin-api.ts`).
 *
 * Usage:
 *   const equipmentController = new BaseAdminController<Equipment>('api/admin/equipment');
 *   const { data, total, totalPages } = await equipmentController.list({ q: 'microscope' });
 */

import { apiClient, APIError } from '@/lib/api-client';
import { ApiResponse, PaginatedResponse } from '@/types';

// ─── Types ───────────────────────────────────────────────────

export interface AdminListQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  query?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  status?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface AdminListApiResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminDeleteResponse {
  id: string;
  deleted: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────

function buildQueryString(params: AdminListQuery): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  }
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

function throwIfError<T>(response: ApiResponse<T>, defaultStatus = 400): T {
  if (!response.success) {
    throw new APIError(defaultStatus, response.error || 'Request failed', response);
  }
  return response.data as T;
}

// ─── Base Controller ─────────────────────────────────────────

export class BaseAdminController<T, CreateInput = Partial<T>, UpdateInput = Partial<T>> {
  constructor(protected readonly basePath: string) {
    // Normalize path: no leading/trailing slashes issues
    this.basePath = basePath.replace(/\/$/, '');
  }

  /**
   * GET /api/admin/{resource}?page=1&pageSize=20&q=...
   * Returns paginated list with standard query support.
   */
  async list(params: AdminListQuery = {}): Promise<PaginatedResponse<T>> {
    const qs = buildQueryString(params);
    const response = await apiClient.get<AdminListApiResponse<T>>(`${this.basePath}${qs}`);
    return {
      data: response.data,
      total: response.total,
      page: response.page,
      pageSize: response.pageSize,
      totalPages: response.totalPages,
    };
  }

  /**
   * GET /api/admin/{resource}/{id}
   */
  async get(id: string): Promise<T> {
    const response = await apiClient.get<ApiResponse<T>>(`${this.basePath}/${id}`);
    return throwIfError(response, 404);
  }

  /**
   * POST /api/admin/{resource}
   */
  async create(data: CreateInput): Promise<T> {
    const response = await apiClient.post<ApiResponse<T>>(this.basePath, data);
    return throwIfError(response, 400);
  }

  /**
   * PUT /api/admin/{resource}/{id}
   */
  async update(id: string, data: UpdateInput): Promise<T> {
    const response = await apiClient.put<ApiResponse<T>>(`${this.basePath}/${id}`, data);
    return throwIfError(response, 400);
  }

  /**
   * PATCH /api/admin/{resource}/{id}
   * Use for status toggles, partial updates, or any PATCH operation.
   */
  async toggle(id: string, data: Record<string, unknown>): Promise<T> {
    const response = await apiClient.patch<ApiResponse<T>>(`${this.basePath}/${id}`, data);
    return throwIfError(response, 400);
  }

  /**
   * DELETE /api/admin/{resource}/{id}
   */
  async delete(id: string): Promise<AdminDeleteResponse> {
    const response = await apiClient.delete<ApiResponse<AdminDeleteResponse>>(
      `${this.basePath}/${id}`
    );
    return throwIfError(response, 400);
  }

  // ─── Custom Endpoints ──────────────────────────────────────

  /**
   * Generic GET for module-specific sub-routes.
   * Example: controller.getCustom<Stats>(`${id}/stats`)
   */
  async getCustom<R>(subPath: string): Promise<R> {
    const path = subPath.startsWith('/') ? subPath : `/${subPath}`;
    const response = await apiClient.get<ApiResponse<R>>(`${this.basePath}${path}`);
    return throwIfError(response);
  }

  /**
   * Generic POST for module-specific sub-routes.
   */
  async postCustom<R>(subPath: string, data?: unknown): Promise<R> {
    const path = subPath.startsWith('/') ? subPath : `/${subPath}`;
    const response = await apiClient.post<ApiResponse<R>>(`${this.basePath}${path}`, data);
    return throwIfError(response);
  }

  /**
   * Generic PUT for module-specific sub-routes.
   */
  async putCustom<R>(subPath: string, data?: unknown): Promise<R> {
    const path = subPath.startsWith('/') ? subPath : `/${subPath}`;
    const response = await apiClient.put<ApiResponse<R>>(`${this.basePath}${path}`, data);
    return throwIfError(response);
  }

  /**
   * Generic PATCH for module-specific sub-routes.
   */
  async patchCustom<R>(subPath: string, data?: unknown): Promise<R> {
    const path = subPath.startsWith('/') ? subPath : `/${subPath}`;
    const response = await apiClient.patch<ApiResponse<R>>(`${this.basePath}${path}`, data);
    return throwIfError(response);
  }

  /**
   * Generic DELETE for module-specific sub-routes.
   */
  async deleteCustom<R>(subPath: string): Promise<R> {
    const path = subPath.startsWith('/') ? subPath : `/${subPath}`;
    const response = await apiClient.delete<ApiResponse<R>>(`${this.basePath}${path}`);
    return throwIfError(response);
  }
}
