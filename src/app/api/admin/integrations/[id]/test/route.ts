/**
 * Test Integration Connection
 * POST /api/admin/integrations/[id]/test
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { testIntegrationConnection } from '@/lib/services/integration-config.service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authCheck = await requireAdmin();
    if (authCheck instanceof NextResponse) {
      return authCheck;
    }

    const { id } = await context.params;
    const result = await testIntegrationConnection(id);

    return NextResponse.json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    console.error('Test integration error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      },
      { status: 500 }
    );
  }
}
