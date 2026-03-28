/**
 * Reset Password with OTP API Route
 * POST /api/auth/reset-password-otp
 * Reset password using phone + OTP verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyOTP } from '@/lib/services/otp.service';
import { hashPassword } from '@/lib/auth';
import prisma from '@/lib/db';

const requestSchema = z.object({
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .or(z.string().regex(/^1[3-9]\d{9}$/, 'Invalid phone number')),
  code: z.string().length(6, 'OTP code must be 6 digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
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

    const { phone, code, newPassword } = validation.data;
    
    // Normalize phone number
    const normalizedPhone = phone.startsWith('+') ? phone : `+86${phone}`;

    // Verify OTP
    const otpResult = await verifyOTP(normalizedPhone, code, 'reset');
    
    if (!otpResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: otpResult.error
        },
        { status: 400 }
      );
    }

    // Find user by phone
    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone }
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found'
        },
        { status: 404 }
      );
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    // Invalidate all existing sessions for security
    await prisma.session.deleteMany({
      where: { userId: user.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset password'
      },
      { status: 500 }
    );
  }
}
