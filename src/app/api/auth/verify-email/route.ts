import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { verifyOTP } from '@/lib/services/otp.service';
import { createToken, buildSessionCookie } from '@/lib/auth';

const requestSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, '验证码为6位数字'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = requestSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      return errorResponse('用户不存在', 404);
    }

    if (user.status === 'ACTIVE' && user.emailVerified) {
      // Already verified - create session and log them in
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
        avatar: user.avatar || undefined,
        locale: user.locale || undefined,
      });

      await prisma.session.update({ where: { id: session.id }, data: { token } });

      const response = successResponse({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          locale: user.locale,
          status: user.status,
        },
        message: '邮箱已验证',
      });
      response.headers.set('Set-Cookie', buildSessionCookie(token));
      return response;
    }

    const otpResult = await verifyOTP(data.email, data.code, 'verify');

    if (!otpResult.success) {
      return errorResponse(otpResult.error || '验证码无效或已过期', 400);
    }

    // Activate user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'ACTIVE',
        emailVerified: true,
      },
    });

    // Create session
    const session = await prisma.session.create({
      data: {
        userId: updatedUser.id,
        token: '',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    const token = await createToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      sessionId: session.id,
      name: updatedUser.name || updatedUser.email,
      avatar: updatedUser.avatar || undefined,
      locale: updatedUser.locale || undefined,
    });

    await prisma.session.update({ where: { id: session.id }, data: { token } });

    await prisma.auditLog.create({
      data: {
        userId: updatedUser.id,
        action: 'EMAIL_VERIFIED',
        entity: 'User',
        entityId: updatedUser.id,
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
      },
    });

    const response = successResponse({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        locale: updatedUser.locale,
        status: updatedUser.status,
      },
      message: '邮箱验证成功',
    });

    response.headers.set('Set-Cookie', buildSessionCookie(token));
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '参数无效', 400);
    }
    console.error('Verify email error:', error);
    return errorResponse('验证失败，请稍后重试', 500);
  }
}
