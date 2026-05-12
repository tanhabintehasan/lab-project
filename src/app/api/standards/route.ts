import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const standards = await prisma.testingStandard.findMany({
      orderBy: { code: 'asc' },
      select: {
        id: true,
        code: true,
        nameZh: true,
        nameEn: true,
        organization: true,
        _count: {
          select: { services: true },
        },
      },
    });

    const mapped = standards.map(std => ({
      id: std.id,
      code: std.code,
      name: std.nameZh,
      nameEn: std.nameEn,
      organization: std.organization,
      count: std._count.services,
    }));

    return successResponse(mapped);
  } catch (error) {
    console.error('Standards fetch error:', error);
    return errorResponse('获取标准列表失败', 500);
  }
}
