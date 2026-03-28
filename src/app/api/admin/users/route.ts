import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { errorResponse, withAuth, getPaginationParams, paginatedResponse } from '@/lib/api-helpers';

const handler = async (request: NextRequest) => {
  try {
    const { page, pageSize, skip } = getPaginationParams(request);
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const role = url.searchParams.get('role') || '';
    const status = url.searchParams.get('status') || '';

    const where: Prisma.UserWhereInput = {};
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role as Prisma.EnumUserRoleFilter;
    if (status) where.status = status as Prisma.EnumUserStatusFilter;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, email: true, name: true, phone: true, role: true, status: true,
          locale: true, createdAt: true, lastLoginAt: true,
          company: { include: { company: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return paginatedResponse(users, total, page, pageSize);
  } catch {
    return errorResponse('获取失败', 500);
  }
};

export const GET = withAuth(handler, ['SUPER_ADMIN', 'FINANCE_ADMIN']);
