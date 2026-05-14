import { OrderStatus, Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, paginatedResponse, getPaginationParams, getAuthUser } from '@/lib/api-helpers';
import { generateOrderNo, generateSampleNo } from '@/lib/utils';

export const runtime = 'nodejs';

// GET - List orders
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    const { page, pageSize, skip } = getPaginationParams(request);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('q')?.trim() || '';

    const where: Prisma.OrderWhereInput = {};

    // Role-based filtering
    if (user.role === 'CUSTOMER' || user.role === 'ENTERPRISE_MEMBER') {
      where.userId = user.userId;
    } else if (user.role === 'LAB_PARTNER') {
      const labUser = await prisma.labUser.findUnique({
        where: { userId: user.userId },
        select: { labId: true },
      });
      if (labUser) {
        where.assignedLabId = labUser.labId;
      } else {
        // No lab assigned — return empty
        where.assignedLabId = '';
      }
    }
    // SUPER_ADMIN and FINANCE_ADMIN can see all

    if (status && (Object.values(OrderStatus) as string[]).includes(status)) {
      where.status = status as OrderStatus;
    }

    if (search) {
      where.OR = [
        { orderNo: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          lab: { select: { id: true, nameZh: true, slug: true } },
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

const checkoutOrderSchema = z.object({
  serviceSlug: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  sampleCount: z.number().int().positive().default(1),
  sampleName: z.string().min(1),
  sampleSpec: z.string().min(1),
  testRequirement: z.string().min(1),
  contactName: z.string().min(1),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(1),
  companyName: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  needInvoice: z.boolean().default(false),
  invoiceTitle: z.string().nullable().optional(),
  unitPrice: z.number().positive().optional(),
  totalAmount: z.number().positive().optional(),
  currency: z.string().default('CNY'),
  customFieldValues: z.record(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    const body = await request.json();

    // Support checkout-style orders (from /checkout page)
    if (body.serviceSlug) {
      const data = checkoutOrderSchema.parse(body);

      const service = await prisma.testingService.findUnique({
        where: { slug: data.serviceSlug },
      });

      if (!service || !service.isActive) {
        return errorResponse('服务不存在或已下架', 400);
      }

      const unitPrice = data.unitPrice ?? Number(service.priceMin ?? 0);
      const totalAmount = data.totalAmount ?? unitPrice * data.quantity;

      // Wrap order creation + side effects in a transaction for atomicity
      const order = await prisma.$transaction(async (tx) => {
        const created = await tx.order.create({
          data: {
            orderNo: generateOrderNo(),
            userId: user.userId,
            totalAmount,
            currency: data.currency,
            notes: data.remarks || data.testRequirement,
            items: {
              create: {
                serviceId: service.id,
                quantity: data.quantity,
                unitPrice,
                subtotal: totalAmount,
                notes: data.testRequirement,
              },
            },
            samples: {
              create: {
                sampleNo: generateSampleNo(),
                name: data.sampleName,
                description: data.sampleSpec,
                quantity: String(data.sampleCount),
                notes: data.testRequirement,
                customFieldValues: data.customFieldValues || Prisma.JsonNull,
              },
            },
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
            samples: true,
          },
        });

        // Create invoice request if needed (inside transaction)
        if (data.needInvoice && data.invoiceTitle) {
          await tx.invoice.create({
            data: {
              orderId: created.id,
              invoiceNo: `INV${Date.now()}`,
              type: '普通发票',
              amount: totalAmount,
              status: 'pending',
            },
          });
        }

        // Create notification (inside transaction)
        await tx.notification.create({
          data: {
            userId: user.userId,
            type: 'ORDER',
            titleZh: '订单创建成功',
            titleEn: 'Order Created',
            contentZh: `您的订单 ${created.orderNo} 已创建，请尽快完成付款。`,
            contentEn: `Your order ${created.orderNo} has been created. Please complete the payment.`,
            link: `/dashboard/orders/${created.id}`,
          },
        });

        return created;
      });

      return successResponse(order, 201);
    }

    // Standard cart-style order
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

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
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

      // Create notification (inside transaction)
      await tx.notification.create({
        data: {
          userId: user.userId,
          type: 'ORDER',
          titleZh: '订单创建成功',
          titleEn: 'Order Created',
          contentZh: `您的订单 ${created.orderNo} 已创建，请尽快完成付款。`,
          contentEn: `Your order ${created.orderNo} has been created. Please complete the payment.`,
          link: `/dashboard/orders/${created.id}`,
        },
      });

      return created;
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
