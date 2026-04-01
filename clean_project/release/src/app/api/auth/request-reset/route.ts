import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { requestResetSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { randomBytes } from 'crypto';
import { sendEmail } from '@/lib/email';
import { passwordResetEmail } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  const rlKey = getRateLimitKey(request, 'reset-request');
  const rl = rateLimit(rlKey, 3, 300_000); // 3 per 5 min
  if (!rl.ok) return errorResponse('请求过于频繁', 429);

  try {
    const body = await request.json();
    const data = requestResetSchema.parse(body);

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    
    if (user) {
      // Delete existing reset tokens for this user
      await prisma.session.deleteMany({
        where: { userId: user.id, userAgent: 'password-reset' },
      });

      // Create a reset token (stored as a session with special marker)
      const resetToken = randomBytes(32).toString('hex');
      await prisma.session.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
          userAgent: 'password-reset', // marker to distinguish from login sessions
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        },
      });

      // Send password reset email
      const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
      const emailContent = passwordResetEmail({ name: user.name, resetUrl });
      
      await sendEmail({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });
    }

    return successResponse({ message: '如果该邮箱已注册，重置邮件已发送' });
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse(error.issues[0]?.message || '参数无效', 400);
    return errorResponse('请求失败', 500);
  }
}
