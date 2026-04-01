import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    const [activeOrders, pendingQuotations, reportsReady, wallet] = await Promise.all([
      prisma.order.count({ where: { userId: user.userId, status: { notIn: ['COMPLETED', 'CANCELLED', 'REFUNDED'] } } }),
      prisma.quotation.count({ where: { userId: user.userId, status: 'SENT' } }),
      prisma.report.count({ where: { order: { userId: user.userId }, status: 'PUBLISHED' } }),
      prisma.wallet.findUnique({ where: { userId: user.userId }, select: { balance: true } }),
    ]);

    return successResponse({
      activeOrders,
      pendingQuotations,
      reportsReady,
      walletBalance: wallet?.balance || 0,
    });
  } catch {
    return errorResponse('获取失败', 500);
  }
}
