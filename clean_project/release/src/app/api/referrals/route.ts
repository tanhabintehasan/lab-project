import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    let referralCode = await prisma.referralCode.findUnique({ where: { userId: user.userId } });
    if (!referralCode) {
      referralCode = await prisma.referralCode.create({
        data: { userId: user.userId, code: `REF${user.userId.slice(0, 8).toUpperCase()}` },
      });
    }

    const referrals = await prisma.referral.findMany({
      where: { referrerUserId: user.userId },
      include: {
        referredUser: { select: { name: true, email: true, createdAt: true } },
        commissions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalCommissions = referrals.reduce((sum, r) =>
      sum + r.commissions.reduce((s, c) => s + Number(c.amount), 0), 0);

    return successResponse({
      code: referralCode.code,
      referrals,
      stats: {
        invited: referrals.length,
        qualified: referrals.filter(r => r.status !== 'registered').length,
        rewarded: referrals.filter(r => r.status === 'rewarded').length,
        totalCommissions,
      },
    });
  } catch {
    return errorResponse('获取失败', 500);
  }
}
