import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    // Get user's company
    const membership = await prisma.companyMembership.findUnique({
      where: { userId: user.userId },
      include: { company: true },
    });

    if (!membership) return errorResponse('您不属于任何企业', 403);

    // Get or create company wallet
    let wallet = await prisma.companyWallet.findUnique({
      where: { companyId: membership.companyId },
    });

    if (!wallet) {
      wallet = await prisma.companyWallet.create({
        data: { companyId: membership.companyId },
      });
    }

    return successResponse({
      balance: Number(wallet.balance),
      frozenAmount: Number(wallet.frozenAmount),
      creditLimit: Number(wallet.creditLimit),
      currency: wallet.currency,
      companyName: membership.company.name,
    });
  } catch (error) {
    console.error('Company wallet fetch error:', error);
    return errorResponse('获取公司钱包失败', 500);
  }
}
