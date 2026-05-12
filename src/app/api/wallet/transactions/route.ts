import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, getAuthUser, getPaginationParams, paginatedResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    const { page, pageSize, skip } = getPaginationParams(request);
    const wallet = await prisma.wallet.findUnique({ where: { userId: user.userId } });
    if (!wallet) return paginatedResponse([], 0, page, pageSize);

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.transaction.count({ where: { walletId: wallet.id } }),
    ]);

    return paginatedResponse(transactions, total, page, pageSize);
  } catch {
    return errorResponse('获取失败', 500);
  }
}
