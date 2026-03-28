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

const requestSchema = z.object({
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .or(z.string().regex(/^1[3-9]\d{9}$/, 'Invalid phone number')),
  code: z.string().length(6, 'OTP code must be 6 digits')
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
    
    // Normalize phone number
    const normalizedPhone = phone.startsWith('+') ? phone : `+86${phone}`;

    // Verify OTP
    const otpResult = await verifyOTP(normalizedPhone, code, 'login');
    
    if (!otpResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: otpResult.error
        },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { phone: normalizedPhone }
    });

    if (!user) {
      // Create new user with phone login
      user = await prisma.user.create({
        data: {
          phone: normalizedPhone,
          email: `${normalizedPhone}@phone.placeholder`, // Temporary email
          passwordHash: '', // No password for phone-only accounts
          name: `User ${normalizedPhone.slice(-4)}`,
          role: 'CUSTOMER',
          status: 'ACTIVE',
          phoneVerified: true
        }
      });
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
      email: user.email,
      role: user.role,
      sessionId
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
      maxAge: 7 * 24 * 60 * 60 // 7 days
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
