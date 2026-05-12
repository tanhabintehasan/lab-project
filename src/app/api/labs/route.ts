import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { errorResponse, getPaginationParams, paginatedResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const { page, pageSize, skip } = getPaginationParams(request);
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const city = url.searchParams.get('city') || '';

    const where: Prisma.LaboratoryWhereInput = { status: 'ACTIVE' };
    if (query) {
      where.OR = [
        { nameZh: { contains: query, mode: 'insensitive' } },
        { nameEn: { contains: query, mode: 'insensitive' } },
      ];
    }
    if (city) where.city = { contains: city, mode: 'insensitive' };

    const [labs, total] = await Promise.all([
      prisma.laboratory.findMany({
        where,
        include: {
          services: { include: { service: { select: { nameZh: true, slug: true } } }, take: 5 },
          _count: { select: { orders: true, equipment: true } },
        },
        orderBy: { rating: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.laboratory.count({ where }),
    ]);

    return paginatedResponse(labs, total, page, pageSize);
  } catch {
    return errorResponse('获取失败', 500);
  }
}
