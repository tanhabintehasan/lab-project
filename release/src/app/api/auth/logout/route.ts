import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers';
import { buildClearCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (user?.sessionId) {
      await prisma.session.delete({
        where: { id: user.sessionId },
      }).catch(() => {});
    }

    if (user) {
      await prisma.auditLog.create({
        data: {
          userId: user.userId,
          action: 'LOGOUT',
          entity: 'User',
          entityId: user.userId,
        },
      }).catch(() => {});
    }

    const response = successResponse({ message: '已退出登录' });
    response.headers.set('Set-Cookie', buildClearCookie());
    return response;
  } catch {
    const response = errorResponse('退出失败', 500);
    response.headers.set('Set-Cookie', buildClearCookie());
    return response;
  }
}