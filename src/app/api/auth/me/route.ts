/**
 * Get Current User API Route
 * GET /api/auth/me
 * Returns current authenticated user (or null gracefully)
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: true,
          data: null,
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.userId,
          email: user.email,
          role: user.role,
          name: user.name || user.email,
          avatar: user.avatar,
          locale: user.locale,
          phone: user.phone,
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get user',
      },
      { status: 500 }
    );
  }
}
