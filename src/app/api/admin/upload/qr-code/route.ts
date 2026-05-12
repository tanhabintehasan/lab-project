import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withAuth } from '@/lib/api-helpers';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const handler = async (request: NextRequest, user: any) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return errorResponse('未选择文件', 400);
    }

    // Strict MIME type validation (no SVG — XSS risk)
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return errorResponse('只能上传 JPEG、PNG、WebP 或 GIF 图片', 400);
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return errorResponse('文件大小不能超过5MB', 400);
    }

    // Sanitize extension from allowed types only
    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    const ext = extMap[file.type] || 'bin';
    const filename = `qr-${randomUUID()}.${ext}`;

    // Save to public directory
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'qr-codes');
    const filePath = join(uploadDir, filename);

    // Create directory if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    await writeFile(filePath, buffer);

    // Return public URL
    const publicUrl = `/uploads/qr-codes/${filename}`;

    return successResponse({
      url: publicUrl,
      filename,
    });
  } catch (error) {
    console.error('QR code upload error:', error);
    return errorResponse('上传失败', 500);
  }
};

export const POST = withAuth(handler, ['SUPER_ADMIN']);

// App Router segment config: ensure Node.js runtime for file system access
export const runtime = 'nodejs';
