
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    let wallet = await prisma.wallet.findUnique({ where: { userId: user.userId } });
    if (!wallet) {
      wallet = await prisma.wallet.create({ data: { userId: user.userId } });
    }
    return successResponse(wallet);
  } catch {
    return errorResponse('获取失败', 500);
  }
}
