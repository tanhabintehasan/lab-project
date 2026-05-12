import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const materials = await prisma.material.findMany({
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

    const mapped = materials.map(mat => ({
      id: mat.id,
      name: mat.nameZh,
      nameEn: mat.nameEn,
      count: mat._count.services,
    }));

    return successResponse(mapped);
  } catch (error) {
    console.error('Materials fetch error:', error);
    return errorResponse('获取材料列表失败', 500);
  }
}
