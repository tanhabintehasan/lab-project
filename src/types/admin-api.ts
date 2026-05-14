import { NextRequest, NextResponse } from 'next/server';
import { JWTPayload } from '@/lib/auth';
import { ZodSchema } from 'zod';

// ─── Route Context (Next.js App Router) ──────────────────────

export interface AdminRouteContext {
  params: Promise<Record<string, string>>;
}

export type AdminRouteHandler = (
  request: NextRequest,
  user: JWTPayload,
  context: AdminRouteContext
) => Promise<NextResponse>;

// ─── API Wrapper Options ─────────────────────────────────────

export interface AdminApiOptions {
  roles: string[];
  requireCsrf?: boolean; // default true for POST/PUT/PATCH/DELETE
}

// ─── List Query Parameters ───────────────────────────────────

export interface AdminListQueryParams {
  page: number;
  pageSize: number;
  skip: number;
  query: string;
  sort: string;
  order: 'asc' | 'desc';
  status?: string;
  filters: Record<string, string | undefined>;
}

// ─── Prisma Model Delegates (minimal typing) ─────────────────

export interface PrismaListModel<T = any> {
  findMany: (args: any) => Promise<T[]>;
  count: (args: any) => Promise<number>;
}

export interface PrismaDetailModel<T = any> {
  findUnique: (args: any) => Promise<T | null>;
}

export interface PrismaCreateModel<T = any> {
  create: (args: any) => Promise<T>;
}

export interface PrismaUpdateModel<T = any> {
  findUnique: (args: any) => Promise<{ id: string } | null>;
  update: (args: any) => Promise<T>;
}

export interface PrismaDeleteModel<T = any> {
  findUnique: (args: any) => Promise<{ id: string; [key: string]: any } | null>;
  delete: (args: any) => Promise<any>;
}

// ─── Handler Configuration ───────────────────────────────────

export interface AdminListHandlerConfig<T = any> {
  prismaModel: PrismaListModel<T>;
  searchFields?: string[];
  include?: Record<string, any>;
  where?: Record<string, any>;
  orderBy?: Record<string, any> | Array<Record<string, any>>;
  transformItem?: (item: T) => any;
}

export interface AdminGetHandlerConfig<T = any> {
  prismaModel: PrismaDetailModel<T>;
  include?: Record<string, any>;
  notFoundMessage?: string;
  identifyBy?: 'id' | 'slug' | 'id-or-slug';
}

export interface AdminCreateHandlerConfig<T = any, D = any> {
  prismaModel: PrismaCreateModel<T>;
  schema: ZodSchema<D>;
  transform?: (data: D, user: JWTPayload) => any;
  include?: Record<string, any>;
  auditAction: string;
  entityName: string;
  successStatus?: number;
}

export interface AdminUpdateHandlerConfig<T = any, D = any> {
  prismaModel: PrismaUpdateModel<T>;
  schema: ZodSchema<D>;
  transform?: (data: D, existing: { id: string }, user: JWTPayload) => any;
  include?: Record<string, any>;
  auditAction: string;
  entityName: string;
  notFoundMessage?: string;
  identifyBy?: 'id' | 'slug' | 'id-or-slug';
}

export interface AdminDeleteHandlerConfig {
  prismaModel: PrismaDeleteModel;
  auditAction: string;
  entityName: string;
  notFoundMessage?: string;
  checkDependencies?: (id: string) => Promise<string | null>;
}

export interface AdminToggleHandlerConfig<T = any> {
  prismaModel: PrismaUpdateModel<T>;
  schema: ZodSchema<any>;
  auditAction: string;
  entityName: string;
  notFoundMessage?: string;
  fieldMapping?: Record<string, string>;
}

// ─── Audit Log Helper ────────────────────────────────────────

export interface AdminAuditLogOptions {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  details?: Record<string, any>;
  ipAddress?: string;
}
