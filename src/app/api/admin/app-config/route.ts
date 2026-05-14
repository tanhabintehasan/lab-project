import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { appConfigSchema } from '@/lib/validations';
import { JWTPayload } from '@/lib/auth';
import { getAllAppConfig, setAppConfig, invalidateAppConfigCache } from '@/lib/site-settings-cache';

/**
 * GET /api/admin/app-config
 *
 * List all sensitive app config entries (key-value map).
 * Admin only. Never exposed to public frontend.
 */
const handleGet = async () => {
  try {
    const configs = await getAllAppConfig();
    return successResponse(configs);
  } catch (err: any) {
    console.error('GET /api/admin/app-config error:', err?.message || err);
    return errorResponse('获取失败', 500);
  }
};

/**
 * PUT /api/admin/app-config
 *
 * Upsert a single app config entry.
 * Body: { key, value, category?, description? }
 */
const handlePut = async (request: NextRequest, user: JWTPayload) => {
  try {
    const body = await request.json();
    const data = appConfigSchema.parse(body);

    await setAppConfig(data.key, data.value, {
      category: data.category || undefined,
      description: data.description || undefined,
      updatedBy: user.userId,
    });

    return successResponse({ key: data.key, message: '已保存' });
  } catch (error: any) {
    console.error('PUT /api/admin/app-config error:', error);
    if (error instanceof z.ZodError) return errorResponse(error.issues[0]?.message || '参数无效', 400);
    return errorResponse(error?.message || '保存失败', 500);
  }
};

/**
 * DELETE /api/admin/app-config?key=XXX
 *
 * Delete a single app config entry by key.
 */
const handleDelete = async (request: NextRequest, user: JWTPayload) => {
  try {
    const key = request.nextUrl.searchParams.get('key');
    if (!key) return errorResponse('缺少 key 参数', 400);

    await (prisma as any).appConfig.deleteMany({ where: { key } });
    invalidateAppConfigCache();

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'ADMIN_DELETE_APP_CONFIG',
        entity: 'AppConfig',
        entityId: key,
      },
    });

    return successResponse({ key, message: '已删除' });
  } catch (err: any) {
    console.error('DELETE /api/admin/app-config error:', err?.message || err);
    return errorResponse('删除失败', 500);
  }
};

export const GET = withAuth(handleGet, ['SUPER_ADMIN']);
export const PUT = withAuth(handlePut, ['SUPER_ADMIN']);
export const DELETE = withAuth(handleDelete, ['SUPER_ADMIN']);
