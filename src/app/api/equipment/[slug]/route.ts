import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const equipment = await prisma.equipment.findUnique({
      where: { slug },
      include: { lab: { select: { id: true, nameZh: true, slug: true, city: true } } },
    });
    if (!equipment) return errorResponse('设备未找到', 404);
    return successResponse(equipment);
  } catch {
    return errorResponse('获取失败', 500);
  }
}
