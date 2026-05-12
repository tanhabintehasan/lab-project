import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import {
  errorResponse,
  getPaginationParams,
  paginatedResponse,
  successResponse,
  withAuth,
} from '@/lib/api-helpers';
import { JWTPayload } from '@/lib/auth';

function getBookingDelegate() {
  return (prisma as unknown as Record<string, any>).equipmentBooking;
}

const handleGet = async (request: NextRequest) => {
  try {
    const bookingModel = getBookingDelegate();
    if (!bookingModel) {
      return errorResponse('Booking model is not configured yet', 500);
    }

    const { page, pageSize, skip } = getPaginationParams(request);
    const url = new URL(request.url);
    const query = (url.searchParams.get('q') || '').trim();
    const status = (url.searchParams.get('status') || '').trim();

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }

    if (query) {
      where.OR = [
        { purpose: { contains: query, mode: 'insensitive' } },
        { serviceName: { contains: query, mode: 'insensitive' } },
        { contactName: { contains: query, mode: 'insensitive' } },
        {
          equipment: {
            nameZh: { contains: query, mode: 'insensitive' },
          },
        },
        {
          user: {
            name: { contains: query, mode: 'insensitive' },
          },
        },
      ];
    }

    const [bookings, total] = await Promise.all([
      bookingModel.findMany({
        where,
        include: {
          equipment: {
            select: {
              id: true,
              slug: true,
              nameZh: true,
              model: true,
              lab: {
                select: {
                  id: true,
                  nameZh: true,
                  slug: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: pageSize,
      }),
      bookingModel.count({ where }),
    ]);

    return paginatedResponse(bookings, total, page, pageSize);
  } catch (error) {
    console.error('Admin bookings GET error:', error);
    return errorResponse('获取预约列表失败', 500);
  }
};

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['PENDING', 'APPROVED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED']),
});

const handlePatch = async (request: NextRequest, user: JWTPayload) => {
  try {
    const bookingModel = getBookingDelegate();
    if (!bookingModel) {
      return errorResponse('Booking model is not configured yet', 500);
    }

    const body = await request.json();
    const { id, status } = patchSchema.parse(body);

    const existing = await bookingModel.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse('预约记录不存在', 404);
    }

    const updated = await bookingModel.update({
      where: { id },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'ADMIN_UPDATE_BOOKING_STATUS',
        entity: 'EquipmentBooking',
        entityId: id,
        details: { oldStatus: existing.status, newStatus: status },
      },
    });

    return successResponse(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '参数无效', 400);
    }
    console.error('Admin bookings PATCH error:', error);
    return errorResponse('更新预约状态失败', 500);
  }
};

export const GET = withAuth(handleGet, ['SUPER_ADMIN']);
export const PATCH = withAuth(handlePatch, ['SUPER_ADMIN']);
