import { NextRequest } from 'next/server';
import {
  successResponse,
  errorResponse,
  withAuth,
  getPaginationParams,
  paginatedResponse,
} from '@/lib/api-helpers';
import { getLabTransactions, getLabWalletSummary } from '@/lib/financial-ledger';
import { JWTPayload } from '@/lib/auth';

export const runtime = 'nodejs';

const handler = async (request: NextRequest, _user: JWTPayload) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const labId = pathParts[pathParts.length - 3]; // labId is before 'transactions'

    if (!labId) {
      return errorResponse('缺少实验室ID', 400);
    }

    const { page, pageSize } = getPaginationParams(request);

    const [summary, result] = await Promise.all([
      getLabWalletSummary(labId),
      getLabTransactions(labId, { page, pageSize }),
    ]);

    return successResponse({
      summary: summary
        ? {
            balance: summary.balance.toNumber(),
            frozenAmount: summary.frozenAmount.toNumber(),
            availableBalance: summary.availableBalance.toNumber(),
            totalEarned: summary.totalEarned.toNumber(),
            totalWithdrawn: summary.totalWithdrawn.toNumber(),
            currency: summary.currency,
          }
        : null,
      transactions: paginatedResponse(
        result.transactions.map((tx: any) => ({
          id: tx.id,
          type: tx.type,
          amount: tx.amount?.toString ? tx.amount.toString() : tx.amount,
          balanceAfter: tx.balanceAfter?.toString ? tx.balanceAfter.toString() : tx.balanceAfter,
          description: tx.description,
          referenceType: tx.referenceType,
          referenceId: tx.referenceId,
          grossAmount: tx.grossAmount?.toString ? tx.grossAmount.toString() : tx.grossAmount,
          platformFee: tx.platformFee?.toString ? tx.platformFee.toString() : tx.platformFee,
          netAmount: tx.netAmount?.toString ? tx.netAmount.toString() : tx.netAmount,
          feeRate: tx.feeRate?.toString ? tx.feeRate.toString() : tx.feeRate,
          createdAt: tx.createdAt,
        })),
        result.total,
        result.page,
        result.pageSize
      ),
    });
  } catch (error) {
    console.error('Admin lab transactions error:', error);
    return errorResponse('获取数据失败', 500);
  }
};

export const GET = withAuth(handler, ['SUPER_ADMIN', 'FINANCE_ADMIN']);
