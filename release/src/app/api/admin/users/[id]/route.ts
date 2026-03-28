import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { adminUserUpdateSchema } from '@/lib/validations';
import { JWTPayload } from '@/lib/auth';

const handler = async (request: NextRequest, user: JWTPayload) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop()!;

  try {
    const body = await request.json();
    const data = adminUserUpdateSchema.parse(body);

    if (id === user.userId && data.role && data.role !== user.role) {
      return errorResponse('不能修改自己的角色', 400);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(data.role && { role: data.role }),
        ...(data.status && { status: data.status }),
      },
      select: { id: true, email: true, name: true, role: true, status: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'ADMIN_UPDATE_USER',
        entity: 'User',
        entityId: id,
        details: JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue,
      },
    });

    return successResponse(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '参数无效', 400);
    }
    return errorResponse('更新失败', 500);
  }
};

export const PATCH = withAuth(handler, ['SUPER_ADMIN']);