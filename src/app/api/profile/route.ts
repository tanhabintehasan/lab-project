import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers';
import { updateProfileSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    const profile = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true, email: true, name: true, phone: true, avatar: true,
        role: true, locale: true, status: true, emailVerified: true,
        createdAt: true, lastLoginAt: true,
        company: { include: { company: true } },
        addresses: true,
        invoiceProfiles: true,
      },
    });
    if (!profile) return errorResponse('用户不存在', 404);
    return successResponse(profile);
  } catch {
    return errorResponse('获取失败', 500);
  }
}

export async function PUT(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    const body = await request.json();
    const data = updateProfileSchema.parse(body);

    const updated = await prisma.user.update({
      where: { id: user.userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.locale && { locale: data.locale }),
      },
      select: { id: true, email: true, name: true, phone: true, avatar: true, role: true, locale: true },
    });

    return successResponse(updated);
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse(error.issues[0]?.message || '参数无效', 400);
    return errorResponse('更新失败', 500);
  }
}
