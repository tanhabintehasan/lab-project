/**
 * CSRF Middleware
 * Validates CSRF tokens for state-changing requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { validateCSRFToken } from '@/lib/services/csrf.service';

/**
 * Validate CSRF token from request
 * Call this at the start of POST/PUT/DELETE handlers for sensitive routes
 */
export async function validateCSRF(request: NextRequest): Promise<NextResponse | null> {
  try {
    // Get current user
    const user = await getCurrentUser();
    
    if (!user || !user.sessionId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get CSRF token from header
    const csrfToken = request.headers.get('x-csrf-token');
    
    if (!csrfToken) {
      return NextResponse.json(
        { success: false, error: 'CSRF token required' },
        { status: 403 }
      );
    }

    // Validate token
    const isValid = await validateCSRFToken(user.sessionId, csrfToken);
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    // Token is valid, allow request to proceed
    return null;
  } catch (error) {
    console.error('CSRF validation error:', error);
    return NextResponse.json(
      { success: false, error: 'CSRF validation failed' },
      { status: 500 }
    );
  }
}
