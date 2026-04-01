import { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers';
import { rechargeSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { randomUUID } from 'crypto';

/**
 * Creates a pending recharge transaction (payment intent).
 * The wallet is NOT credited here. In production, a webhook from the
 * payment provider would call an internal endpoint to confirm/credit.
 * For now we simulate immediate confirmation for development.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  const rlKey = getRateLimitKey(request, `recharge:${user.userId}`);
  const rl = rateLimit(rlKey, 5, 60_000);
  if (!rl.ok) return errorResponse('请求过于频繁', 429);

  try {
    const body = await request.json();
    const data = rechargeSchema.parse(body);

    if (data.idempotencyKey) {
      const existing = await prisma.transaction.findFirst({
        where: { referenceId: data.idempotencyKey },
      });
      if (existing) return successResponse({ transaction: existing, status: 'duplicate' });
    }

    let wallet = await prisma.wallet.findUnique({ where: { userId: user.userId } });
    if (!wallet) {
      wallet = await prisma.wallet.create({ data: { userId: user.userId } });
    }

    const idempotencyKey = data.idempotencyKey || randomUUID();

    const transaction = await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'RECHARGE',
        amount: data.amount,
        description: `充值 ¥${data.amount}`,
        referenceType: 'payment_intent',
        referenceId: idempotencyKey,
      },
    });

    const newBalance = new Prisma.Decimal(wallet.balance).add(
      new Prisma.Decimal(data.amount)
    );

    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      }),
      prisma.transaction.update({
        where: { id: transaction.id },
        data: { balanceAfter: newBalance },
      }),
    ]);

    const updatedWallet = await prisma.wallet.findUnique({ where: { id: wallet.id } });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'WALLET_RECHARGE',
        entity: 'Wallet',
        entityId: wallet.id,
        details: { amount: data.amount, idempotencyKey },
      },
    });

    return successResponse({
      wallet: updatedWallet,
      transaction: { ...transaction, balanceAfter: newBalance },
      status: 'confirmed',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '参数无效', 400);
    }
    return errorResponse('充值失败', 500);
  }
}