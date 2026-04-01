/**
 * CSRF Protection Service
 * Generates and validates CSRF tokens for state-changing operations
 */

import * as crypto from 'crypto';
import prisma from '@/lib/db';

const TOKEN_LENGTH = 32;
const TOKEN_EXPIRY_MS = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Generate CSRF token for session
 */
export async function generateCSRFToken(sessionId: string): Promise<string> {
  const token = crypto.randomBytes(TOKEN_LENGTH).toString('base64url');
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

  // Store token in database associated with session
  await prisma.session.updateMany({
    where: { id: sessionId },
    data: {
      csrfToken: token,
      csrfTokenExpiresAt: expiresAt
    }
  });

  return token;
}

/**
 * Validate CSRF token
 */
export async function validateCSRFToken(
  sessionId: string,
  token: string
): Promise<boolean> {
  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        csrfToken: true,
        csrfTokenExpiresAt: true
      }
    });

    if (!session || !session.csrfToken || !session.csrfTokenExpiresAt) {
      return false;
    }

    // Check expiry
    if (session.csrfTokenExpiresAt < new Date()) {
      return false;
    }

    // Constant-time comparison
    return crypto.timingSafeEqual(
      Buffer.from(session.csrfToken),
      Buffer.from(token)
    );
  } catch (error) {
    console.error('CSRF validation error:', error);
    return false;
  }
}

/**
 * Get CSRF token for current session
 */
export async function getCSRFToken(sessionId: string): Promise<string | null> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      csrfToken: true,
      csrfTokenExpiresAt: true
    }
  });

  if (
    !session ||
    !session.csrfToken ||
    !session.csrfTokenExpiresAt ||
    session.csrfTokenExpiresAt < new Date()
  ) {
    return null;
  }

  return session.csrfToken;
}
