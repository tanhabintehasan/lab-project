import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const page = await prisma.cMSPage.findUnique({
      where: { slug: 'homepage' },
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

    if (!page) {
      // Return a minimal safe fallback so the frontend doesn't crash
      return successResponse({
        id: '',
        slug: 'homepage',
        titleZh: '首页',
        titleEn: 'Home',
        isPublished: false,
        sections: [],
      });
    }

    return successResponse(page);
  } catch (err) {
    console.error('GET /api/cms/homepage error:', err);
    return errorResponse('获取失败', 500);
  }
}
