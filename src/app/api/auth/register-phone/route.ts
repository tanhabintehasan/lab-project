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

const requestSchema = z.object({
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .or(z.string().regex(/^1[3-9]\d{9}$/, 'Invalid phone number')),
  code: z.string().length(6, 'OTP code must be 6 digits'),
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

    // Normalize phone number
    const normalizedPhone = phone.startsWith('+') ? phone : `+86${phone}`;

    // Verify OTP
    const otpResult = await verifyOTP(normalizedPhone, code, 'verify');

    if (!otpResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: otpResult.error
        },
        { status: 400 }
      );
    }

    // Check if phone already registered
    const existing = await prisma.user.findUnique({
      where: { phone: normalizedPhone }
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: '该手机号已注册'
        },
        { status: 409 }
      );
    }

    // Hash password if provided
    const passwordHash = password ? await hashPassword(password) : '';

    // Create user
    const user = await prisma.user.create({
      data: {
        phone: normalizedPhone,
        passwordHash,
        name,
        role: 'CUSTOMER',
        status: 'ACTIVE',
        phoneVerified: true,
      },
    });

    // Create wallet
    await prisma.wallet.create({ data: { userId: user.id } });

    // Create company if provided
    if (companyName) {
      const company = await prisma.company.create({
        data: {
          name: companyName,
          contactPerson: name,
          contactPhone: normalizedPhone,
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

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'REGISTER_PHONE',
        entity: 'User',
        entityId: user.id,
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({
      success: true,
      message: '注册成功',
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role
      },
      token
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
