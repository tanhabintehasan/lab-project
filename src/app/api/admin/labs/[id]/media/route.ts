import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import {
  withAdminApi,
  apiSuccess,
  apiError,
  apiNotFound,
} from '@/lib/admin-api';
import {
  getMediaService,
  MediaValidationError,
  MediaQuotaExceededError,
  MediaSecurityError,
} from '@/services/media-service';
import { JWTPayload } from '@/lib/auth';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per image

// ─── POST ────────────────────────────────────────────────────

const handlePost = async (request: NextRequest, user: JWTPayload) => {
  const url = new URL(request.url);
  const labId = url.pathname.split('/').slice(-2, -1)[0] || '';

  const lab = await prisma.laboratory.findUnique({
    where: { id: labId },
    select: { id: true },
  });

  if (!lab) {
    return apiNotFound('实验室不存在');
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const caption = (formData.get('caption') as string) || '';

    if (!file) {
      return apiError('未选择文件', 400);
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
        context: 'admin',
        folder: `labs/${labId}`,
        maxSize: MAX_FILE_SIZE,
        uploadedBy: user.userId,
      }
    );

    const mediaRecord = await prisma.labMedia.create({
      data: {
        labId,
        url: result.url,
        type: 'image',
        caption: caption.trim() || null,
        sortOrder: await prisma.labMedia.count({ where: { labId } }),
      },
    });

    return apiSuccess(
      {
        id: mediaRecord.id,
        url: mediaRecord.url,
        caption: mediaRecord.caption,
        sortOrder: mediaRecord.sortOrder,
        createdAt: mediaRecord.createdAt,
      },
      201
    );
  } catch (error) {
    if (error instanceof MediaValidationError) {
      return apiError(error.message, 400);
    }
    if (error instanceof MediaQuotaExceededError) {
      return apiError(error.message, 429);
    }
    if (error instanceof MediaSecurityError) {
      return apiError(error.message, 400);
    }
    console.error('Lab media upload error:', error);
    return apiError('上传失败', 500);
  }
};

// ─── DELETE ──────────────────────────────────────────────────

const handleDelete = async (request: NextRequest) => {
  const url = new URL(request.url);
  const labId = url.pathname.split('/').slice(-2, -1)[0] || '';
  const mediaId = url.searchParams.get('mediaId') || '';

  if (!mediaId) {
    return apiError('缺少媒体 ID', 400);
  }

  const media = await prisma.labMedia.findFirst({
    where: { id: mediaId, labId },
  });

  if (!media) {
    return apiNotFound('媒体文件不存在');
  }

  await prisma.labMedia.delete({
    where: { id: mediaId },
  });

  return apiSuccess({ deleted: true });
};

export const POST = withAdminApi(handlePost, { roles: ['SUPER_ADMIN'] });
export const DELETE = withAdminApi(handleDelete, { roles: ['SUPER_ADMIN'] });
