import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { adminEquipmentCreateSchema } from '@/lib/validations';
import { JWTPayload } from '@/lib/auth';

const handleGet = async (request: NextRequest) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop()!;
  try {
    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: { lab: { select: { id: true, nameZh: true } } },
    });
    if (!equipment) return errorResponse('设备未找到', 404);
    return successResponse(equipment);
  } catch {
    return errorResponse('获取设备失败', 500);
  }
};

const handlePut = async (request: NextRequest, user: JWTPayload) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop()!;
  try {
    const body = await request.json();
    const data = adminEquipmentCreateSchema.partial().parse(body);

    const updateData: Record<string, unknown> = {
      nameZh: data.nameZh,
      nameEn: data.nameEn,
      model: data.model,
      manufacturer: data.manufacturer,
      descZh: data.descZh,
      status: data.status,
      bookable: data.bookable,
      quantity: data.quantity,
      hourlyRate: data.hourlyRate,
      dailyRate: data.dailyRate,
    };

    if (data.labId) {
      updateData.lab = { connect: { id: data.labId } };
    } else if (data.labId === null || data.labId === '') {
      updateData.lab = { disconnect: true };
    }

    const equipment = await prisma.equipment.update({ where: { id }, data: updateData });

    await prisma.auditLog.create({
      data: { userId: user.userId, action: 'ADMIN_UPDATE_EQUIPMENT', entity: 'Equipment', entityId: id },
    });

    return successResponse(equipment);
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse(error.issues[0]?.message || '参数无效', 400);
    return errorResponse('更新设备失败', 500);
  }
};

const handlePatch = async (request: NextRequest, user: JWTPayload) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop()!;
  try {
    const body = await request.json();
    const { status, bookable } = z.object({
      status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'UNAVAILABLE']).optional(),
      bookable: z.boolean().optional(),
    }).parse(body);

    const equipment = await prisma.equipment.update({
      where: { id },
      data: { status, bookable },
    });

    await prisma.auditLog.create({
      data: { userId: user.userId, action: 'ADMIN_UPDATE_EQUIPMENT_STATUS', entity: 'Equipment', entityId: id },
    });

    return successResponse(equipment);
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse(error.issues[0]?.message || '参数无效', 400);
    return errorResponse('更新设备状态失败', 500);
  }
};

const handleDelete = async (request: NextRequest, user: JWTPayload) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop()!;
  try {
    await prisma.equipment.delete({ where: { id } });
    await prisma.auditLog.create({
      data: { userId: user.userId, action: 'ADMIN_DELETE_EQUIPMENT', entity: 'Equipment', entityId: id },
    });
    return successResponse({ id });
  } catch (error: any) {
    if (error?.code === 'P2003') {
      return errorResponse('该设备已有关联预约记录，无法删除', 400);
    }
    return errorResponse('删除设备失败', 500);
  }
};

export const GET = withAuth(handleGet, ['SUPER_ADMIN']);
export const PUT = withAuth(handlePut, ['SUPER_ADMIN']);
export const PATCH = withAuth(handlePatch, ['SUPER_ADMIN']);
export const DELETE = withAuth(handleDelete, ['SUPER_ADMIN']);
