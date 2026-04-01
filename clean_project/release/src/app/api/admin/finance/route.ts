import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, withAuth } from '@/lib/api-helpers';

const handler = async (request: NextRequest) => {
  try {
    const [totalRevenue, pendingPayments, pendingWithdrawals, issuedInvoices] = await Promise.all([
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'success' } }),
      prisma.payment.count({ where: { status: 'pending' } }),
      prisma.withdrawalRequest.count({ where: { status: 'pending' } }),
      prisma.invoice.count({ where: { status: 'issued' } }),
    ]);

    return successResponse({
      totalRevenue: totalRevenue._sum.amount || 0,
      pendingPayments,
      pendingWithdrawals,
      issuedInvoices,
    });
  } catch {
    return errorResponse('获取失败', 500);
  }
};

export const GET = withAuth(handler, ['SUPER_ADMIN', 'FINANCE_ADMIN']);
