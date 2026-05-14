import { NextRequest } from 'next/server';
import { successResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { requireLabAccess } from '@/lib/lab-auth';
import { getLabWalletSummary } from '@/lib/financial-ledger';
import { JWTPayload } from '@/lib/auth';

const handler = async (_request: NextRequest, user: JWTPayload) => {
  try {
    const { labId } = await requireLabAccess(user.userId);
    const summary = await getLabWalletSummary(labId);

    if (!summary) {
      return successResponse({
        labId,
        balance: 0,
        frozenAmount: 0,
        availableBalance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        currency: 'CNY',
      });
    }

    return successResponse({
      labId: summary.labId,
      balance: summary.balance.toNumber(),
      frozenAmount: summary.frozenAmount.toNumber(),
      availableBalance: summary.availableBalance.toNumber(),
      totalEarned: summary.totalEarned.toNumber(),
      totalWithdrawn: summary.totalWithdrawn.toNumber(),
      currency: summary.currency,
    });
  } catch (error: any) {
    if (error?.status === 403) {
      return errorResponse(error.message, 403);
    }
    console.error('Lab earnings error:', error);
    return errorResponse('获取收益信息失败', 500);
  }
};

export const GET = withAuth(handler, ['LAB_PARTNER', 'LAB_MANAGER', 'TECHNICIAN']);
