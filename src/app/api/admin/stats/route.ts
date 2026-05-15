import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withAuth } from '@/lib/api-helpers';

export const runtime = 'nodejs';

const handler = async (request: NextRequest) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const results = await Promise.allSettled([
      // Total orders
      prisma.order.count(),

      // Total revenue (paid orders only)
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: 'PAID' },
      }),

      // Today's revenue
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          paymentStatus: 'PAID',
          createdAt: { gte: todayStart },
        },
      }),

      // Total users
      prisma.user.count(),

      // Total active labs
      prisma.laboratory.count({ where: { status: 'ACTIVE' } }),

      // Pending orders
      prisma.order.count({
        where: { status: { in: ['PENDING_PAYMENT', 'PAID', 'SAMPLE_PENDING'] } },
      }),

      // Active services
      prisma.testingService.count({ where: { isActive: true } }),

      // Pending payments
      prisma.payment.count({ where: { status: 'pending' } }),

      // Failed payments in last 24h
      prisma.payment.count({
        where: {
          status: 'failed',
          createdAt: { gte: last24h },
        },
      }),

      // Refunded payments today
      prisma.payment.count({
        where: {
          status: 'refunded',
          refundedAt: { gte: todayStart },
        },
      }),

      // Pending withdrawals
      prisma.withdrawalRequest.count({ where: { status: 'pending' } }),

      // Inactive payment providers
      prisma.paymentProvider.count({
        where: {
          isEnabled: false,
        },
      }),

      // Failed webhooks in last 24h
      prisma.webhookLog.count({
        where: {
          isVerified: false,
          createdAt: { gte: last24h },
        },
      }),
    ]);

    const [
      totalOrdersR,
      totalRevenueR,
      todayRevenueR,
      totalUsersR,
      totalLabsR,
      pendingOrdersR,
      activeServicesR,
      pendingPaymentsR,
      failedPayments24hR,
      refundedPaymentsTodayR,
      pendingWithdrawalsR,
      inactiveProvidersR,
      failedWebhooks24hR,
    ] = results;

    const unwrap = <T>(result: PromiseSettledResult<T>, fallback: T): T => {
      if (result.status === 'fulfilled') return result.value;
      console.error('Stats query failed:', result.reason);
      return fallback;
    };

    const unwrapAgg = (
      result: PromiseSettledResult<{ _sum: { totalAmount: unknown } }>
    ): number => {
      if (result.status === 'fulfilled') {
        const val = result.value._sum.totalAmount;
        return val == null ? 0 : Number(val);
      }
      console.error('Stats aggregate query failed:', result.reason);
      return 0;
    };

    return successResponse({
      totalOrders: unwrap(totalOrdersR, 0),
      totalRevenue: unwrapAgg(totalRevenueR),
      todayRevenue: unwrapAgg(todayRevenueR),
      totalUsers: unwrap(totalUsersR, 0),
      totalLabs: unwrap(totalLabsR, 0),
      pendingOrders: unwrap(pendingOrdersR, 0),
      activeServices: unwrap(activeServicesR, 0),
      pendingPayments: unwrap(pendingPaymentsR, 0),
      failedPayments24h: unwrap(failedPayments24hR, 0),
      refundedPaymentsToday: unwrap(refundedPaymentsTodayR, 0),
      pendingWithdrawals: unwrap(pendingWithdrawalsR, 0),
      inactiveProviders: unwrap(inactiveProvidersR, 0),
      failedWebhooks24h: unwrap(failedWebhooks24hR, 0),
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return errorResponse('获取失败', 500);
  }
};

export const GET = withAuth(handler, ['SUPER_ADMIN', 'FINANCE_ADMIN']);
