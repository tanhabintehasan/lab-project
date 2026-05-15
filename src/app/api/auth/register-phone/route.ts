/**
 * Phone Registration API Route
 * POST /api/auth/register-phone
 * Register with phone number + OTP + name
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyOTP } from '@/lib/services/otp.service';
import { createToken, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { normalizePhoneStrict } from '@/lib/phone-utils';

export const runtime = 'nodejs';

const requestSchema = z.object({
  phone: z.string().min(1, '请输入手机号'),
  code: z.string().length(6, '验证码必须是6位数字'),
  name: z.string().min(1, '请输入姓名').max(100),
  password: z.string().min(8, '密码至少8位').optional().or(z.literal('')),
  companyName: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const { phone, code, name, password, companyName } = validation.data;

    // Normalize phone to E.164
    const normalizedPhone = normalizePhoneStrict(phone);
    if (!normalizedPhone) {
      console.error('[register-phone] Invalid phone format:', phone);
      return NextResponse.json({ success: false, error: '手机号格式无效' }, { status: 400 });
    }

    console.log('[register-phone] Registration attempt for:', normalizedPhone);

    // Verify OTP
    const otpResult = await verifyOTP(normalizedPhone, code, 'verify');
    if (!otpResult.success) {
      console.warn('[register-phone] OTP verification failed:', otpResult.error);
      return NextResponse.json({ success: false, error: otpResult.error }, { status: 400 });
    }

    // Check if phone already registered
    const existing = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
    if (existing) {
      console.warn('[register-phone] Phone already registered:', normalizedPhone);
      return NextResponse.json({ success: false, error: '该手机号已注册' }, { status: 409 });
    }

    // Hash password if provided
    const passwordHash = password ? await hashPassword(password) : '';

    // Create user, wallet, and company in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          phone: normalizedPhone,
          passwordHash,
          name,
          role: 'CUSTOMER',
          status: 'ACTIVE',
          phoneVerified: true,
        },
      });

      await tx.wallet.create({ data: { userId: user.id } });

      if (companyName) {
        const company = await tx.company.create({
          data: {
            name: companyName,
            contactPerson: name,
            contactPhone: normalizedPhone,
          },
        });

        await tx.companyMembership.create({
          data: { userId: user.id, companyId: company.id, role: 'owner' },
        });

        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: { role: 'ENTERPRISE_MEMBER' },
        });

        return updatedUser;
      }

      return user;
    });

    const user = result;
    console.log('[register-phone] Created user:', user.id, 'role:', user.role);

    // Create session
    const sessionId = uuidv4();
    const token = await createToken({
      userId: user.id,
      email: user.email || '',
      role: user.role,
      sessionId,
      name: user.name,
      avatar: user.avatar || undefined,
      locale: user.locale || undefined,
      phone: user.phone || undefined,
    });

    const clientIp = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: clientIp,
        userAgent
      }
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'REGISTER_PHONE',
        entity: 'User',
        entityId: user.id,
        ipAddress: clientIp,
      },
    });

    console.log('[register-phone] Registration successful for user:', user.id);

    return NextResponse.json({
      success: true,
      message: '注册成功',
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        locale: user.locale,
      },
      // token intentionally omitted — httpOnly cookie only
    });
  } catch (error) {
    console.error('Phone registration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '注册失败，请稍后重试'
      },
      { status: 500 }
    );
  }
}
