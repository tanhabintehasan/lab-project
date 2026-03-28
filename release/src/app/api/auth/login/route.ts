import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { verifyPassword, createToken, buildSessionCookie } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { loginSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const rlKey = getRateLimitKey(request, 'login');
  const rl = rateLimit(rlKey, 10, 60_000);

  if (!rl.ok) {
    return errorResponse('请求过于频繁，请稍后再试', 429);
  }

  try {
    const body = await request.json();
    const data = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { company: { include: { company: true } } },
    });

    if (!user) {
      return errorResponse('邮箱或密码错误', 401);
    }

    if (user.status !== 'ACTIVE') {
      return errorResponse('账户已被禁用，请联系管理员', 403);
    }

    const validPassword = await verifyPassword(data.password, user.passwordHash);

    if (!validPassword) {
      return errorResponse('邮箱或密码错误', 401);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: '',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
      name: user.name || user.email,
    });

    await prisma.session.update({
      where: { id: session.id },
      data: { token },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
      },
    });

    const response = successResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.email,
        role: user.role,
        avatar: user.avatar,
        locale: user.locale,
        company: user.company?.company,
      },
    });

    response.headers.set('Set-Cookie', buildSessionCookie(token));
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '请求参数无效', 400);
    }

    console.error('Login error:', error);
    return errorResponse('登录失败，请稍后重试', 500);
  }
}
