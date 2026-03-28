import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthUser, successResponse, errorResponse } from '@/lib/api-helpers';
import { getStorageProvider, validateUpload } from '@/lib/storage';
import { prisma } from '@/lib/db';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'general';
    const entityType = formData.get('entityType') as string | null; // 'rfq', 'report', 'sample', 'avatar'
    const entityId = formData.get('entityId') as string | null;

    if (!file) return errorResponse('未选择文件', 400);

    // Validate file
    const validation = validateUpload(
      { size: file.size, type: file.type },
      { maxSize: MAX_FILE_SIZE, allowedTypes: ALLOWED_TYPES }
    );
    if (!validation.valid) return errorResponse(validation.error || '文件验证失败', 400);

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const storage = getStorageProvider();
    const result = await storage.upload(buffer, file.name, file.type, folder);

    // Store file metadata in database based on entityType
    if (entityType === 'rfq' && entityId) {
      await prisma.rFQFile.create({
        data: {
          rfqId: entityId,
          fileName: file.name,
          fileUrl: result.url,
          fileType: file.type,
          fileSize: file.size,
          version: 1,
        },
      });
    } else if (entityType === 'report' && entityId) {
      await prisma.reportAttachment.create({
        data: {
          reportId: entityId,
          fileName: file.name,
          fileUrl: result.url,
          fileType: file.type,
          fileSize: file.size,
        },
      });
    } else if (entityType === 'sample' && entityId) {
      await prisma.samplePhoto.create({
        data: {
          sampleId: entityId,
          photoUrl: result.url,
          caption: file.name,
        },
      });
    }

    return successResponse({
      file: {
        url: result.url,
        key: result.key,
        name: file.name,
        size: result.size,
        type: result.mimeType,
      },
    }, 201);
  } catch (error) {
    console.error('Upload error:', error);
    return errorResponse('文件上传失败', 500);
  }
}
