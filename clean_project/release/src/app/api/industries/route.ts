import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const industries = await prisma.industry.findMany({
      orderBy: { nameZh: 'asc' },
      select: {
        id: true,
        nameZh: true,
        nameEn: true,
        _count: {
          select: { services: true },
        },
      },
    });

    const mapped = industries.map(ind => ({
      id: ind.id,
      name: ind.nameZh,
      nameEn: ind.nameEn,
      count: ind._count.services,
    }));

    return successResponse(mapped);
  } catch (error) {
    console.error('Industries fetch error:', error);
    return errorResponse('获取行业列表失败', 500);
  }
}
