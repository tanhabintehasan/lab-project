import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { adminLabCreateSchema } from '@/lib/validations';
import { JWTPayload } from '@/lib/auth';

const handlePost = async (request: NextRequest, user: JWTPayload) => {
  try {
    const body = await request.json();
    const data = adminLabCreateSchema.parse(body);
    const slug = data.slug || data.nameZh.replace(/\s+/g, '-').toLowerCase() + '-' + Date.now().toString(36);
    const lab = await prisma.laboratory.create({
      data: { slug, nameZh: data.nameZh, nameEn: data.nameEn, shortDescZh: data.shortDescZh, address: data.address, city: data.city, province: data.province, phone: data.phone, email: data.email, status: 'PENDING' },
    });
    await prisma.auditLog.create({
      data: { userId: user.userId, action: 'ADMIN_CREATE_LAB', entity: 'Laboratory', entityId: lab.id },
    });
    return successResponse(lab, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse(error.issues[0]?.message || '参数无效', 400);
    return errorResponse('创建失败', 500);
  }
};

export const POST = withAuth(handlePost, ['SUPER_ADMIN']);
