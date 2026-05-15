/**
 * Phone Login API Route
 * POST /api/auth/login-phone
 * Login with phone number + OTP
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyOTP } from '@/lib/services/otp.service';
import { createToken } from '@/lib/auth';
import prisma from '@/lib/db';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { normalizePhoneStrict } from '@/lib/phone-utils';

export const runtime = 'nodejs';

const requestSchema = z.object({
  phone: z.string().min(1, '请输入手机号'),
  code: z.string().length(6, '验证码必须是6位数字')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
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

    const { phone, code } = validation.data;

    // Normalize phone to E.164
    const normalizedPhone = normalizePhoneStrict(phone);
    if (!normalizedPhone) {
      console.error('[login-phone] Invalid phone format:', phone);
      return NextResponse.json({ success: false, error: '手机号格式无效' }, { status: 400 });
    }

    console.log('[login-phone] OTP login attempt for:', normalizedPhone);

    // Verify OTP
    const otpResult = await verifyOTP(normalizedPhone, code, 'login');

    if (!otpResult.success) {
      console.warn('[login-phone] OTP verification failed:', otpResult.error);
      return NextResponse.json(
        { success: false, error: otpResult.error },
        { status: 400 }
      );
    }

    // Find user by normalized phone ONLY
    let user = await prisma.user.findUnique({
      where: { phone: normalizedPhone }
    });

    if (user && (user.status === 'INACTIVE' || user.status === 'SUSPENDED' || user.status === 'PENDING_VERIFICATION')) {
      console.warn('[login-phone] Blocked login — account status:', user.status, 'user:', user.id);
      return NextResponse.json(
        { success: false, error: '账户已被禁用或尚未激活' },
        { status: 403 }
      );
    }

    if (!user) {
      console.log('[login-phone] Creating new user for phone:', normalizedPhone);
      // Create new user with phone login
      user = await prisma.user.create({
        data: {
          phone: normalizedPhone,
          passwordHash: '', // No password for phone-only accounts
          name: `User ${normalizedPhone.slice(-4)}`,
          role: 'CUSTOMER',
          status: 'ACTIVE',
          phoneVerified: true
        }
      });

      // Create wallet for new phone-login users
      await prisma.wallet.create({ data: { userId: user.id } });
      console.log('[login-phone] Created user and wallet:', user.id);
    } else {
      // Update phone verification status
      if (!user.phoneVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data: { phoneVerified: true }
        });
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });
    }

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

    // Store session in database
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
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
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    console.log('[login-phone] Login successful for user:', user.id);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
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
    console.error('Phone login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Login failed'
      },
      { status: 500 }
    );
  }
}
