import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const settings = await prisma.siteSetting.findFirst({
      orderBy: { createdAt: 'asc' },
    });
    // Always return a safe object so the frontend never crashes on null
    return successResponse(settings || {});
  } catch (err: any) {
    console.error('GET /api/site-settings error:', err?.message || err);
    return errorResponse('获取失败', 500);
  }
}
