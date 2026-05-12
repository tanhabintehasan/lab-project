import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const rlKey = getRateLimitKey(request, 'report-verify');
  const rl = rateLimit(rlKey, 20, 60_000);
  if (!rl.ok) return errorResponse('请求过于频繁', 429);

  try {
    const url = new URL(request.url);
    const reportNo = url.searchParams.get('reportNo');
    if (!reportNo || reportNo.length > 50) return errorResponse('请输入报告编号', 400);

    const report = await prisma.report.findUnique({
      where: { reportNo },
      select: { id: true, reportNo: true, title: true, status: true, issuedAt: true, order: { select: { orderNo: true } } },
    });
    if (!report) return errorResponse('报告未找到', 404);
    return successResponse(report);
  } catch { return errorResponse('验证失败', 500); }
}
