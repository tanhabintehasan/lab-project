/**
 * Verify OTP API Route
 * POST /api/auth/verify-otp
 * Verifies OTP code (standalone verification)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyOTP } from '@/lib/services/otp.service';

const requestSchema = z.object({
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .or(z.string().regex(/^1[3-9]\d{9}$/, 'Invalid phone number')),
  code: z.string().length(6, 'OTP code must be 6 digits'),
  type: z.enum(['login', 'reset', 'verify']).default('verify')
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

    const { phone, code, type } = validation.data;
    
    // Normalize phone number
    const normalizedPhone = phone.startsWith('+') ? phone : `+86${phone}`;

    // Verify OTP
    const result = await verifyOTP(normalizedPhone, code, type);
    
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      otpId: result.otpId
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify OTP code'
      },
      { status: 500 }
    );
  }
}
