/**
 * Phone + Password Login API Route
 * POST /api/auth/login-phone-password
 * Login with phone number + password
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyPassword, createToken } from '@/lib/auth';
import prisma from '@/lib/db';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { normalizePhoneStrict } from '@/lib/phone-utils';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const requestSchema = z.object({
  phone: z.string().min(1, '请输入手机号'),
  password: z.string().min(1, '请输入密码'),
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

    const { phone, password } = validation.data;

    // Rate limit by IP + phone
    const rlKey = getRateLimitKey(request, 'login-pass:' + phone);
    const rl = rateLimit(rlKey, 5, 60_000);
    if (!rl.ok) {
      return NextResponse.json({ success: false, error: '请求过于频繁，请稍后再试' }, { status: 429 });
    }

    // Normalize phone to E.164
    const normalizedPhone = normalizePhoneStrict(phone);
    if (!normalizedPhone) {
      console.error('[login-phone-password] Invalid phone format:', phone);
      return NextResponse.json({ success: false, error: '手机号格式无效' }, { status: 400 });
    }

    console.log('[login-phone-password] Attempting login for phone:', normalizedPhone);

    // Find user by normalized phone ONLY (no dual fallback)
    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone }
    });

    if (!user) {
      console.error('[login-phone-password] User not found for phone:', normalizedPhone);
      return NextResponse.json(
        { success: false, error: '手机号或密码错误' },
        { status: 401 }
      );
    }

    console.log('[login-phone-password] Found user:', user.id, 'status:', user.status, 'phoneVerified:', user.phoneVerified);

    if (user.status === 'INACTIVE' || user.status === 'SUSPENDED') {
      console.warn('[login-phone-password] Blocked login — account status:', user.status, 'user:', user.id);
      return NextResponse.json(
        { success: false, error: '账户已被禁用，请联系管理员' },
        { status: 403 }
      );
    }

    if (user.status === 'PENDING_VERIFICATION') {
      console.warn('[login-phone-password] Blocked login — pending verification, user:', user.id);
      return NextResponse.json(
        { success: false, error: '账户尚未激活，请完成验证后再登录' },
        { status: 403 }
      );
    }

    if (!user.phoneVerified) {
      console.warn('[login-phone-password] Blocked login — phone not verified, user:', user.id);
      return NextResponse.json(
        { success: false, error: '请先验证手机号后再使用密码登录' },
        { status: 403 }
      );
    }

    // Verify password
    if (!user.passwordHash || user.passwordHash === '') {
      console.error('[login-phone-password] User has no password:', user.id);
      return NextResponse.json(
        { success: false, error: '该账户未设置密码，请使用验证码登录' },
        { status: 401 }
      );
    }

    console.log('[login-phone-password] Verifying password for user:', user.id);
    const validPassword = await verifyPassword(password, user.passwordHash);
    console.log('[login-phone-password] Password verification result:', validPassword);

    if (!validPassword) {
      console.error('[login-phone-password] Password mismatch for user:', user.id);
      return NextResponse.json(
        { success: false, error: '手机号或密码错误' },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

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

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
        ipAddress: clientIp,
      },
    });

    console.log('[login-phone-password] Login successful for user:', user.id);

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
      // token is intentionally omitted — httpOnly cookie is the only transport
    });
  } catch (error) {
    console.error('Phone password login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '登录失败，请稍后重试'
      },
      { status: 500 }
    );
  }
}
