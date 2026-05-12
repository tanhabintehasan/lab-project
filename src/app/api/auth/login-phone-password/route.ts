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

const requestSchema = z.object({
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .or(z.string().regex(/^1[3-9]\d{9}$/, 'Invalid phone number')),
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

    // Normalize phone number
    const normalizedPhone = phone.startsWith('+') ? phone : `+86${phone}`;

    // Find user by phone
    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone }
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: '手机号或密码错误'
        },
        { status: 401 }
      );
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          success: false,
          error: '账户已被禁用，请联系管理员'
        },
        { status: 403 }
      );
    }

    // Verify password
    if (!user.passwordHash) {
      return NextResponse.json(
        {
          success: false,
          error: '该账户未设置密码，请使用验证码登录'
        },
        { status: 401 }
      );
    }

    const validPassword = await verifyPassword(password, user.passwordHash);

    if (!validPassword) {
      return NextResponse.json(
        {
          success: false,
          error: '手机号或密码错误'
        },
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
      sessionId
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

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role
      },
      token
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
