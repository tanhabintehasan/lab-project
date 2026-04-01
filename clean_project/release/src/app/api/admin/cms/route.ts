import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, withAuth, getPaginationParams, paginatedResponse } from '@/lib/api-helpers';
import { cmsPageSchema } from '@/lib/validations';
import { JWTPayload } from '@/lib/auth';

const handleGet = async (request: NextRequest) => {
  try {
    const { page, pageSize, skip } = getPaginationParams(request);
    const [pages, total] = await Promise.all([
      prisma.cMSPage.findMany({ orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }], skip, take: pageSize }),
      prisma.cMSPage.count(),
    ]);
    return paginatedResponse(pages, total, page, pageSize);
  } catch { return errorResponse('获取失败', 500); }
};

const handlePost = async (request: NextRequest, user: JWTPayload) => {
  try {
    const body = await request.json();
    const data = cmsPageSchema.parse(body);
    const slug = data.slug || data.titleZh.replace(/\s+/g, '-').toLowerCase() + '-' + Date.now().toString(36);
    const page = await prisma.cMSPage.create({
      data: { slug, type: data.type || 'page', titleZh: data.titleZh, titleEn: data.titleEn, contentZh: data.contentZh, contentEn: data.contentEn, isPublished: data.isPublished || false, sortOrder: data.sortOrder || 0 },
    });
    await prisma.auditLog.create({
      data: { userId: user.userId, action: 'ADMIN_CREATE_CMS', entity: 'CMSPage', entityId: page.id },
    });
    return successResponse(page, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse(error.issues[0]?.message || '参数无效', 400);
    return errorResponse('创建失败', 500);
  }
};

export const GET = withAuth(handleGet, ['SUPER_ADMIN']);
export const POST = withAuth(handlePost, ['SUPER_ADMIN']);
