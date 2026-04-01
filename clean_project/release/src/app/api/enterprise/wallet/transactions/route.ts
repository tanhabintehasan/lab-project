import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, getAuthUser, getPaginationParams } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    // Get user's company
    const membership = await prisma.companyMembership.findUnique({
      where: { userId: user.userId },
    });

    if (!membership) return errorResponse('您不属于任何企业', 403);

    // Get company wallet
    const wallet = await prisma.companyWallet.findUnique({
      where: { companyId: membership.companyId },
    });

    if (!wallet) return successResponse({ data: [], total: 0, page: 1, pageSize: 20, totalPages: 0 });

    const { page, pageSize, skip } = getPaginationParams(request);

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { companyWalletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.transaction.count({ where: { companyWalletId: wallet.id } }),
    ]);

    const mapped = transactions.map(tx => ({
      id: tx.id,
      type: tx.type,
      amount: Number(tx.amount),
      balanceAfter: tx.balanceAfter ? Number(tx.balanceAfter) : null,
      description: tx.description,
      referenceType: tx.referenceType,
      referenceId: tx.referenceId,
      createdAt: tx.createdAt.toISOString(),
    }));

    return successResponse({
      data: mapped,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      total,
    });
  } catch (error) {
    console.error('Company transactions fetch error:', error);
    return errorResponse('获取交易记录失败', 500);
  }
}
