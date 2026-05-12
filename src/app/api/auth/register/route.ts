import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { registerSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { createOTP } from '@/lib/services/otp.service';
import { sendEmail } from '@/lib/email';
import { verificationEmail } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  const rlKey = getRateLimitKey(request, 'register');
  const rl = rateLimit(rlKey, 5, 60_000);
  if (!rl.ok) return errorResponse('请求过于频繁，请稍后再试', 429);

  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return errorResponse('该邮箱已注册', 409);

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        phone: data.phone,
        locale: data.locale,
        role: 'CUSTOMER',
        status: 'PENDING_VERIFICATION',
      },
    });

    await prisma.wallet.create({ data: { userId: user.id } });

    if (data.companyName) {
      const company = await prisma.company.create({
        data: {
          name: data.companyName,
          contactPerson: data.name,
          contactEmail: data.email,
          contactPhone: data.phone,
        },
      });

      await prisma.companyMembership.create({
        data: { userId: user.id, companyId: company.id, role: 'owner' },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ENTERPRISE_MEMBER' },
      });
      user.role = 'ENTERPRISE_MEMBER';
    }

    // Generate and send verification OTP
    const otpResult = await createOTP(data.email, 'verify');
    if (otpResult.success && otpResult.otp) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const verifyUrl = `${siteUrl}/auth/verify-email?email=${encodeURIComponent(data.email)}`;
      const emailContent = verificationEmail({
        name: user.name,
        code: otpResult.otp,
        verifyUrl,
      });

      await sendEmail({
        to: user.email || data.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'REGISTER',
        entity: 'User',
        entityId: user.id,
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
      },
    });

    return successResponse(
      {
        user: {
          id: user.id,
          email: user.email || data.email,
          name: user.name,
          role: user.role,
          locale: user.locale,
          status: user.status,
        },
        message: '注册成功，请查收验证邮件完成邮箱验证',
      },
      201
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '请求参数无效', 400);
    }
    console.error('Registration error:', error);
    return errorResponse('注册失败，请稍后重试', 500);
  }
}
