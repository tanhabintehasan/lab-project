import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, withAuth, getPaginationParams } from '@/lib/api-helpers';

const handler = async (request: NextRequest) => {
  try {
    const { page, pageSize, skip } = getPaginationParams(request);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          order: {
            select: {
              orderNo: true,
              userId: true,
              user: { select: { name: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.payment.count({ where }),
    ]);

    const mapped = payments.map(p => ({
      id: p.id,
      orderNo: p.order.orderNo,
      userId: p.order.userId,
      userName: p.order.user.name,
      userEmail: p.order.user.email,
      amount: Number(p.amount),
      method: p.method,
      status: p.status,
      paidAt: p.paidAt?.toISOString() || null,
      createdAt: p.createdAt.toISOString(),
    }));

    return successResponse({
      data: mapped,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      total,
    });
  } catch (error) {
    console.error('Payments fetch error:', error);
    return errorResponse('获取支付记录失败', 500);
  }
};

export const GET = withAuth(handler, ['SUPER_ADMIN', 'FINANCE_ADMIN']);
