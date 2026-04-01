import { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  getPaginationParams,
  withAuth,
} from '@/lib/api-helpers';
import { JWTPayload } from '@/lib/auth';

const adminCategoryCreateSchema = z.object({
  nameZh: z.string().min(1, '分类中文名不能为空'),
  nameEn: z.string().optional().nullable(),
  slug: z.string().min(1, 'slug不能为空'),
  descZh: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  sortOrder: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

const handleGet = async (request: NextRequest) => {
  try {
    const { page, pageSize, skip } = getPaginationParams(request);
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';

    const where: Prisma.ServiceCategoryWhereInput = {};

    if (query) {
      where.OR = [
        { nameZh: { contains: query, mode: 'insensitive' } },
        { nameEn: { contains: query, mode: 'insensitive' } },
        { slug: { contains: query, mode: 'insensitive' } },
        { descZh: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [categories, total] = await Promise.all([
      prisma.serviceCategory.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: pageSize,
        include: {
          _count: {
            select: {
              services: true,
            },
          },
        },
      }),
      prisma.serviceCategory.count({ where }),
    ]);

    return paginatedResponse(categories, total, page, pageSize);
  } catch (error) {
    console.error('Admin categories GET error:', error);
    return errorResponse('获取分类列表失败', 500);
  }
};

const handlePost = async (request: NextRequest, user: JWTPayload) => {
  try {
    const body = await request.json();
    const data = adminCategoryCreateSchema.parse(body);

    const exists = await prisma.serviceCategory.findFirst({
      where: {
        OR: [{ slug: data.slug }, { nameZh: data.nameZh }],
      },
      select: { id: true },
    });

    if (exists) {
      return errorResponse('分类名称或 slug 已存在', 400);
    }

    const category = await prisma.serviceCategory.create({
      data: {
        nameZh: data.nameZh,
        nameEn: data.nameEn || null,
        slug: data.slug,
        descZh: data.descZh || null,
        icon: data.icon || null,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'ADMIN_CREATE_SERVICE_CATEGORY',
        entity: 'ServiceCategory',
        entityId: category.id,
      },
    });

    return successResponse(category, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '参数无效', 400);
    }

    console.error('Create category error:', error);
    return errorResponse('创建分类失败', 500);
  }
};

export const GET = withAuth(handleGet, ['SUPER_ADMIN']);
export const POST = withAuth(handlePost, ['SUPER_ADMIN']);