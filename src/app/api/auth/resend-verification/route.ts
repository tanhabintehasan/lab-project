import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { createOTP } from '@/lib/services/otp.service';
import { sendEmail } from '@/lib/email';
import { verificationEmail } from '@/lib/email-templates';

export const runtime = 'nodejs';

const requestSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = requestSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      return successResponse({ message: '如果该邮箱已注册，验证邮件已发送' });
    }

    if (user.status === 'ACTIVE' && user.emailVerified) {
      return errorResponse('该邮箱已完成验证，请直接登录', 400);
    }

    const otpResult = await createOTP(data.email, 'verify');
    if (!otpResult.success) {
      return errorResponse(otpResult.error || '发送失败，请稍后再试', 429);
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const verifyUrl = `${siteUrl}/auth/verify-email?email=${encodeURIComponent(data.email)}`;
    const emailContent = verificationEmail({
      name: user.name,
      code: otpResult.otp!,
      verifyUrl,
    });

    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });
    }

    return successResponse({ message: '验证邮件已发送，请查收' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '参数无效', 400);
    }
    console.error('Resend verification error:', error);
    return errorResponse('发送失败，请稍后重试', 500);
  }
}
