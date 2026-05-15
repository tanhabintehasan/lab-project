/**
 * Admin Analytics API
 *
 * GET /api/admin/analytics
 *
 * Returns cached dashboard analytics data:
 * - Monthly revenue & order volume (last 12 months)
 * - Lab performance rankings
 * - Service popularity rankings
 * - Month-over-month summary stats
 *
 * Uses stale-while-revalidate caching to avoid blocking
 * the request thread with heavy aggregations.
 */

import { NextRequest } from 'next/server';
import { withAuth, successResponse, errorResponse } from '@/lib/api-helpers';
import { getDashboardAnalyticsCached } from '@/lib/analytics-cache';
import { JWTPayload } from '@/lib/auth';

export const runtime = 'nodejs';

const handler = async (_request: NextRequest, _user: JWTPayload) => {
  try {
    const data = await getDashboardAnalyticsCached();
    return successResponse(data);
  } catch (err: any) {
    console.error('[Analytics API] Failed to fetch analytics:', err);
    return errorResponse(err.message || '获取分析数据失败', 500);
  }
};

export const GET = withAuth(handler, ['SUPER_ADMIN', 'FINANCE_ADMIN']);
