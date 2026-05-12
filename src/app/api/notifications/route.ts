import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { errorResponse, getAuthUser, getPaginationParams, paginatedResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    const { page, pageSize, skip } = getPaginationParams(request);
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || undefined;
    const isRead = url.searchParams.get('isRead');

    const where: Prisma.NotificationWhereInput = { userId: user.userId };
    if (type) where.type = type as Prisma.EnumNotificationTypeFilter;
    if (isRead === 'true') where.isRead = true;
    if (isRead === 'false') where.isRead = false;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: pageSize }),
      prisma.notification.count({ where }),
    ]);

    return paginatedResponse(notifications, total, page, pageSize);
  } catch {
    return errorResponse('获取失败', 500);
  }
}
