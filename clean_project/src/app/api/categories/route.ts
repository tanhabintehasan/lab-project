import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-helpers';

type CategoryRow = {
  id: string;
  nameZh: string;
  nameEn: string | null;
  slug: string;
  descZh: string | null;
  icon: string | null;
  _count: {
    services: number;
  };
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageSizeParam = Number(searchParams.get('pageSize') || '100');
    const pageSize = Number.isNaN(pageSizeParam) ? 100 : pageSizeParam;

    const categories = await prisma.serviceCategory.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: pageSize,
      select: {
        id: true,
        nameZh: true,
        nameEn: true,
        slug: true,
        descZh: true,
        icon: true,
        _count: {
          select: {
            services: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
    });

    const mapped = categories.map((cat: CategoryRow) => ({
      id: cat.id,
      slug: cat.slug,
      nameZh: cat.nameZh,
      nameEn: cat.nameEn,
      descZh: cat.descZh,
      icon: cat.icon,
      serviceCount: cat._count.services,
    }));

    return successResponse(mapped);
  } catch (error) {
    console.error('Service categories fetch error:', error);

    return errorResponse(
      error instanceof Error ? error.message : '获取分类失败',
      500
    );
  }
}