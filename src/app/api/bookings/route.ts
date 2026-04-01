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

    const bookingDate = new Date(`${data.bookingDate}T00:00:00`);

    if (Number.isNaN(bookingDate.getTime())) {
      return errorResponse('预约日期格式无效', 400);
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

    const conflict = await bookingModel.findFirst({
      where: {
        equipmentId: data.equipmentId,
        bookingDate,
        status: {
          in: activeConflictStatuses,
        },
        startTime: {
          lt: data.endTime,
        },
        endTime: {
          gt: data.startTime,
        },
      },
      select: {
        id: true,
      },
    });

    if (conflict) {
      return errorResponse('当前时间段已被预约，请重新选择时间', 409);
    }

    const booking = await bookingModel.create({
      data: {
        userId: user.userId,
        equipmentId: data.equipmentId,
        bookingDate,
        startTime: data.startTime,
        endTime: data.endTime,
        contactName: data.contactName.trim(),
        contactPhone: data.contactPhone.trim(),
        serviceName: data.serviceName?.trim() || null,
        purpose: data.purpose.trim(),
        notes: data.notes?.trim() || null,
        status: 'PENDING',
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