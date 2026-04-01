import { OrderStatus, Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, paginatedResponse, getPaginationParams, getAuthUser } from '@/lib/api-helpers';
import { generateOrderNo } from '@/lib/utils';

// GET - List orders
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    const { page, pageSize, skip } = getPaginationParams(request);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    const where: Prisma.OrderWhereInput = {};

    // Role-based filtering
    if (user.role === 'CUSTOMER' || user.role === 'ENTERPRISE_MEMBER') {
      where.userId = user.userId;
    } else if (user.role === 'LAB_PARTNER') {
      where.assignedTo = user.userId;
    }
    // SUPER_ADMIN and FINANCE_ADMIN can see all

    if (status && (Object.values(OrderStatus) as string[]).includes(status)) {
      where.status = status as OrderStatus;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: { include: { service: { select: { nameZh: true, slug: true } } } },
          samples: { select: { id: true, sampleNo: true, status: true } },
          _count: { select: { reports: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    return paginatedResponse(orders, total, page, pageSize);
  } catch (error) {
    console.error('Orders fetch error:', error);
    return errorResponse('获取订单列表失败', 500);
  }
}

// POST - Create order
const createOrderSchema = z.object({
  items: z.array(z.object({
    serviceId: z.string(),
    quantity: z.number().int().positive().default(1),
  })).min(1),
  addressId: z.string().optional(),
  notes: z.string().optional(),
  quotationId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    const body = await request.json();
    const data = createOrderSchema.parse(body);

    // Fetch service prices
    const serviceIds = data.items.map(item => item.serviceId);
    const services = await prisma.testingService.findMany({
      where: { id: { in: serviceIds }, isActive: true },
    });

    if (services.length !== serviceIds.length) {
      return errorResponse('部分服务不存在或已下架', 400);
    }

    // Calculate total
    let totalAmount = 0;
    const orderItems = data.items.map(item => {
      const service = services.find((s) => s.id === item.serviceId)!;
      const unitPrice = Number(service.priceMin ?? 0);
      const subtotal = unitPrice * item.quantity;
      totalAmount += subtotal;
      return {
        serviceId: item.serviceId,
        quantity: item.quantity,
        unitPrice,
        subtotal,
      };
    });

    const order = await prisma.order.create({
      data: {
        orderNo: generateOrderNo(),
        userId: user.userId,
        addressId: data.addressId,
        totalAmount,
        notes: data.notes,
        quotationId: data.quotationId,
        items: { create: orderItems },
        timeline: {
          create: {
            status: 'PENDING_PAYMENT',
            title: '订单已创建',
            description: '等待付款',
            operator: user.email,
          },
        },
      },
      include: {
        items: { include: { service: true } },
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.userId,
        type: 'ORDER',
        titleZh: '订单创建成功',
        titleEn: 'Order Created',
        contentZh: `您的订单 ${order.orderNo} 已创建，请尽快完成付款。`,
        contentEn: `Your order ${order.orderNo} has been created. Please complete the payment.`,
        link: `/dashboard/orders/${order.id}`,
      },
    });

    return successResponse(order, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '请求参数无效', 400);
    }
    console.error('Order creation error:', error);
    return errorResponse('创建订单失败', 500);
  }
}
