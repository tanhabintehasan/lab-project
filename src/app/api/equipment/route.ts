import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { errorResponse, getPaginationParams, paginatedResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const { page, pageSize, skip } = getPaginationParams(request);
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const labId = url.searchParams.get('labId') || '';
    const status = url.searchParams.get('status') || '';

    const where: Prisma.EquipmentWhereInput = { isActive: true };
    if (query) {
      where.OR = [
        { nameZh: { contains: query, mode: 'insensitive' } },
        { nameEn: { contains: query, mode: 'insensitive' } },
        { model: { contains: query, mode: 'insensitive' } },
      ];
    }
    if (labId) where.labId = labId;
    if (status) where.status = status as Prisma.EnumEquipmentStatusFilter;

    const [equipment, total] = await Promise.all([
      prisma.equipment.findMany({
        where,
        include: { lab: { select: { nameZh: true, slug: true, city: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.equipment.count({ where }),
    ]);

    return paginatedResponse(equipment, total, page, pageSize);
  } catch {
    return errorResponse('获取失败', 500);
  }
}
