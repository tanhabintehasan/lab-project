/**
 * Admin Payment Provider Detail API
 * GET /api/admin/payment-providers/[id] - Get provider details
 * PUT /api/admin/payment-providers/[id] - Update provider
 * DELETE /api/admin/payment-providers/[id] - Delete provider
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import {
  getPaymentProviderById,
  updatePaymentProvider,
  deletePaymentProvider
} from '@/lib/services/payment-config.service';
import { PaymentProviderType, ProviderMode } from '@prisma/client';
import { z } from 'zod';

// Validation schema
const updateProviderSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.nativeEnum(PaymentProviderType).optional(),
  appId: z.string().optional(),
  merchantId: z.string().optional(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  privateKey: z.string().optional(),
  publicKey: z.string().optional(),
  certSerialNo: z.string().optional(),
  notifyUrl: z.string().url().optional(),
  mode: z.nativeEnum(ProviderMode).optional(),
  isEnabled: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  config: z.record(z.unknown()).optional()
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET - Get provider by ID
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
    const provider = await getPaymentProviderById(id);

    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'Provider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: provider
    });
  } catch (error) {
    console.error('Get payment provider error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch provider'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update provider
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
    const validation = updateProviderSchema.safeParse(body);
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

    const provider = await updatePaymentProvider(
      id,
      validation.data,
      authCheck.user.userId
    );

    return NextResponse.json({
      success: true,
      data: provider,
      message: 'Payment provider updated successfully'
    });
  } catch (error) {
    console.error('Update payment provider error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update provider'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete provider
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
    await deletePaymentProvider(id);

    return NextResponse.json({
      success: true,
      message: 'Payment provider deleted successfully'
    });
  } catch (error) {
    console.error('Delete payment provider error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete provider'
      },
      { status: 500 }
    );
  }
}
