import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { JWTPayload } from '@/lib/auth';

const adminCategoryUpdateSchema = z.object({
  nameZh: z.string().min(1, '分类中文名不能为空').optional(),
  nameEn: z.string().optional().nullable(),
  slug: z.string().min(1, 'slug不能为空').optional(),
  descZh: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

function getIdentifier(request: NextRequest) {
  const url = new URL(request.url);
  return url.pathname.split('/').pop() || '';
}

async function findCategoryByIdentifier(identifier: string) {
  return prisma.serviceCategory.findFirst({
    where: {
      OR: [{ id: identifier }, { slug: identifier }],
    },
    include: {
      _count: {
        select: {
          services: true,
          children: true,
        },
      },
    },
  });
}

const handleGet = async (request: NextRequest) => {
  try {
    const identifier = getIdentifier(request);

    const category = await findCategoryByIdentifier(identifier);

    if (!category) {
      return errorResponse('分类不存在', 404);
    }

    return successResponse(category);
  } catch (error) {
    console.error('Get service category detail error:', error);
    return errorResponse('获取分类详情失败', 500);
  }
};

const handlePatch = async (request: NextRequest, user: JWTPayload) => {
  try {
    const identifier = getIdentifier(request);
    const existing = await findCategoryByIdentifier(identifier);

    if (!existing) {
      return errorResponse('分类不存在', 404);
    }

    const body = await request.json();
    const data = adminCategoryUpdateSchema.parse(body);

    if (data.slug) {
      const normalizedSlug = data.slug.trim().toLowerCase();

      const slugExists = await prisma.serviceCategory.findFirst({
        where: {
          slug: normalizedSlug,
          NOT: { id: existing.id },
        },
        select: { id: true },
      });

      if (slugExists) {
        return errorResponse('slug 已存在', 400);
      }

      data.slug = normalizedSlug;
    }

    if (data.nameZh) {
      const nameExists = await prisma.serviceCategory.findFirst({
        where: {
          nameZh: data.nameZh.trim(),
          NOT: { id: existing.id },
        },
        select: { id: true },
      });

      if (nameExists) {
        return errorResponse('分类名称已存在', 400);
      }

      data.nameZh = data.nameZh.trim();
    }

    const updateData: Prisma.ServiceCategoryUpdateInput = {
      ...(data.nameZh !== undefined ? { nameZh: data.nameZh } : {}),
      ...(data.nameEn !== undefined ? { nameEn: data.nameEn?.trim() || null } : {}),
      ...(data.slug !== undefined ? { slug: data.slug } : {}),
      ...(data.descZh !== undefined ? { descZh: data.descZh?.trim() || null } : {}),
      ...(data.icon !== undefined ? { icon: data.icon?.trim() || null } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    };

    const category = await prisma.serviceCategory.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        _count: {
          select: {
            services: true,
            children: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'ADMIN_UPDATE_SERVICE_CATEGORY',
        entity: 'ServiceCategory',
        entityId: existing.id,
        details: updateData as Prisma.InputJsonValue,
      },
    });

    return successResponse(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '参数无效', 400);
    }

    console.error('Update service category error:', error);
    return errorResponse('更新分类失败', 500);
  }
};

const handleDelete = async (request: NextRequest, user: JWTPayload) => {
  try {
    const identifier = getIdentifier(request);
    const existing = await findCategoryByIdentifier(identifier);

    if (!existing) {
      return errorResponse('分类不存在', 404);
    }

    if (existing._count.services > 0) {
      return errorResponse('该分类下仍有关联服务，无法删除', 400);
    }

    if (existing._count.children > 0) {
      return errorResponse('该分类下仍有子分类，无法删除', 400);
    }

    await prisma.serviceCategory.delete({
      where: { id: existing.id },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'ADMIN_DELETE_SERVICE_CATEGORY',
        entity: 'ServiceCategory',
        entityId: existing.id,
        details: {
          nameZh: existing.nameZh,
          slug: existing.slug,
        },
      },
    });

    return successResponse({ message: '删除成功' });
  } catch (error) {
    console.error('Delete service category error:', error);
    return errorResponse('删除分类失败', 500);
  }
};

export const GET = withAuth(handleGet, ['SUPER_ADMIN']);
export const PATCH = withAuth(handlePatch, ['SUPER_ADMIN']);
export const DELETE = withAuth(handleDelete, ['SUPER_ADMIN']);