/**
 * OTP Service
 * Generates, stores, and verifies OTP codes
 */

import * as crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { checkRateLimit } from './rate-limit.service';

const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 3;
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute

/**
 * Generate 6-digit OTP code
 */
export function generateOTP(): string {
  const buffer = crypto.randomBytes(3);
  const number = parseInt(buffer.toString('hex'), 16);
  const otp = (number % 1000000).toString().padStart(6, '0');
  return otp;
}

/**
 * Hash OTP for storage
 */
async function hashOTP(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

/**
 * Verify OTP against hash
 */
async function verifyOTPHash(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

/**
 * Create and store OTP
 * @param identifier Phone number or email
 * @param type 'login', 'reset', 'verify'
 * @returns OTP code (plain text - only returned here, never stored)
 */
export async function createOTP(
  identifier: string,
  type: 'login' | 'reset' | 'verify'
): Promise<{ success: boolean; otp?: string; error?: string; retryAfter?: number }> {
  try {
    // Rate limit: 3 OTP requests per 15 minutes per identifier
    const rateLimitKey = `otp:${type}:${identifier}`;
    const rateLimit = await checkRateLimit(rateLimitKey, 3, 15 * 60 * 1000);
    
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: 'Too many OTP requests. Please try again later.',
        retryAfter: rateLimit.retryAfter
      };
    }

    // Check for recent OTP (resend cooldown)
    const recentOTP = await prisma.oTPCode.findFirst({
      where: {
        identifier,
        type,
        createdAt: {
          gt: new Date(Date.now() - RESEND_COOLDOWN_MS)
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (recentOTP && !recentOTP.verifiedAt) {
      const cooldownRemaining = Math.ceil(
        (recentOTP.createdAt.getTime() + RESEND_COOLDOWN_MS - Date.now()) / 1000
      );
      
      if (cooldownRemaining > 0) {
        return {
          success: false,
          error: `Please wait ${cooldownRemaining} seconds before requesting a new code.`,
          retryAfter: cooldownRemaining
        };
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const codeHash = await hashOTP(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    // Invalidate previous OTPs for this identifier + type
    await prisma.oTPCode.updateMany({
      where: {
        identifier,
        type,
        verifiedAt: null
      },
      data: {
        verifiedAt: new Date() // Mark as used to prevent reuse
      }
    });

    // Store hashed OTP
    await prisma.oTPCode.create({
      data: {
        identifier,
        codeHash,
        type,
        expiresAt,
        attemptCount: 0
      }
    });

    return {
      success: true,
      otp // Return plain OTP only here (for sending via SMS)
    };
  } catch (error) {
    console.error('Create OTP error:', error);
    return {
      success: false,
      error: 'Failed to generate OTP code'
    };
  }
}

/**
 * Verify OTP code
 * @param identifier Phone number or email
 * @param code OTP code to verify
 * @param type 'login', 'reset', 'verify'
 * @returns Success status and error message if failed
 */
export async function verifyOTP(
  identifier: string,
  code: string,
  type: 'login' | 'reset' | 'verify'
): Promise<{ success: boolean; error?: string; otpId?: string }> {
  try {
    // Rate limit: 5 verification attempts per 15 minutes per identifier
    const rateLimitKey = `otp:verify:${identifier}`;
    const rateLimit = await checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
    
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: 'Too many verification attempts. Please try again later.'
      };
    }

    // Find active OTP
    const otpRecord = await prisma.oTPCode.findFirst({
      where: {
        identifier,
        type,
        verifiedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!otpRecord) {
      return {
        success: false,
        error: 'Invalid or expired OTP code'
      };
    }

    // Check max attempts
    if (otpRecord.attemptCount >= MAX_ATTEMPTS) {
      return {
        success: false,
        error: 'Maximum verification attempts exceeded. Please request a new code.'
      };
    }

    // Verify OTP
    const isValid = await verifyOTPHash(code, otpRecord.codeHash);

    if (isValid) {
      // Mark as verified
      await prisma.oTPCode.update({
        where: { id: otpRecord.id },
        data: {
          verifiedAt: new Date(),
          attemptCount: { increment: 1 }
        }
      });

      return {
        success: true,
        otpId: otpRecord.id
      };
    } else {
      // Increment attempt count
      await prisma.oTPCode.update({
        where: { id: otpRecord.id },
        data: {
          attemptCount: { increment: 1 }
        }
      });

      const remainingAttempts = MAX_ATTEMPTS - (otpRecord.attemptCount + 1);
      
      return {
        success: false,
        error: remainingAttempts > 0
          ? `Invalid OTP code. ${remainingAttempts} attempt(s) remaining.`
          : 'Invalid OTP code. Maximum attempts exceeded.'
      };
    }
  } catch (error) {
    console.error('Verify OTP error:', error);
    return {
      success: false,
      error: 'Failed to verify OTP code'
    };
  }
}

/**
 * Clean up expired OTP codes (run periodically)
 */
export async function cleanupExpiredOTPs(): Promise<number> {
  const result = await prisma.oTPCode.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Delete OTPs older than 24 hours
      }
    }
  });

  return result.count;
}
