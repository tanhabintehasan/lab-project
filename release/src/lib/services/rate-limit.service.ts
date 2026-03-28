/**
 * Rate Limiting Service
 * Database-backed rate limiting using RateLimitEntry table
 */

import prisma from '@/lib/db';

/**
 * Check rate limit for a key
 * @param key Unique identifier (e.g., 'otp:+8613800138000', 'login:192.168.1.1')
 * @param limit Maximum number of attempts
 * @param windowMs Time window in milliseconds
 * @returns true if within limit, false if exceeded
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = new Date();
  
  try {
    // Find existing entry
    const entry = await prisma.rateLimitEntry.findUnique({
      where: { key }
    });

    // Check if blocked
    if (entry?.blockedUntil && entry.blockedUntil > now) {
      const retryAfter = Math.ceil((entry.blockedUntil.getTime() - now.getTime()) / 1000);
      return { allowed: false, retryAfter };
    }

    // Check if within window and under limit
    if (entry && entry.resetAt > now) {
      if (entry.count >= limit) {
        // Block for exponential backoff (2x the window)
        const blockedUntil = new Date(now.getTime() + windowMs * 2);
        
        await prisma.rateLimitEntry.update({
          where: { key },
          data: {
            blockedUntil,
            updatedAt: now
          }
        });

        return { allowed: false, retryAfter: Math.ceil((windowMs * 2) / 1000) };
      }

      // Increment count
      await prisma.rateLimitEntry.update({
        where: { key },
        data: {
          count: { increment: 1 },
          updatedAt: now
        }
      });

      return { allowed: true };
    } else {
      // Create or reset entry
      await prisma.rateLimitEntry.upsert({
        where: { key },
        create: {
          key,
          count: 1,
          resetAt: new Date(now.getTime() + windowMs),
          updatedAt: now
        },
        update: {
          count: 1,
          resetAt: new Date(now.getTime() + windowMs),
          blockedUntil: null,
          updatedAt: now
        }
      });

      return { allowed: true };
    }
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open (allow request) on error
    return { allowed: true };
  }
}

/**
 * Reset rate limit for a key
 */
export async function resetRateLimit(key: string): Promise<void> {
  try {
    await prisma.rateLimitEntry.delete({
      where: { key }
    });
  } catch (error) {
    // Ignore if entry doesn't exist
  }
}

/**
 * Clean up expired rate limit entries (optional - run periodically)
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
  const now = new Date();
  
  const result = await prisma.rateLimitEntry.deleteMany({
    where: {
      AND: [
        { resetAt: { lt: now } },
        { OR: [
          { blockedUntil: null },
          { blockedUntil: { lt: now } }
        ]}
      ]
    }
  });

  return result.count;
}
