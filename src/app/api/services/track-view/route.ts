/**
 * POST /api/services/track-view
 *
 * Records a user's category browse event for recommendation engine.
 * Body: { categoryId: string, serviceId?: string, sourcePage?: string }
 *
 * Lightweight fire-and-forget endpoint. Returns 202 immediately.
 */

import { NextRequest } from 'next/server';
import { getAuthUser, successResponse, errorResponse } from '@/lib/api-helpers';
import { invalidateUserRecommendations } from '@/lib/recommendation-engine';
import { z } from 'zod';

export const runtime = 'nodejs';

const trackSchema = z.object({
  categoryId: z.string().min(1),
  serviceId: z.string().optional(),
  sourcePage: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return errorResponse('需要登录才能记录浏览', 401);
    }

    const body = await request.json();
    const data = trackSchema.parse(body);

    // Fire-and-forget write + cache invalidation (non-blocking)
    Promise.resolve().then(async () => {
      try {
        const { prisma } = await import('@/lib/db');
        await (prisma as any).userBrowseLog.create({
          data: {
            userId: user.userId,
            categoryId: data.categoryId,
            serviceId: data.serviceId || null,
            sourcePage: data.sourcePage || null,
          },
        });
        invalidateUserRecommendations(user.userId);
      } catch (err) {
        console.error('[TrackView] Failed to log browse:', err);
      }
    });

    return successResponse({ tracked: true }, 202);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return errorResponse(err.issues[0]?.message || '参数无效', 400);
    }
    console.error('[TrackView] Error:', err);
    return errorResponse('记录失败', 500);
  }
}
