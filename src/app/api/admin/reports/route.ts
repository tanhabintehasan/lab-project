import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { errorResponse, getAuthUser, getPaginationParams, paginatedResponse } from '@/lib/api-helpers';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('Unauthorized', 401);

  // Only admins can access
  const adminRoles = ['SUPER_ADMIN', 'FINANCE_ADMIN'];
  if (!adminRoles.includes(user.role)) {
    return errorResponse('Forbidden', 403);
  }

  try {
    const { page, pageSize, skip } = getPaginationParams(request);
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || undefined;
    const search = url.searchParams.get('q')?.trim() || '';

    const where: Prisma.ReportWhereInput = {};

    if (status) where.status = status as Prisma.EnumReportStatusFilter;
    if (search) {
      where.OR = [
        { reportNo: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { order: { orderNo: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          order: { select: { orderNo: true, id: true, userId: true } },
          attachments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.report.count({ where }),
    ]);

    return paginatedResponse(reports, total, page, pageSize);
  } catch (error) {
    console.error('Admin reports fetch error:', error);
    return errorResponse('Failed to fetch reports', 500);
  }
}
