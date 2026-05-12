import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import {
  errorResponse,
  getAuthUser,
  getPaginationParams,
  paginatedResponse,
  successResponse,
} from '@/lib/api-helpers';

const createBookingSchema = z.object({
  equipmentId: z.string().min(1, '设备不能为空'),
  bookingDate: z.string().min(1, '预约日期不能为空'),
  startTime: z.string().min(1, '开始时间不能为空'),
  endTime: z.string().min(1, '结束时间不能为空'),
  contactName: z.string().min(1, '联系人不能为空'),
  contactPhone: z.string().min(1, '联系电话不能为空'),
  serviceName: z.string().nullable().optional(),
  purpose: z.string().min(1, '预约用途不能为空'),
  notes: z.string().nullable().optional(),
});

function getBookingDelegate() {
  return (prisma as unknown as Record<string, any>).equipmentBooking;
}

const activeConflictStatuses = ['PENDING', 'APPROVED', 'CONFIRMED', 'IN_PROGRESS'];

function toDateTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00`);
}

function getUtcDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function hoursBetween(start: Date, end: Date): number {
  return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user) {
      return errorResponse('未授权访问', 401);
    }

    const bookingModel = getBookingDelegate();
    if (!bookingModel) {
      return errorResponse('Booking model is not configured yet', 500);
    }

    const { page, pageSize, skip } = getPaginationParams(request);
    const url = new URL(request.url);
    const query = (url.searchParams.get('q') || '').trim();
    const status = (url.searchParams.get('status') || '').trim();

    const where: Record<string, unknown> = {
      userId: user.userId,
    };

    if (status) {
      where.status = status;
    }

    if (query) {
      where.OR = [
        {
          purpose: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          serviceName: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          contactName: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          equipment: {
            nameZh: {
              contains: query,
              mode: 'insensitive',
            },
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
                  nameZh: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: [
          { bookingDate: 'desc' },
          { startTime: 'asc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: pageSize,
      }),
      bookingModel.count({ where }),
    ]);

    return paginatedResponse(bookings, total, page, pageSize);
  } catch (error) {
    console.error('Bookings GET error:', error);
    return errorResponse('获取预约记录失败', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user) {
      return errorResponse('请先登录后再预约设备', 401);
    }

    const bookingModel = getBookingDelegate();
    if (!bookingModel) {
      return errorResponse('Booking model is not configured yet', 500);
    }

    const body = await request.json();
    const data = createBookingSchema.parse(body);

    if (data.startTime >= data.endTime) {
      return errorResponse('结束时间必须晚于开始时间', 400);
    }

    const bookingDate = getUtcDate(data.bookingDate);

    if (Number.isNaN(bookingDate.getTime())) {
      return errorResponse('预约日期格式无效', 400);
    }

    const startDateTime = toDateTime(data.bookingDate, data.startTime);
    const endDateTime = toDateTime(data.bookingDate, data.endTime);

    if (Number.isNaN(startDateTime.getTime()) || Number.isNaN(endDateTime.getTime())) {
      return errorResponse('时间格式无效', 400);
    }

    const equipment = await prisma.equipment.findUnique({
      where: { id: data.equipmentId },
      select: {
        id: true,
        nameZh: true,
        slug: true,
        status: true,
        bookable: true,
        isActive: true,
        quantity: true,
        hourlyRate: true,
        dailyRate: true,
      },
    });

    if (!equipment || !equipment.isActive) {
      return errorResponse('设备不存在或已下线', 404);
    }

    if (!equipment.bookable) {
      return errorResponse('该设备当前不可预约', 400);
    }

    if (equipment.status !== 'AVAILABLE') {
      return errorResponse('该设备当前状态不可预约', 400);
    }

    const overlappingCount = await bookingModel.count({
      where: {
        equipmentId: data.equipmentId,
        bookingDate,
        status: {
          in: activeConflictStatuses,
        },
        startTime: {
          lt: endDateTime,
        },
        endTime: {
          gt: startDateTime,
        },
      },
    });

    if (overlappingCount >= equipment.quantity) {
      return errorResponse('当前时间段预约已满，请重新选择时间', 409);
    }

    // Calculate total price
    let totalPrice: number | undefined;
    const durationHours = hoursBetween(startDateTime, endDateTime);
    if (equipment.hourlyRate !== null && equipment.hourlyRate !== undefined) {
      totalPrice = Number(equipment.hourlyRate) * durationHours;
    } else if (equipment.dailyRate !== null && equipment.dailyRate !== undefined && durationHours > 0) {
      const days = Math.ceil(durationHours / 24);
      totalPrice = Number(equipment.dailyRate) * days;
    }

    const booking = await bookingModel.create({
      data: {
        userId: user.userId,
        equipmentId: data.equipmentId,
        bookingDate,
        startTime: startDateTime,
        endTime: endDateTime,
        contactName: data.contactName.trim(),
        contactPhone: data.contactPhone.trim(),
        serviceName: data.serviceName?.trim() || null,
        purpose: data.purpose.trim(),
        notes: data.notes?.trim() || null,
        status: 'PENDING',
        totalPrice: totalPrice !== undefined ? totalPrice : undefined,
      },
      include: {
        equipment: {
          select: {
            id: true,
            slug: true,
            nameZh: true,
          },
        },
      },
    });

    return successResponse(booking, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '参数无效', 400);
    }

    console.error('Bookings POST error:', error);
    return errorResponse('创建预约失败', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return errorResponse('未授权访问', 401);
    }

    const bookingModel = getBookingDelegate();
    if (!bookingModel) {
      return errorResponse('Booking model is not configured yet', 500);
    }

    const body = await request.json();
    const { id, status } = z.object({
      id: z.string().min(1),
      status: z.enum(['CANCELLED']),
    }).parse(body);

    const booking = await bookingModel.findUnique({ where: { id } });
    if (!booking) {
      return errorResponse('预约记录不存在', 404);
    }

    if (booking.userId !== user.userId) {
      return errorResponse('无权操作此预约', 403);
    }

    if (booking.status === 'COMPLETED') {
      return errorResponse('已完成预约无法取消', 400);
    }

    const updated = await bookingModel.update({
      where: { id },
      data: { status },
    });

    return successResponse(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '参数无效', 400);
    }
    console.error('Bookings PATCH error:', error);
    return errorResponse('更新预约失败', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return errorResponse('未授权访问', 401);
    }

    const bookingModel = getBookingDelegate();
    if (!bookingModel) {
      return errorResponse('Booking model is not configured yet', 500);
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return errorResponse('预约ID不能为空', 400);
    }

    const booking = await bookingModel.findUnique({ where: { id } });
    if (!booking) {
      return errorResponse('预约记录不存在', 404);
    }

    if (booking.userId !== user.userId) {
      return errorResponse('无权删除此预约', 403);
    }

    await bookingModel.delete({ where: { id } });
    return successResponse({ id });
  } catch (error) {
    console.error('Bookings DELETE error:', error);
    return errorResponse('删除预约失败', 500);
  }
}
