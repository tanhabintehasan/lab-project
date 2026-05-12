import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers';
import { getStorageProvider, validateUpload } from '@/lib/storage';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const sampleId = pathParts[pathParts.length - 2];

    // Check sample exists
    const sample = await prisma.sample.findUnique({ where: { id: sampleId } });
    if (!sample) return errorResponse('样品不存在', 404);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const caption = (formData.get('caption') as string) || '';

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
    const result = await storage.upload(buffer, file.name, file.type, 'samples');

    // Save photo record
    const photo = await prisma.samplePhoto.create({
      data: {
        sampleId,
        photoUrl: result.url,
        caption,
      },
    });

    return successResponse({ photo }, 201);
  } catch (error) {
    console.error('Sample photo upload error:', error);
    return errorResponse('照片上传失败', 500);
  }
}
