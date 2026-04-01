import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JWTPayload, COOKIE_NAME } from './auth';
import { prisma } from './db';
import { ZodSchema, ZodError } from 'zod';

export interface ApiContext {
  user: JWTPayload | null;
  params?: Record<string, string>;
}

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
) {
  return NextResponse.json({
    success: true,
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

/**
 * Authenticate the request by reading the HttpOnly cookie,
 * verifying the JWT, and checking the session exists in the DB.
 */
export async function getAuthUser(request: NextRequest): Promise<JWTPayload | null> {
  // Primary: HttpOnly cookie
  let token = request.cookies.get(COOKIE_NAME)?.value;

  // Fallback: Authorization header (for API clients / tests)
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  // Verify session still exists and is not expired
  if (payload.sessionId) {
    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
    });
    if (!session || session.expiresAt < new Date()) {
      // Session revoked or expired
      if (session) {
        await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      }
      return null;
    }
  }

  return payload;
}

export function getPaginationParams(request: NextRequest) {
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || '20')));
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip };
}

export function getSearchParams(request: NextRequest) {
  const url = new URL(request.url);
  return {
    query: url.searchParams.get('q') || url.searchParams.get('query') || '',
    sort: url.searchParams.get('sort') || 'createdAt',
    order: (url.searchParams.get('order') || 'desc') as 'asc' | 'desc',
    status: url.searchParams.get('status') || undefined,
    category: url.searchParams.get('category') || undefined,
  };
}

export async function validateBody<T>(request: NextRequest, schema: ZodSchema<T>): Promise<T> {
  const body = await request.json();
  return schema.parse(body);
}

export function withAuth(
  handler: (request: NextRequest, user: JWTPayload) => Promise<NextResponse>,
  requiredRoles?: string[]
) {
  return async (request: NextRequest) => {
    const user = await getAuthUser(request);
    if (!user) {
      return errorResponse('未授权访问', 401);
    }
    if (requiredRoles && !requiredRoles.includes(user.role) && user.role !== 'SUPER_ADMIN') {
      return errorResponse('权限不足', 403);
    }
    return handler(request, user);
  };
}
