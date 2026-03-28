import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, getAuthUser, getPaginationParams, paginatedResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    const { page, pageSize, skip } = getPaginationParams(request);
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || undefined;

    const where = {
      order: { userId: user.userId },
      ...(status ? { status: status as never } : {}),
    };

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          order: { select: { orderNo: true, id: true } },
          attachments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.report.count({ where }),
    ]);

    return paginatedResponse(reports, total, page, pageSize);
  } catch {
    return errorResponse('获取失败', 500);
  }
}
