import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);
  const { id } = await params;

  try {
    const notification = await prisma.notification.findFirst({ where: { id, userId: user.userId } });
    if (!notification) return errorResponse('通知不存在', 404);

    const updated = await prisma.notification.update({ where: { id }, data: { isRead: true } });
    return successResponse(updated);
  } catch {
    return errorResponse('更新失败', 500);
  }
}
