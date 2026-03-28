/**
 * CSRF Token API Route
 * GET /api/auth/csrf-token
 * Returns CSRF token for current session
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { generateCSRFToken, getCSRFToken } from '@/lib/services/csrf.service';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.sessionId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get existing token or generate new one
    let token = await getCSRFToken(user.sessionId);
    
    if (!token) {
      token = await generateCSRFToken(user.sessionId);
    }

    return NextResponse.json({
      success: true,
      data: { token }
    });
  } catch (error) {
    console.error('Get CSRF token error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get CSRF token' },
      { status: 500 }
    );
  }
}
