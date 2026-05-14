/**
 * GET /api/services/recommended
 *
 * Returns AI-powered service recommendations for the authenticated user.
 * Uses cached recommendation results with background refresh.
 *
 * Query params:
 *   limit: number (default 8, max 20)
 */

import { NextRequest } from 'next/server';
import { getAuthUser, successResponse, errorResponse } from '@/lib/api-helpers';
import { getRecommendationsForUser } from '@/lib/recommendation-engine';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return errorResponse('需要登录才能获取推荐', 401);
    }

    const url = new URL(request.url);
    const limit = Math.min(20, Math.max(1, parseInt(url.searchParams.get('limit') || '8', 10)));

    const recommendations = await getRecommendationsForUser(user.userId);
    const limited = recommendations.slice(0, limit);

    return successResponse({
      userId: user.userId,
      recommendations: limited,
      total: recommendations.length,
    });
  } catch (err: any) {
    console.error('[Recommended API] Error:', err);
    return errorResponse(err.message || '获取推荐失败', 500);
  }
}
