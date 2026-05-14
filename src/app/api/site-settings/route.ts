import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { getPublicSettings } from '@/lib/site-settings-cache';

/**
 * GET /api/site-settings
 *
 * Public-facing site settings endpoint.
 * Returns ONLY safe, non-sensitive fields suitable for frontend consumption.
 * Cached server-side with TTL to avoid repeated DB calls.
 *
 * Excluded fields: no API keys, SMTP creds, or any AppConfig values.
 */
export async function GET(request: NextRequest) {
  try {
    const settings = await getPublicSettings();
    return successResponse(settings);
  } catch (err: any) {
    console.error('GET /api/site-settings error:', err?.message || err);
    return errorResponse('获取失败', 500);
  }
}
