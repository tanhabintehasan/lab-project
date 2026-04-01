import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { adminServiceCreateSchema } from '@/lib/validations';
import { JWTPayload } from '@/lib/auth';

async function findServiceByIdentifier(identifier: string) {
  return prisma.testingService.findFirst({
    where: {
      OR: [{ id: identifier }, { slug: identifier }],
    },
    select: {
      id: true,
      slug: true,
      isActive: true,
      categoryId: true,
    },
  });
}

function getIdentifier(request: NextRequest) {
  const url = new URL(request.url);
  return url.pathname.split('/').pop() || '';
}

const handleGet = async (request: NextRequest) => {
  try {
    const identifier = getIdentifier(request);
    const service = await prisma.testingService.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
      },
      include: {
        category: {
          select: {
            id: true,
            nameZh: true,
            nameEn: true,
            slug: true,
          },
        },
      },
    });

    if (!service) {
      return errorResponse('服务不存在', 404);
    }

    return successResponse(service);
  } catch (error) {
    console.error('Get service detail error:', error);
    return errorResponse('获取服务详情失败', 500);
  }
};

const handlePut = async (request: NextRequest, user: JWTPayload) => {
  const identifier = getIdentifier(request);

  try {
    const body = await request.json();
    const data = adminServiceCreateSchema.partial().parse(body);

    const existing = await findServiceByIdentifier(identifier);

    if (!existing) {
      return errorResponse('服务不存在', 404);
    }

    if (data.categoryId) {
      const category = await prisma.serviceCategory.findUnique({
        where: { id: data.categoryId },
        select: { id: true },
      });

      if (!category) {
        return errorResponse('所选分类不存在', 400);
      }
    }

    if (data.slug) {
      const normalizedSlug = data.slug.trim().toLowerCase();

      const slugExists = await prisma.testingService.findFirst({
        where: {
          slug: normalizedSlug,
          NOT: { id: existing.id },
        },
        select: { id: true },
      });

      if (slugExists) {
        return errorResponse('服务 slug 已存在', 400);
      }

      data.slug = normalizedSlug;
    }

    const updateData: Prisma.TestingServiceUpdateInput = {
      ...(data.slug !== undefined ? { slug: data.slug } : {}),
      ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
      ...(data.nameZh !== undefined ? { nameZh: data.nameZh.trim() } : {}),
      ...(data.nameEn !== undefined ? { nameEn: data.nameEn?.trim() || null } : {}),
      ...(data.shortDescZh !== undefined ? { shortDescZh: data.shortDescZh?.trim() || null } : {}),
      ...(data.shortDescEn !== undefined ? { shortDescEn: data.shortDescEn?.trim() || null } : {}),
      ...(data.fullDescZh !== undefined ? { fullDescZh: data.fullDescZh?.trim() || null } : {}),
      ...(data.pricingModel !== undefined ? { pricingModel: data.pricingModel } : {}),
      ...(data.priceMin !== undefined ? { priceMin: data.priceMin } : {}),
      ...(data.priceMax !== undefined ? { priceMax: data.priceMax } : {}),
      ...(data.turnaroundDays !== undefined ? { turnaroundDays: data.turnaroundDays } : {}),
      ...(data.sampleRequirement !== undefined
        ? { sampleRequirement: data.sampleRequirement?.trim() || null }
        : {}),
      ...(data.isFeatured !== undefined ? { isFeatured: data.isFeatured } : {}),
      ...(data.isHot !== undefined ? { isHot: data.isHot } : {}),
      ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
    };

    const service = await prisma.testingService.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            nameZh: true,
            nameEn: true,
            slug: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'ADMIN_UPDATE_SERVICE',
        entity: 'TestingService',
        entityId: existing.id,
        details: updateData as Prisma.InputJsonValue,
      },
    });

    return successResponse(service);
  } catch (error) {
    console.error('Update service error:', error);

    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '参数无效', 400);
    }

    return errorResponse('更新失败', 500);
  }
};

const handleDelete = async (request: NextRequest, user: JWTPayload) => {
  const identifier = getIdentifier(request);

  try {
    const existing = await findServiceByIdentifier(identifier);

    if (!existing) {
      return errorResponse('服务不存在', 404);
    }

    if (!existing.isActive) {
      return successResponse({ message: '该服务已删除' });
    }

    await prisma.testingService.update({
      where: { id: existing.id },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'ADMIN_DELETE_SERVICE',
        entity: 'TestingService',
        entityId: existing.id,
      },
    });

    return successResponse({ message: '已删除' });
  } catch (error) {
    console.error('Delete service error:', error);
    return errorResponse('删除失败', 500);
  }
};

export const GET = withAuth(handleGet, ['SUPER_ADMIN']);
export const PUT = withAuth(handlePut, ['SUPER_ADMIN']);
export const DELETE = withAuth(handleDelete, ['SUPER_ADMIN']);