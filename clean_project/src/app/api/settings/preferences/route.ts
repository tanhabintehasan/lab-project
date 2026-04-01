import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers';

export async function PUT(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    const { locale } = await request.json();
    const updated = await prisma.user.update({
      where: { id: user.userId },
      data: { ...(locale && { locale }) },
      select: { id: true, locale: true },
    });
    return successResponse(updated);
  } catch {
    return errorResponse('更新失败', 500);
  }
}
