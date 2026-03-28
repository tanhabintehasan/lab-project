import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET() {
  try {
    const categories = await prisma.serviceCategory.findMany({
      where: { isActive: true },
      select: {
        id: true,
        nameZh: true,
        nameEn: true,
        slug: true,
        icon: true,
        _count: {
          select: {
            services: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const data = categories.map((c) => ({
      id: c.id,
      nameZh: c.nameZh,
      nameEn: c.nameEn,
      slug: c.slug,
      icon: c.icon,
      serviceCount: c._count.services,
    }));

    return successResponse(data);
  } catch (error) {
    console.error(error);
    return errorResponse('获取分类失败', 500);
  }
}