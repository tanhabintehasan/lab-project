import { NextRequest } from 'next/server';
import { getAuthUser, successResponse, errorResponse } from '@/lib/api-helpers';
import {
  getMediaService,
  MediaValidationError,
  MediaQuotaExceededError,
  MediaDuplicateError,
  MediaSecurityError,
} from '@/services/media-service';
import type { UploadContext } from '@/services/media-service';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * POST /api/upload
 *
 * Authenticated user upload endpoint with context-aware validation.
 *
 * Contexts:
 * - avatar: images only, max 5MB
 * - rfq: images + PDF + docs, max 50MB
 * - sample: images only, max 10MB
 * - general: images + PDF, max 50MB
 *
 * All files pass through server-side validation. No direct client-side uploads.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const context = (formData.get('context') as UploadContext) || 'general';
    const folder = (formData.get('folder') as string) || context;
    const entityType = (formData.get('entityType') as string) || null;
    const entityId = (formData.get('entityId') as string) || null;

    if (!file) {
      return errorResponse('未选择文件', 400);
    }

    // Context size guard
    const contextMaxSizes: Record<string, number> = {
      avatar: 5 * 1024 * 1024,
      sample: 10 * 1024 * 1024,
      settings: 5 * 1024 * 1024,
    };
    const maxSize = contextMaxSizes[context] || MAX_FILE_SIZE;
    if (file.size > maxSize) {
      return errorResponse(`文件大小超过限制`, 400);
    }

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
        context,
        folder,
        entityType: entityType || undefined,
        entityId: entityId || undefined,
        uploadedBy: user.userId,
      }
    );

    return successResponse(result, 201);
  } catch (error) {
    if (error instanceof MediaValidationError) {
      return errorResponse(error.message, 400);
    }
    if (error instanceof MediaQuotaExceededError) {
      return errorResponse(error.message, 429);
    }
    if (error instanceof MediaDuplicateError) {
      return errorResponse(error.message, 409);
    }
    if (error instanceof MediaSecurityError) {
      return errorResponse(error.message, 400);
    }
    console.error('[Upload] Error:', error);
    return errorResponse('文件上传失败，请稍后重试', 500);
  }
}

export const runtime = 'nodejs';
