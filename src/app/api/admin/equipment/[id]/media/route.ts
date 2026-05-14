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
  const equipmentId = url.pathname.split('/').slice(-2, -1)[0] || '';

  const equipment = await prisma.equipment.findUnique({
    where: { id: equipmentId },
    select: { id: true },
  });

  if (!equipment) {
    return apiNotFound('设备不存在');
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
        folder: `equipment/${equipmentId}`,
        maxSize: MAX_FILE_SIZE,
        uploadedBy: user.userId,
      }
    );

    const mediaRecord = await prisma.equipmentMedia.create({
      data: {
        equipmentId,
        url: result.url,
        caption: caption.trim() || null,
        sortOrder: await prisma.equipmentMedia.count({ where: { equipmentId } }),
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
    console.error('Equipment media upload error:', error);
    return apiError('上传失败', 500);
  }
};

// ─── DELETE ──────────────────────────────────────────────────

const handleDelete = async (request: NextRequest) => {
  const url = new URL(request.url);
  const equipmentId = url.pathname.split('/').slice(-2, -1)[0] || '';
  const mediaId = url.searchParams.get('mediaId') || '';

  if (!mediaId) {
    return apiError('缺少媒体 ID', 400);
  }

  const media = await prisma.equipmentMedia.findFirst({
    where: { id: mediaId, equipmentId },
  });

  if (!media) {
    return apiNotFound('媒体文件不存在');
  }

  await prisma.equipmentMedia.delete({
    where: { id: mediaId },
  });

  return apiSuccess({ deleted: true });
};

export const POST = withAdminApi(handlePost, { roles: ['SUPER_ADMIN'] });
export const DELETE = withAdminApi(handleDelete, { roles: ['SUPER_ADMIN'] });
