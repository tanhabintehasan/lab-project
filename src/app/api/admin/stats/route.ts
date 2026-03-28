import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withAuth } from '@/lib/api-helpers';

const handler = async (request: NextRequest) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalOrders,
      totalRevenue,
      todayRevenue,
      totalUsers,
      totalLabs,
      pendingOrders,
      activeServices,
      pendingPayments,
      failedPayments24h,
      refundedPaymentsToday,
      pendingWithdrawals,
      inactiveProviders,
      failedWebhooks24h,
    ] = await Promise.all([
      // Total orders
      prisma.order.count(),
      
      // Total revenue (paid orders only)
      prisma.order.aggregate({ 
        _sum: { totalAmount: true }, 
        where: { paymentStatus: 'PAID' } 
      }),
      
      // Today's revenue
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          paymentStatus: 'PAID',
          createdAt: { gte: todayStart }
        }
      }),
      
      // Total users
      prisma.user.count(),
      
      // Total active labs
      prisma.laboratory.count({ where: { status: 'ACTIVE' } }),
      
      // Pending orders
      prisma.order.count({ 
        where: { status: { in: ['PENDING_PAYMENT', 'PAID', 'SAMPLE_PENDING'] } } 
      }),
      
      // Active services
      prisma.testingService.count({ where: { isActive: true } }),
      
      // Pending payments
      prisma.payment.count({ where: { status: 'pending' } }),
      
      // Failed payments in last 24h
      prisma.payment.count({
        where: {
          status: 'failed',
          createdAt: { gte: last24h }
        }
      }),
      
      // Refunded payments today
      prisma.payment.count({
        where: {
          status: 'refunded',
          refundedAt: { gte: todayStart }
        }
      }),
      
      // Pending withdrawals
      prisma.withdrawalRequest.count({ where: { status: 'pending' } }),
      
      // Inactive payment providers
      prisma.paymentProvider.count({ 
        where: { 
          isEnabled: false 
        } 
      }),
      
      // Failed webhooks in last 24h
      prisma.webhookLog.count({
        where: {
          isVerified: false,
          createdAt: { gte: last24h }
        }
      }),
    ]);

    return successResponse({
      totalOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      todayRevenue: todayRevenue._sum.totalAmount || 0,
      totalUsers,
      totalLabs,
      pendingOrders,
      activeServices,
      pendingPayments,
      failedPayments24h,
      refundedPaymentsToday,
      pendingWithdrawals,
      inactiveProviders,
      failedWebhooks24h,
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return errorResponse('获取失败', 500);
  }
};

export const GET = withAuth(handler, ['SUPER_ADMIN', 'FINANCE_ADMIN']);
