/**
 * Admin Authorization Helper
 * Checks if user has admin permissions
 */

import { getCurrentUser } from './auth';
import { NextResponse } from 'next/server';

export async function requireAdmin() {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Check if user has admin role
  const adminRoles = ['SUPER_ADMIN', 'FINANCE_ADMIN'];
  
  if (!adminRoles.includes(user.role)) {
    return NextResponse.json(
      { success: false, error: 'Forbidden - Admin access required' },
      { status: 403 }
    );
  }

  return { user };
}
