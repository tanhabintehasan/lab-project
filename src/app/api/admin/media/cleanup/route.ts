import { NextRequest } from 'next/server';
import { withAdminApi, apiSuccess, apiError } from '@/lib/admin-api';
import { getMediaService } from '@/services/media-service';

/**
 * POST /api/admin/media/cleanup
 *
 * Scan for orphaned media records (files whose linked entity no longer exists)
 * and soft-delete them.
 *
 * Admin only (SUPER_ADMIN).
 */
export const POST = withAdminApi(
  async (request: NextRequest) => {
    try {
      const media = getMediaService();
      const result = await media.cleanupOrphans();

      return apiSuccess({
        cleaned: result.cleaned,
        ids: result.ids,
        message: result.cleaned > 0
          ? `已清理 ${result.cleaned} 个孤立文件`
          : '未发现孤立文件',
      });
    } catch (error) {
      console.error('[Admin Media Cleanup] Error:', error);
      return apiError('清理失败', 500);
    }
  },
  { roles: ['SUPER_ADMIN'] }
);

export const runtime = 'nodejs';
