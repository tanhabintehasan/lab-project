import { NextRequest } from 'next/server';
import { withAdminApi, apiSuccess, apiError, apiPaginated } from '@/lib/admin-api';
import { getMediaService } from '@/services/media-service';
import { JWTPayload } from '@/lib/auth';

/**
 * GET /api/admin/media
 *
 * List all media files with filtering and pagination.
 * Admin only.
 */
const listHandler = withAdminApi(
  async (request: NextRequest) => {
    try {
      const url = new URL(request.url);
      const query = {
        page: parseInt(url.searchParams.get('page') || '1', 10),
        pageSize: parseInt(url.searchParams.get('pageSize') || '20', 10),
        context: url.searchParams.get('context') || undefined,
        entityType: url.searchParams.get('entityType') || undefined,
        entityId: url.searchParams.get('entityId') || undefined,
        uploadedBy: url.searchParams.get('uploadedBy') || undefined,
        mimeType: url.searchParams.get('mimeType') || undefined,
        search: url.searchParams.get('q') || undefined,
      };

      const media = getMediaService();
      const result = await media.list(query);

      return apiPaginated(result.items, result.total, result.page, result.pageSize);
    } catch (error) {
      console.error('[Admin Media List] Error:', error);
      return apiError('获取媒体列表失败', 500);
    }
  },
  { roles: ['SUPER_ADMIN', 'FINANCE_ADMIN'] }
);

/**
 * POST /api/admin/media
 *
 * Batch delete media files by IDs.
 * Body: { ids: string[] }
 */
const batchDeleteHandler = withAdminApi(
  async (request: NextRequest, user: JWTPayload) => {
    try {
      const body = await request.json();
      const ids = body.ids;

      if (!Array.isArray(ids) || ids.length === 0) {
        return apiError('请提供要删除的文件ID列表', 400);
      }

      const media = getMediaService();
      const result = await media.deleteMany(ids);

      return apiSuccess({
        deleted: result.deleted,
        failed: result.failed,
        total: ids.length,
      });
    } catch (error) {
      console.error('[Admin Media Batch Delete] Error:', error);
      return apiError('批量删除失败', 500);
    }
  },
  { roles: ['SUPER_ADMIN', 'FINANCE_ADMIN'] }
);

export const GET = listHandler;
export const POST = batchDeleteHandler;

export const runtime = 'nodejs';
