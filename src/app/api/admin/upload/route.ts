import { NextRequest } from 'next/server';
import { withAdminApi, apiSuccess, apiError } from '@/lib/admin-api';
import {
  getMediaService,
  MediaValidationError,
  MediaQuotaExceededError,
  MediaDuplicateError,
  MediaSecurityError,
} from '@/services/media-service';
import { prisma } from '@/lib/db';
import { JWTPayload } from '@/lib/auth';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * POST /api/admin/upload
 *
 * Admin-only file upload endpoint.
 *
 * Validates:
 * - Admin authentication & role (SUPER_ADMIN / FINANCE_ADMIN)
 * - File MIME type: Images (JPEG/PNG/WebP/GIF) and PDF only
 * - File size: max 50MB
 * - Generates UUID filename (no original name leakage)
 *
 * Tracks uploaded file in the global Media table.
 *
 * Returns: { id, url, key, size, mimeType, filename }
 *
 * No direct client-side uploads are permitted — all files must
 * pass through this route for server-side validation.
 */
export const POST = withAdminApi(
  async (request: NextRequest, user: JWTPayload) => {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const folder = (formData.get('folder') as string) || 'admin';
      const entityType = (formData.get('entityType') as string) || undefined;
      const entityId = (formData.get('entityId') as string) || undefined;

      if (!file) {
        return apiError('未选择文件', 400);
      }

      // Convert File to Buffer for server-side processing
      const buffer = Buffer.from(await file.arrayBuffer());

      const media = getMediaService();
      const result = await media.upload(
        {
          buffer,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
        },
        {
          context: 'admin',
          maxSize: MAX_FILE_SIZE,
          folder,
          entityType,
          entityId,
          uploadedBy: user.userId,
        }
      );

      // Audit log is written automatically by MediaService.upload()
      // Admin routes may append additional audit metadata (IP, etc.) here if needed.

      return apiSuccess(result, 201);
    } catch (error) {
      if (error instanceof MediaValidationError) {
        return apiError(error.message, 400);
      }
      if (error instanceof MediaQuotaExceededError) {
        return apiError(error.message, 429);
      }
      if (error instanceof MediaDuplicateError) {
        // Return existing file instead of failing with 409
        const existing = await prisma.media.findUnique({
          where: { id: error.existingId },
          select: { id: true, url: true, key: true, size: true, mimeType: true, filename: true },
        });
        if (existing) {
          return apiSuccess(existing, 200);
        }
        return apiError(error.message, 409);
      }
      if (error instanceof MediaSecurityError) {
        return apiError(error.message, 400);
      }
      console.error('[Admin Upload] Error:', error);
      return apiError('文件上传失败，请稍后重试', 500);
    }
  },
  { roles: ['SUPER_ADMIN', 'FINANCE_ADMIN'], requireCsrf: false }
);

// Ensure Node.js runtime for Buffer / file system access
export const runtime = 'nodejs';
