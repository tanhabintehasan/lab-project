import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { siteSettingSchema } from '@/lib/validations';
import { JWTPayload } from '@/lib/auth';
import { getAdminSettings, invalidateSiteSettingsCache } from '@/lib/site-settings-cache';

export const runtime = 'nodejs';

const handleGet = async () => {
  try {
    const settings = await getAdminSettings();
    return successResponse(settings);
  } catch (err: any) {
    console.error('GET /api/admin/site-settings error:', err?.message || err);
    return errorResponse('获取失败', 500);
  }
};

const handlePut = async (request: NextRequest, user: JWTPayload) => {
  try {
    const body = await request.json();
    const data = siteSettingSchema.parse(body);

    let settings = await prisma.siteSetting.findFirst({ orderBy: { createdAt: 'asc' } });

    const prismaData: any = { ...data };
    // Strip fields that should not be passed to Prisma data layer
    delete prismaData.id;
    delete prismaData.createdAt;
    delete prismaData.updatedAt;

    await prisma.$transaction(async (tx) => {
      if (settings) {
        settings = await tx.siteSetting.update({
          where: { id: settings.id },
          data: prismaData,
        });
      } else {
        settings = await tx.siteSetting.create({ data: prismaData });
      }

      await tx.auditLog.create({
        data: {
          userId: user.userId,
          action: 'ADMIN_UPDATE_SITE_SETTINGS',
          entity: 'SiteSetting',
          entityId: settings.id,
        },
      });
    });

    // Invalidate cache so next read picks up the new values
    invalidateSiteSettingsCache();

    return successResponse(settings);
  } catch (error: any) {
    console.error('PUT /api/admin/site-settings error:', error);
    if (error instanceof z.ZodError) return errorResponse(error.issues[0]?.message || '参数无效', 400);
    return errorResponse(error?.message || '保存失败', 500);
  }
};

export const GET = withAuth(handleGet, ['SUPER_ADMIN']);
export const PUT = withAuth(handlePut, ['SUPER_ADMIN']);
