import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);
  const { id } = await params;

  try {
    const report = await prisma.report.findFirst({
      where: { id, order: { userId: user.userId } },
      include: {
        order: { select: { orderNo: true, id: true, userId: true } },
        attachments: true,
      },
    });
    if (!report) return errorResponse('报告不存在', 404);
    return successResponse(report);
  } catch {
    return errorResponse('获取失败', 500);
  }
}
