import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, withAuth, getPaginationParams } from '@/lib/api-helpers';
import { JWTPayload } from '@/lib/auth';
import { z } from 'zod';

const getHandler = async (request: NextRequest) => {
  try {
    const { page, pageSize, skip } = getPaginationParams(request);
    const url = new URL(request.url);
    const locale = url.searchParams.get('locale') || 'zh-CN';
    const category = url.searchParams.get('category');
    const query = url.searchParams.get('query');

    const where: Prisma.TranslationWhereInput = { locale };
    if (category) where.category = category;
    if (query) {
      where.OR = [
        { key: { contains: query, mode: 'insensitive' } },
        { value: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [translations, total] = await Promise.all([
      prisma.translation.findMany({
        where,
        orderBy: { key: 'asc' },
        skip,
        take: pageSize,
      }),
      prisma.translation.count({ where }),
    ]);

    return successResponse({
      data: translations,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      total,
    });
  } catch (error) {
    console.error('Translations fetch error:', error);
    return errorResponse('获取翻译失败', 500);
  }
};

const createSchema = z.object({
  key: z.string().min(1),
  translations: z.record(z.string(), z.string()),
  category: z.string().nullable().optional(),
});

const postHandler = async (request: NextRequest, user: JWTPayload) => {
  try {
    const body = await request.json();
    const data = createSchema.parse(body);

    // Create translations for each locale
    const creates = Object.entries(data.translations).map(([locale, value]) =>
      prisma.translation.create({
        data: {
          key: data.key,
          locale,
          value,
          category: data.category || null,
        },
      })
    );

    await Promise.all(creates);

    return successResponse({ message: '翻译已添加' }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '参数无效', 400);
    }
    console.error('Translation create error:', error);
    return errorResponse('添加翻译失败', 500);
  }
};

export const GET = withAuth(getHandler, ['SUPER_ADMIN']);
export const POST = withAuth(postHandler, ['SUPER_ADMIN']);
