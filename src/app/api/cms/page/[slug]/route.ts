import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export const runtime = 'nodejs';

function extractSlug(request: NextRequest): string | null {
  const segments = request.nextUrl.pathname.split('/');
  return segments[segments.length - 1] || null;
}

export async function GET(request: NextRequest) {
  try {
    const slug = extractSlug(request);
    if (!slug) return errorResponse('参数无效', 400);

    const page = await prisma.cMSPage.findUnique({
      where: { slug },
      include: {
        sections: {
          where: { isPublished: true, isEnabled: true },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          include: {
            items: {
              where: { isEnabled: true },
              orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
              include: {
                points: {
                  where: { isEnabled: true },
                  orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
                },
              },
            },
          },
        },
      },
    });

    if (!page) return errorResponse('内容未找到', 404);
    return successResponse(page);
  } catch (err) {
    console.error('cms page GET error:', err);
    return errorResponse('获取失败', 500);
  }
}
