/**
 * Standardized API Response Wrapper
 *
 * Provides a unified response envelope for ALL API endpoints.
 *
 * Response Shape:
 *   Success:    { success: true,  data: T, meta: { timestamp } }
 *   Error:      { success: false, error: "...", code: "...", status: N, details?, meta: { timestamp } }
 *   Paginated:  { success: true,  data: T[], total, page, pageSize, totalPages, meta: { timestamp } }
 *
 * Backward Compatibility:
 *   - `error` remains a flat string (existing frontends still work)
 *   - `data` placement unchanged
 *   - Paginated fields remain at top level
 *   New additive fields: `code`, `status`, `details`, `meta`
 */

import { NextResponse } from 'next/server';

// ─── Types ───────────────────────────────────────────────────

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | 'BAD_REQUEST'
  | 'DATABASE_ERROR';

export interface ApiResponseMeta {
  timestamp: string;
  requestId?: string;
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: ApiErrorCode;
  status?: number;
  details?: Record<string, string[]> | unknown;
  meta: ApiResponseMeta;
}

// ─── Internal Helpers ────────────────────────────────────────

function makeMeta(partial?: Partial<ApiResponseMeta>): ApiResponseMeta {
  return { timestamp: new Date().toISOString(), ...partial };
}

function statusToCode(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'VALIDATION_ERROR';
    case 500:
    default:
      return 'INTERNAL_ERROR';
  }
}

// ─── Success ─────────────────────────────────────────────────

export function apiSuccess<T>(data: T, status = 200, extraMeta?: Partial<ApiResponseMeta>) {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    meta: makeMeta(extraMeta),
  };
  return NextResponse.json(payload, { status });
}

// ─── Error ───────────────────────────────────────────────────

export function apiError(
  message: string,
  status = 400,
  options?: {
    code?: ApiErrorCode;
    details?: Record<string, string[]> | unknown;
  }
) {
  const payload: ApiResponse = {
    success: false,
    error: message,
    code: options?.code || statusToCode(status),
    status,
    details: options?.details,
    meta: makeMeta(),
  };
  return NextResponse.json(payload, { status });
}

// ─── Specific Error Helpers ──────────────────────────────────

export function apiUnauthorized(message = '未授权访问') {
  return apiError(message, 401, { code: 'UNAUTHORIZED' });
}

export function apiForbidden(message = '权限不足') {
  return apiError(message, 403, { code: 'FORBIDDEN' });
}

export function apiNotFound(message = '资源不存在') {
  return apiError(message, 404, { code: 'NOT_FOUND' });
}

export function apiValidationError(
  message = '请求参数错误',
  details?: Record<string, string[]>
) {
  return apiError(message, 400, { code: 'VALIDATION_ERROR', details });
}

export function apiConflict(message = '该记录已存在') {
  return apiError(message, 409, { code: 'CONFLICT' });
}

export function apiServerError(message = '服务器错误，请稍后重试') {
  return apiError(message, 500, { code: 'INTERNAL_ERROR' });
}

// ─── Paginated ───────────────────────────────────────────────

export function apiPaginated<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
  status = 200
) {
  const payload = {
    success: true,
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    meta: makeMeta({ page, pageSize, total, totalPages: Math.ceil(total / pageSize) }),
  };
  return NextResponse.json(payload as ApiResponse<T[]>, { status });
}

// ─── Async Route Wrapper ─────────────────────────────────────

/**
 * Wrap an async route handler so that ANY unhandled exception is
 * serialized through the standardized error envelope.
 */
export function withStandardResponse(
  handler: () => Promise<NextResponse> | NextResponse
): Promise<NextResponse> {
  return Promise.resolve(handler()).catch((error: unknown) => {
    console.error('[withStandardResponse] Unhandled error:', error);
    return apiServerError(
      error instanceof Error ? error.message : '服务器错误，请稍后重试'
    );
  });
}
