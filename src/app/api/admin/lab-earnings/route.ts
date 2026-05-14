import { NextRequest } from 'next/server';
import {
  successResponse,
  errorResponse,
  withAuth,
  getPaginationParams,
  paginatedResponse,
} from '@/lib/api-helpers';
import { getPlatformEarningsSummary, getAllLabWallets } from '@/lib/financial-ledger';
import { JWTPayload } from '@/lib/auth';

/**
 * GET /api/admin/lab-earnings
 *
 * Query params:
 *   - page, pageSize (for wallet listing)
 *
 * Returns platform-wide earnings summary + paginated lab wallets.
 */
const handler = async (request: NextRequest, _user: JWTPayload) => {
  try {
    const { page, pageSize } = getPaginationParams(request);

    const [summary, labs] = await Promise.all([
      getPlatformEarningsSummary(),
      getAllLabWallets({ page, pageSize }),
    ]);

    return successResponse({
      summary: {
        totalLabWallets: summary.totalLabWallets,
        totalLabBalance: summary.totalLabBalance.toNumber(),
        totalLabEarned: summary.totalLabEarned.toNumber(),
        totalLabWithdrawn: summary.totalLabWithdrawn.toNumber(),
        totalPayouts: summary.totalPayouts,
        totalGrossAmount: summary.totalGrossAmount.toNumber(),
        totalPlatformFees: summary.totalPlatformFees.toNumber(),
        totalNetPaid: summary.totalNetPaid.toNumber(),
      },
      labs: paginatedResponse(
        labs.wallets.map((w: any) => ({
          id: w.id,
          labId: w.labId,
          labName: w.lab?.nameZh || w.lab?.nameEn || '-',
          labSlug: w.lab?.slug,
          labStatus: w.lab?.status,
          balance: w.balance?.toString ? w.balance.toString() : w.balance,
          frozenAmount: w.frozenAmount?.toString ? w.frozenAmount.toString() : w.frozenAmount,
          totalEarned: w.totalEarned?.toString ? w.totalEarned.toString() : w.totalEarned,
          totalWithdrawn: w.totalWithdrawn?.toString
            ? w.totalWithdrawn.toString()
            : w.totalWithdrawn,
          currency: w.currency,
          transactionCount: w._count?.transactions || 0,
          updatedAt: w.updatedAt,
        })),
        labs.total,
        labs.page,
        labs.pageSize
      ),
    });
  } catch (error) {
    console.error('Admin lab earnings error:', error);
    return errorResponse('获取数据失败', 500);
  }
};

export const GET = withAuth(handler, ['SUPER_ADMIN', 'FINANCE_ADMIN']);
