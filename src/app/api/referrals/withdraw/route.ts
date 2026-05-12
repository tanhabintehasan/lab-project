import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers';
import { withdrawalSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);
  try {
    const body = await request.json();
    const data = withdrawalSchema.parse(body);
    const withdrawal = await prisma.withdrawalRequest.create({
      data: { userId: user.userId, amount: data.amount, method: data.method || 'bank_transfer', accountInfo: data.accountInfo || {}, status: 'pending' },
    });
    await prisma.auditLog.create({
      data: { userId: user.userId, action: 'WITHDRAWAL_REQUEST', entity: 'WithdrawalRequest', entityId: withdrawal.id },
    });
    return successResponse(withdrawal, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse(error.issues[0]?.message || '参数无效', 400);
    return errorResponse('申请失败', 500);
  }
}
