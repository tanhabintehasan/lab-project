/**
 * Base Admin API Foundation
 *
 * Provides reusable, data-driven CRUD utilities for all admin API routes.
 * Every admin module should use these factories to eliminate duplicated code.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { JWTPayload } from './auth';
import { prisma } from './db';
import {
  getPaginationParams,
  getAuthUser,
  errorResponse,
} from './api-helpers';
import {
  apiSuccess,
  apiPaginated,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiError,
  apiValidationError,
  apiConflict,
  apiServerError,
} from './api-response';
import { validateCSRF } from './middleware/csrf.middleware';
import {
  AdminRouteContext,
  AdminRouteHandler,
  AdminApiOptions,
  AdminListQueryParams,
  AdminListHandlerConfig,
  AdminGetHandlerConfig,
  AdminCreateHandlerConfig,
  AdminUpdateHandlerConfig,
  AdminDeleteHandlerConfig,
  AdminToggleHandlerConfig,
  AdminAuditLogOptions,
} from '@/types/admin-api';

// ─── Admin Error Handler ─────────────────────────────────────

function formatZodIssues(error: ZodError): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'root';
    if (!map[path]) map[path] = [];
    map[path].push(issue.message);
  }
  return map;
}

function handleAdminApiError(error: unknown, context: string) {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Admin API Error - ${context}]:`, error);
  } else {
    console.error(
      `[Admin API Error - ${context}]:`,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }

  if (error instanceof ZodError) {
    return apiValidationError('请求参数错误', formatZodIssues(error));
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return apiConflict('该记录已存在');
      case 'P2003':
        return apiError('关联数据不存在或已被引用，无法操作', 400, { code: 'BAD_REQUEST' });
      case 'P2025':
        return apiNotFound('资源不存在');
      case 'P2014':
        return apiError('数据关系冲突', 400, { code: 'BAD_REQUEST' });
      default:
        return apiServerError('数据库操作失败');
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return apiError('数据格式错误', 400, { code: 'VALIDATION_ERROR' });
  }

  if (error instanceof Error) {
    if (error.message.includes('unique constraint')) {
      return apiConflict('该记录已存在');
    }
    if (error.message.includes('foreign key constraint')) {
      return apiError('关联数据不存在', 400, { code: 'BAD_REQUEST' });
    }
    if (error.message.includes('not found') || error.name === 'MediaNotFoundError') {
      return apiNotFound('资源不存在');
    }
  }

  return apiServerError();
}

// ─── Route ID Extraction ─────────────────────────────────────

/**
 * Extract the identifier (id or slug) from route params or URL fallback.
 * Prefer Next.js `context.params` when available.
 */
export async function getRouteId(
  context: AdminRouteContext,
  fallbackUrl?: string
): Promise<string> {
  const params = await context.params;
  if (params.id) return params.id;
  if (params.slug) return params.slug;
  if (fallbackUrl) {
    return new URL(fallbackUrl).pathname.split('/').pop() || '';
  }
  return '';
}

// ─── Audit Log Helper ────────────────────────────────────────

/**
 * Write an audit log entry. Failures are silently logged to console
 * and never break the API response.
 */
export async function logAdminAudit(options: AdminAuditLogOptions): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: options.userId,
        action: options.action,
        entity: options.entity,
        entityId: options.entityId,
        details: options.details
          ? (JSON.parse(JSON.stringify(options.details)) as any)
          : undefined,
        ipAddress: options.ipAddress,
      },
    });
  } catch (err) {
    console.error('[AuditLog] Failed to write audit entry:', err);
  }
}

// ─── List Query Builder ──────────────────────────────────────

/**
 * Parse standard list query parameters from the request URL.
 */
export function buildAdminListQuery(request: NextRequest): AdminListQueryParams {
  const { page, pageSize, skip } = getPaginationParams(request);
  const url = new URL(request.url);

  const reserved = new Set(['page', 'pageSize', 'q', 'query', 'sort', 'order', 'status']);
  const filters: Record<string, string | undefined> = {};

  for (const [key, value] of url.searchParams.entries()) {
    if (!reserved.has(key)) {
      filters[key] = value || undefined;
    }
  }

  return {
    page,
    pageSize,
    skip,
    query: (url.searchParams.get('q') || url.searchParams.get('query') || '').trim(),
    sort: url.searchParams.get('sort') || 'createdAt',
    order: (url.searchParams.get('order') || 'desc') as 'asc' | 'desc',
    status: url.searchParams.get('status') || undefined,
    filters,
  };
}

// ─── Enhanced Auth Wrapper ───────────────────────────────────

/**
 * Enhanced wrapper for admin API routes.
 * Combines authentication, role checks, CSRF validation (for mutations),
 * and centralized error handling.
 *
 * Usage:
 *   export const GET = withAdminApi(handler, { roles: ['SUPER_ADMIN'] });
 */
export function withAdminApi(
  handler: AdminRouteHandler,
  options: AdminApiOptions
): (request: NextRequest, context: AdminRouteContext) => Promise<NextResponse> {
  return async (request: NextRequest, context: AdminRouteContext) => {
    try {
      const user = await getAuthUser(request);
      if (!user) {
        return apiUnauthorized();
      }

      if (!options.roles.includes(user.role) && user.role !== 'SUPER_ADMIN') {
        return apiForbidden();
      }

      const mutationMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
      if (options.requireCsrf !== false && mutationMethods.includes(request.method)) {
        const csrfResult = await validateCSRF(request);
        if (csrfResult) return csrfResult;
      }

      return await handler(request, user, context);
    } catch (error) {
      return handleAdminApiError(error, `Admin API ${request.method} ${request.url}`);
    }
  };
}

// ─── Standard List Handler Factory ───────────────────────────

/**
 * Factory for admin list endpoints.
 *
 * Usage:
 *   export const GET = withAdminApi(
 *     createAdminListHandler({ prismaModel: prisma.equipment, searchFields: ['nameZh', 'nameEn'] }),
 *     { roles: ['SUPER_ADMIN'] }
 *   );
 */
export function createAdminListHandler<T>(
  config: AdminListHandlerConfig<T>
): AdminRouteHandler {
  return async (request) => {
    const { page, pageSize, skip, query, sort, order, status, filters } =
      buildAdminListQuery(request);

    const where: any = { ...(config.where || {}) };

    // Global text search across configured fields
    if (query && config.searchFields?.length) {
      where.OR = config.searchFields.map((field) => ({
        [field]: { contains: query, mode: 'insensitive' },
      }));
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Additional URL filters (exact match on enum/string fields)
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined) {
        where[key] = value;
      }
    }

    const [items, total] = await Promise.all([
      config.prismaModel.findMany({
        where,
        include: config.include,
        orderBy: config.orderBy || { [sort]: order },
        skip,
        take: pageSize,
      }),
      config.prismaModel.count({ where }),
    ]);

    const data = config.transformItem ? items.map(config.transformItem) : items;
    return apiPaginated(data, total, page, pageSize);
  };
}

// ─── Standard Get Handler Factory ────────────────────────────

/**
 * Factory for admin detail endpoints.
 */
export function createAdminGetHandler<T>(
  config: AdminGetHandlerConfig<T>
): AdminRouteHandler {
  return async (request, _user, context) => {
    const id = await getRouteId(context, request.url);

    if (!id) {
      return apiError('缺少资源标识', 400);
    }

    let where: any;
    if (config.identifyBy === 'slug') {
      where = { slug: id };
    } else if (config.identifyBy === 'id-or-slug') {
      where = { OR: [{ id }, { slug: id }] };
    } else {
      where = { id };
    }

    const item = await config.prismaModel.findUnique({
      where,
      include: config.include,
    });

    if (!item) {
      return apiNotFound(config.notFoundMessage || '资源不存在');
    }

    return apiSuccess(item);
  };
}

// ─── Standard Create Handler Factory ─────────────────────────

/**
 * Factory for admin create endpoints.
 */
export function createAdminCreateHandler<T, D>(
  config: AdminCreateHandlerConfig<T, D>
): AdminRouteHandler {
  return async (request, user) => {
    const body = await request.json();
    const parsed = config.schema.parse(body);
    const data = config.transform ? config.transform(parsed, user) : parsed;

    const item = await (config.prismaModel as any).create({
      data,
      include: config.include,
    });

    await logAdminAudit({
      userId: user.userId,
      action: config.auditAction,
      entity: config.entityName,
      entityId: (item as any).id,
      details: data,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return apiSuccess(item, config.successStatus || 201);
  };
}

// ─── Standard Update Handler Factory ─────────────────────────

/**
 * Factory for admin update endpoints (PUT).
 */
export function createAdminUpdateHandler<T, D>(
  config: AdminUpdateHandlerConfig<T, D>
): AdminRouteHandler {
  return async (request, user, context) => {
    const id = await getRouteId(context, request.url);
    if (!id) {
      return apiError('缺少资源标识', 400);
    }

    const body = await request.json();
    const parsed = (config.schema as any).partial().parse(body);

    let where: any;
    if (config.identifyBy === 'slug') {
      where = { slug: id };
    } else if (config.identifyBy === 'id-or-slug') {
      where = { OR: [{ id }, { slug: id }] };
    } else {
      where = { id };
    }

    const existing = await (config.prismaModel as any).findUnique({
      where,
      select: { id: true },
    });

    if (!existing) {
      return apiNotFound(config.notFoundMessage || '资源不存在');
    }

    const data = config.transform
      ? config.transform(parsed, existing, user)
      : parsed;

    const item = await (config.prismaModel as any).update({
      where: { id: existing.id },
      data,
      include: config.include,
    });

    await logAdminAudit({
      userId: user.userId,
      action: config.auditAction,
      entity: config.entityName,
      entityId: existing.id,
      details: data,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return apiSuccess(item);
  };
}

// ─── Standard Delete Handler Factory ─────────────────────────

/**
 * Factory for admin delete endpoints.
 */
export function createAdminDeleteHandler(
  config: AdminDeleteHandlerConfig
): AdminRouteHandler {
  return async (request, user, context) => {
    const id = await getRouteId(context, request.url);
    if (!id) {
      return apiError('缺少资源标识', 400);
    }

    const existing = await (config.prismaModel as any).findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return apiNotFound(config.notFoundMessage || '资源不存在');
    }

    if (config.checkDependencies) {
      const depError = await config.checkDependencies(id);
      if (depError) {
        return apiError(depError, 400);
      }
    }

    await (config.prismaModel as any).delete({ where: { id } });

    await logAdminAudit({
      userId: user.userId,
      action: config.auditAction,
      entity: config.entityName,
      entityId: id,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return apiSuccess({ id, deleted: true });
  };
}

// ─── Standard Toggle Handler Factory ─────────────────────────

/**
 * Factory for admin PATCH toggle endpoints (status, isActive, etc.).
 */
export function createAdminToggleHandler<T>(
  config: AdminToggleHandlerConfig<T>
): AdminRouteHandler {
  return async (request, user, context) => {
    const id = await getRouteId(context, request.url);
    if (!id) {
      return apiError('缺少资源标识', 400);
    }

    const body = await request.json();
    const parsed = config.schema.parse(body);

    const existing = await (config.prismaModel as any).findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return errorResponse(config.notFoundMessage || '资源不存在', 404);
    }

    // Map incoming keys to DB field names if needed
    const updateData: any = {};
    for (const [key, value] of Object.entries(parsed)) {
      const dbField = config.fieldMapping?.[key] || key;
      updateData[dbField] = value;
    }

    const item = await (config.prismaModel as any).update({
      where: { id },
      data: updateData,
    });

    await logAdminAudit({
      userId: user.userId,
      action: config.auditAction,
      entity: config.entityName,
      entityId: id,
      details: parsed,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return apiSuccess(item);
  };
}

// ─── Zod Error Formatter ─────────────────────────────────────

/**
 * Format a Zod error into a human-friendly string for Chinese users.
 */
export function formatZodError(error: ZodError): string {
  const issue = error.issues[0];
  if (!issue) return '参数无效';
  return `${issue.path.join('.')}: ${issue.message}`;
}

// ─── Re-exports from api-response ────────────────────────────

export {
  apiSuccess,
  apiError,
  apiPaginated,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiValidationError,
  apiConflict,
  apiServerError,
} from './api-response';

export { getPaginationParams, errorResponse } from './api-helpers';

export type {
  ApiResponse,
  ApiResponseMeta,
  ApiErrorCode,
} from './api-response';

// ─── Convenience CRUD Module ─────────────────────────────────

/**
 * Convenience factory that bundles all standard CRUD handlers into one object.
 * Ideal for routes that need the full list/get/create/update/delete/toggle suite.
 *
 * Usage:
 *   const { listHandler, getHandler, createHandler, updateHandler, deleteHandler } =
 *     createAdminCrudModule({ prismaModel: prisma.equipment, schema: equipmentSchema, ... });
 *
 *   export const GET = withAdminApi(listHandler, { roles: ['SUPER_ADMIN'] });
 *   export const POST = withAdminApi(createHandler, { roles: ['SUPER_ADMIN'] });
 */
export function createAdminCrudModule<T, D>(config: {
  prismaModel: any;
  createSchema: import('zod').ZodSchema<D>;
  updateSchema?: import('zod').ZodSchema<D>;
  searchFields?: string[];
  include?: Record<string, any>;
  orderBy?: Record<string, any> | Array<Record<string, any>>;
  auditActions: {
    create: string;
    update: string;
    delete: string;
  };
  entityName: string;
  transformCreate?: (data: D, user: JWTPayload) => any;
  transformUpdate?: (data: Partial<D>, existing: { id: string }, user: JWTPayload) => any;
  checkDependencies?: (id: string) => Promise<string | null>;
  identifyBy?: 'id' | 'slug' | 'id-or-slug';
}) {
  return {
    listHandler: createAdminListHandler<T>({
      prismaModel: config.prismaModel,
      searchFields: config.searchFields,
      include: config.include,
      orderBy: config.orderBy,
    }),
    getHandler: createAdminGetHandler<T>({
      prismaModel: config.prismaModel,
      include: config.include,
      identifyBy: config.identifyBy,
    }),
    createHandler: createAdminCreateHandler<T, D>({
      prismaModel: config.prismaModel,
      schema: config.createSchema,
      transform: config.transformCreate,
      include: config.include,
      auditAction: config.auditActions.create,
      entityName: config.entityName,
    }),
    updateHandler: createAdminUpdateHandler<T, D>({
      prismaModel: config.prismaModel,
      schema: config.updateSchema || config.createSchema,
      transform: config.transformUpdate,
      include: config.include,
      auditAction: config.auditActions.update,
      entityName: config.entityName,
      identifyBy: config.identifyBy,
    }),
    deleteHandler: createAdminDeleteHandler({
      prismaModel: config.prismaModel,
      auditAction: config.auditActions.delete,
      entityName: config.entityName,
      checkDependencies: config.checkDependencies,
    }),
  };
}
