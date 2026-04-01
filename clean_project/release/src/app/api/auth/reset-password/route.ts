import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { resetPasswordSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const rlKey = getRateLimitKey(request, 'reset-execute');
  const rl = rateLimit(rlKey, 5, 300_000);
  if (!rl.ok) return errorResponse('请求过于频繁', 429);

  try {
    const body = await request.json();
    const data = resetPasswordSchema.parse(body);

    // Find the reset session
    const session = await prisma.session.findFirst({
      where: {
        token: data.token,
        userAgent: 'password-reset',
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      return errorResponse('重置链接无效或已过期', 400);
    }

    // Hash new password and update
    const hash = await hashPassword(data.password);
    await prisma.user.update({
      where: { id: session.userId },
      data: { passwordHash: hash },
    });

    // Delete the reset token (one-time use)
    await prisma.session.delete({ where: { id: session.id } });

    // Also invalidate all login sessions for security
    await prisma.session.deleteMany({
      where: { userId: session.userId, userAgent: { not: 'password-reset' } },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'PASSWORD_RESET',
        entity: 'User',
        entityId: session.userId,
      },
    });

    return successResponse({ message: '密码已重置，请重新登录' });
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse(error.issues[0]?.message || '参数无效', 400);
    return errorResponse('重置失败', 500);
  }
}
