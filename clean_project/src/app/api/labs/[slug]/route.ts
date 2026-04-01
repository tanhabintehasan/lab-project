import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const lab = await prisma.laboratory.findUnique({
      where: { slug },
      include: {
        services: { include: { service: { select: { id: true, nameZh: true, nameEn: true, slug: true, priceMin: true } } } },
        equipment: { where: { isActive: true }, select: { id: true, nameZh: true, slug: true, model: true, status: true } },
        media: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { orders: true } },
      },
    });

    if (!lab) return errorResponse('实验室未找到', 404);
    return successResponse(lab);
  } catch {
    return errorResponse('获取失败', 500);
  }
}
