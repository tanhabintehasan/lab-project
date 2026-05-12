/**
 * Send OTP API Route
 * POST /api/auth/send-otp
 * Sends OTP code via SMS
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createOTP } from '@/lib/services/otp.service';
import { sendOTPSMS } from '@/lib/services/sms.service';
import { checkRateLimit } from '@/lib/services/rate-limit.service';

const requestSchema = z.object({
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .or(z.string().regex(/^1[3-9]\d{9}$/, 'Invalid phone number')),
  type: z.enum(['login', 'reset', 'verify']).default('login')
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

    const { phone, type } = validation.data;
    
    // Normalize phone number
    const normalizedPhone = phone.startsWith('+') ? phone : `+86${phone}`;

    // Rate limit by IP (10 requests per hour)
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    const ipRateLimit = await checkRateLimit(
      `otp:ip:${clientIp}`,
      10,
      60 * 60 * 1000
    );

    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests from this IP address',
          retryAfter: ipRateLimit.retryAfter
        },
        { status: 429 }
      );
    }

    // Create OTP
    const otpResult = await createOTP(normalizedPhone, type);
    
    if (!otpResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: otpResult.error,
          retryAfter: otpResult.retryAfter
        },
        { status: 429 }
      );
    }

    // Send OTP via SMS
    const smsResult = await sendOTPSMS(normalizedPhone, otpResult.otp!);
    
    if (!smsResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: smsResult.error || 'Failed to send SMS'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP code sent successfully',
      expiresIn: 300 // 5 minutes
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send OTP code'
      },
      { status: 500 }
    );
  }
}
