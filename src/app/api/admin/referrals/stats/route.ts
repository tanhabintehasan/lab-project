import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, withAuth } from '@/lib/api-helpers';

const handler = async () => {
  try {
    const [totalReferrals, totalCommissionData, activeReferralCodes] = await Promise.all([
      prisma.referral.count(),
      prisma.commission.aggregate({
        _sum: { amount: true },
        where: { status: 'released' },
      }),
      prisma.referralCode.count(),
    ]);

    return successResponse({
      totalReferrals,
      totalCommission: Number(totalCommissionData._sum.amount || 0),
      activeReferralCodes,
    });
  } catch (error) {
    console.error('Referral stats error:', error);
    return errorResponse('获取统计数据失败', 500);
  }
};

export const GET = withAuth(handler, ['SUPER_ADMIN', 'FINANCE_ADMIN']);
