import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, withAuth, getPaginationParams, paginatedResponse } from '@/lib/api-helpers';
import { adminEquipmentCreateSchema } from '@/lib/validations';
import { JWTPayload } from '@/lib/auth';

const handleGet = async (request: NextRequest) => {
  try {
    const { page, pageSize, skip } = getPaginationParams(request);
    const url = new URL(request.url);
    const query = (url.searchParams.get('q') || '').trim();

    const where: Record<string, unknown> = {};
    if (query) {
      where.OR = [
        { nameZh: { contains: query, mode: 'insensitive' } },
        { nameEn: { contains: query, mode: 'insensitive' } },
        { model: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.equipment.findMany({
        where,
        include: { lab: { select: { id: true, nameZh: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.equipment.count({ where }),
    ]);

    return paginatedResponse(items, total, page, pageSize);
  } catch {
    return errorResponse('获取设备列表失败', 500);
  }
};

const handlePost = async (request: NextRequest, user: JWTPayload) => {
  try {
    const body = await request.json();
    const data = adminEquipmentCreateSchema.parse(body);
    const slug = data.slug || data.nameZh.replace(/\s+/g, '-').toLowerCase() + '-' + Date.now().toString(36);

    const equipment = await prisma.equipment.create({
      data: {
        slug,
        nameZh: data.nameZh,
        nameEn: data.nameEn,
        model: data.model,
        manufacturer: data.manufacturer,
        labId: data.labId,
        descZh: data.descZh,
        status: data.status || 'AVAILABLE',
        bookable: data.bookable ?? false,
        quantity: data.quantity,
        hourlyRate: data.hourlyRate,
        dailyRate: data.dailyRate,
      },
    });

    await prisma.auditLog.create({
      data: { userId: user.userId, action: 'ADMIN_CREATE_EQUIPMENT', entity: 'Equipment', entityId: equipment.id },
    });

    return successResponse(equipment, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse(error.issues[0]?.message || '参数无效', 400);
    return errorResponse('创建设备失败', 500);
  }
};

export const GET = withAuth(handleGet, ['SUPER_ADMIN']);
export const POST = withAuth(handlePost, ['SUPER_ADMIN']);
