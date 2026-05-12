/**
 * Admin Integration Detail API
 * GET /api/admin/integrations/[id] - Get integration details
 * PUT /api/admin/integrations/[id] - Update integration
 * DELETE /api/admin/integrations/[id] - Delete integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import {
  getIntegrationById,
  updateIntegrationSetting,
  deleteIntegrationSetting
} from '@/lib/services/integration-config.service';
import { IntegrationType, ProviderMode } from '@prisma/client';
import { z } from 'zod';

// Validation schema
const updateIntegrationSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.nativeEnum(IntegrationType).optional(),
  provider: z.string().min(1).optional(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  accessKey: z.string().optional(),
  accessSecret: z.string().optional(),
  endpoint: z.string().optional(),
  region: z.string().optional(),
  bucket: z.string().optional(),
  config: z.record(z.unknown()).optional(),
  isEnabled: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  mode: z.nativeEnum(ProviderMode).optional()
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET - Get integration by ID
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authCheck = await requireAdmin();
    if (authCheck instanceof NextResponse) {
      return authCheck;
    }

    const { id } = await context.params;
    const integration = await getIntegrationById(id);

    if (!integration) {
      return NextResponse.json(
        { success: false, error: 'Integration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: integration
    });
  } catch (error) {
    console.error('Get integration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch integration'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update integration
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authCheck = await requireAdmin();
    if (authCheck instanceof NextResponse) {
      return authCheck;
    }

    const { id } = await context.params;
    const body = await request.json();

    // Validate request body
    const validation = updateIntegrationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const integration = await updateIntegrationSetting(
      id,
      validation.data,
      authCheck.user.userId
    );

    return NextResponse.json({
      success: true,
      data: integration,
      message: 'Integration setting updated successfully'
    });
  } catch (error) {
    console.error('Update integration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update integration'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete integration
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authCheck = await requireAdmin();
    if (authCheck instanceof NextResponse) {
      return authCheck;
    }

    const { id } = await context.params;
    await deleteIntegrationSetting(id);

    return NextResponse.json({
      success: true,
      message: 'Integration setting deleted successfully'
    });
  } catch (error) {
    console.error('Delete integration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete integration'
      },
      { status: 500 }
    );
  }
}
