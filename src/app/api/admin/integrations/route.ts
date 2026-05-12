/**
 * Admin Integration Settings API
 * GET /api/admin/integrations - List all integrations
 * POST /api/admin/integrations - Create new integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import {
  getAllIntegrationSettings,
  createIntegrationSetting
} from '@/lib/services/integration-config.service';
import { IntegrationType, ProviderMode } from '@prisma/client';
import { z } from 'zod';

// Validation schema
const createIntegrationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.nativeEnum(IntegrationType),
  provider: z.string().min(1, 'Provider is required'),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  accessKey: z.string().optional(),
  accessSecret: z.string().optional(),
  endpoint: z.string().optional(),
  region: z.string().optional(),
  bucket: z.string().optional(),
  config: z.record(z.unknown()).optional(),
  isEnabled: z.boolean().default(false),
  isDefault: z.boolean().default(false),
  mode: z.nativeEnum(ProviderMode)
});

/**
 * GET - List all integration settings
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAdmin();
    if (authCheck instanceof NextResponse) {
      return authCheck;
    }

    // Optional type filter
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const integrations = await getAllIntegrationSettings();

    // Filter by type if provided
    const filtered = type
      ? integrations.filter(i => i.type === type)
      : integrations;

    return NextResponse.json({
      success: true,
      data: filtered
    });
  } catch (error) {
    console.error('Get integrations error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch integrations'
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new integration setting
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdmin();
    if (authCheck instanceof NextResponse) {
      return authCheck;
    }

    const body = await request.json();

    // Validate request body
    const validation = createIntegrationSchema.safeParse(body);
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

    const integration = await createIntegrationSetting(
      validation.data,
      authCheck.user.userId
    );

    return NextResponse.json(
      {
        success: true,
        data: integration,
        message: 'Integration setting created successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create integration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create integration'
      },
      { status: 500 }
    );
  }
}
