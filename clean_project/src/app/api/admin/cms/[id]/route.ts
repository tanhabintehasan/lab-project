import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { cmsPageSchema } from '@/lib/validations';
import { JWTPayload } from '@/lib/auth';

const handlePut = async (request: NextRequest, user: JWTPayload) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop()!;
  try {
    const body = await request.json();
    const data = cmsPageSchema.partial().parse(body);
    const page = await prisma.cMSPage.update({ where: { id }, data });
    await prisma.auditLog.create({
      data: { userId: user.userId, action: 'ADMIN_UPDATE_CMS', entity: 'CMSPage', entityId: id },
    });
    return successResponse(page);
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse(error.issues[0]?.message || '参数无效', 400);
    return errorResponse('更新失败', 500);
  }
};

export const PUT = withAuth(handlePut, ['SUPER_ADMIN']);
