import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, withAuth, getPaginationParams } from '@/lib/api-helpers';

const handler = async (request: NextRequest) => {
  try {
    const { page, pageSize, skip } = getPaginationParams(request);

    const [referrals, total] = await Promise.all([
      prisma.referral.findMany({
        include: {
          referrerUser: { select: { name: true, email: true } },
          referredUser: { select: { name: true, email: true } },
          commissions: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.referral.count(),
    ]);

    const mapped = referrals.map(ref => ({
      id: ref.id,
      referrerName: ref.referrerUser.name,
      referredName: ref.referredUser.name,
      status: ref.status,
      orderCount: ref.commissions.length,
      totalCommission: ref.commissions.reduce((sum, c) => sum + Number(c.amount), 0),
      createdAt: ref.createdAt.toISOString(),
    }));

    return successResponse({
      data: mapped,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      total,
    });
  } catch (error) {
    console.error('Referrals fetch error:', error);
    return errorResponse('获取推荐列表失败', 500);
  }
};

export const GET = withAuth(handler, ['SUPER_ADMIN', 'FINANCE_ADMIN']);
