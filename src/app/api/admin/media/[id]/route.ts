import { NextRequest } from 'next/server';
import { withAdminApi, apiSuccess, apiError, apiNotFound } from '@/lib/admin-api';
import { getMediaService, MediaNotFoundError } from '@/services/media-service';
import { getRouteId } from '@/lib/admin-api';

/**
 * GET /api/admin/media/:id
 *
 * Get a single media record by ID.
 */
const getHandler = withAdminApi(
  async (request: NextRequest, user, context) => {
    try {
      const id = await getRouteId(context, request.url);
      if (!id) return apiError('缺少媒体文件ID', 400);

      const media = getMediaService();
      const record = await media.getById(id);

      if (!record || record.deletedAt) {
        return apiNotFound();
      }

      return apiSuccess(record);
    } catch (error) {
      console.error('[Admin Media Get] Error:', error);
      return apiError('获取媒体文件失败', 500);
    }
  },
  { roles: ['SUPER_ADMIN', 'FINANCE_ADMIN'] }
);

/**
 * DELETE /api/admin/media/:id
 *
 * Soft-delete a media file (removes from storage + marks deleted).
 */
const deleteHandler = withAdminApi(
  async (request: NextRequest, user, context) => {
    try {
      const id = await getRouteId(context, request.url);
      if (!id) return apiError('缺少媒体文件ID', 400);

      const media = getMediaService();
      await media.delete(id);

      return apiSuccess({ id, deleted: true });
    } catch (error) {
      if (error instanceof MediaNotFoundError) {
        return apiNotFound();
      }
      console.error('[Admin Media Delete] Error:', error);
      return apiError('删除媒体文件失败', 500);
    }
  },
  { roles: ['SUPER_ADMIN', 'FINANCE_ADMIN'] }
);

export const GET = getHandler;
export const DELETE = deleteHandler;

export const runtime = 'nodejs';
