import { NextRequest } from 'next/server';
import { successResponse, errorResponse, withAuth, getPaginationParams, paginatedResponse } from '@/lib/api-helpers';
import { requireLabAccess } from '@/lib/lab-auth';
import { getLabTransactions } from '@/lib/financial-ledger';
import { JWTPayload } from '@/lib/auth';

const handler = async (request: NextRequest, user: JWTPayload) => {
  try {
    const { labId } = await requireLabAccess(user.userId);
    const { page, pageSize } = getPaginationParams(request);

    const result = await getLabTransactions(labId, { page, pageSize });

    return paginatedResponse(
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
    );
  } catch (error: any) {
    if (error?.status === 403) {
      return errorResponse(error.message, 403);
    }
    console.error('Lab transactions error:', error);
    return errorResponse('获取交易记录失败', 500);
  }
};

export const GET = withAuth(handler, ['LAB_PARTNER', 'LAB_MANAGER', 'TECHNICIAN']);
