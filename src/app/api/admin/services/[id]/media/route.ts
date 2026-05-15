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

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per image

// ─── POST ────────────────────────────────────────────────────

const handlePost = async (request: NextRequest, user: JWTPayload) => {
  const url = new URL(request.url);
  const serviceId = url.pathname.split('/').slice(-2, -1)[0] || '';

  const service = await prisma.testingService.findUnique({
    where: { id: serviceId },
    select: { id: true },
  });

  if (!service) {
    return apiNotFound('服务不存在');
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
        folder: `services/${serviceId}`,
        maxSize: MAX_FILE_SIZE,
        uploadedBy: user.userId,
      }
    );

    // Create TestingServiceMedia record
    const mediaRecord = await prisma.testingServiceMedia.create({
      data: {
        serviceId,
        url: result.url,
        caption: caption.trim() || null,
        sortOrder: await prisma.testingServiceMedia.count({ where: { serviceId } }),
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
    console.error('Service media upload error:', error);
    return apiError('上传失败', 500);
  }
};

// ─── DELETE ──────────────────────────────────────────────────

const handleDelete = async (request: NextRequest, user: JWTPayload) => {
  const url = new URL(request.url);
  const serviceId = url.pathname.split('/').slice(-2, -1)[0] || '';
  const mediaId = url.searchParams.get('mediaId') || '';

  if (!mediaId) {
    return apiError('缺少媒体 ID', 400);
  }

  const media = await prisma.testingServiceMedia.findFirst({
    where: { id: mediaId, serviceId },
  });

  if (!media) {
    return apiNotFound('媒体文件不存在');
  }

  await prisma.testingServiceMedia.delete({
    where: { id: mediaId },
  });

  return apiSuccess({ deleted: true });
};

export const POST = withAdminApi(handlePost, { roles: ['SUPER_ADMIN'] });
export const DELETE = withAdminApi(handleDelete, { roles: ['SUPER_ADMIN'] });
