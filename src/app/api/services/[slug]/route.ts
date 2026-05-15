import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export const runtime = 'nodejs';

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function GET(request: NextRequest) {
  try {
    const slug = request.url.split('/services/').pop()?.split('?')[0] || '';

    if (!slug) {
      return errorResponse('缺少服务标识', 400);
    }

    const service = await prisma.testingService.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
        isActive: true,
      },
      include: {
        category: {
          select: {
            id: true,
            slug: true,
            nameZh: true,
            nameEn: true,
          },
        },
        materials: {
          include: {
            material: {
              select: {
                id: true,
                slug: true,
                nameZh: true,
                nameEn: true,
              },
            },
          },
        },
        industries: {
          include: {
            industry: {
              select: {
                id: true,
                slug: true,
                nameZh: true,
                nameEn: true,
              },
            },
          },
        },
        standards: {
          include: {
            standard: {
              select: {
                id: true,
                code: true,
                nameZh: true,
                nameEn: true,
              },
            },
          },
        },
        customFields: {
          orderBy: { sortOrder: 'asc' },
        },
        labServices: {
          where: {
            lab: { status: { in: ['ACTIVE', 'PENDING'] } },
          },
          include: {
            lab: {
              select: {
                id: true,
                slug: true,
                nameZh: true,
                nameEn: true,
                city: true,
                rating: true,
              },
            },
          },
        },
      },
    });

    if (!service) {
      return errorResponse('服务不存在', 404);
    }

    // Increment view count asynchronously (fire-and-forget)
    prisma.testingService.update({
      where: { id: service.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});

    const data = {
      id: service.id,
      slug: service.slug,
      categoryId: service.categoryId,
      nameZh: service.nameZh,
      nameEn: service.nameEn,
      shortDescZh: service.shortDescZh,
      shortDescEn: service.shortDescEn,
      fullDescZh: service.fullDescZh,
      fullDescEn: service.fullDescEn,
      priceMin: toNumberOrNull(service.priceMin),
      priceMax: toNumberOrNull(service.priceMax),
      currency: service.currency,
      turnaroundDays: service.turnaroundDays,
      turnaroundDesc: service.turnaroundDesc,
      sampleRequirement: service.sampleRequirement,
      sampleCount: service.sampleCount,
      sampleSize: service.sampleSize,
      sampleWeight: service.sampleWeight,
      sampleCondition: service.sampleCondition,
      samplePreservation: service.samplePreservation,
      samplePreparation: service.samplePreparation,
      deliverables: service.deliverables,
      isActive: service.isActive,
      isFeatured: service.isFeatured,
      isHot: service.isHot,
      orderCount: service.orderCount,
      viewCount: (service.viewCount || 0) + 1,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
      category: service.category,
      materials: service.materials.map((item) => ({
        id: item.material.id,
        slug: item.material.slug,
        nameZh: item.material.nameZh,
        nameEn: item.material.nameEn,
      })),
      industries: service.industries.map((item) => ({
        id: item.industry.id,
        slug: item.industry.slug,
        nameZh: item.industry.nameZh,
        nameEn: item.industry.nameEn,
      })),
      standards: service.standards.map((item) => ({
        id: item.standard.id,
        code: item.standard.code,
        nameZh: item.standard.nameZh,
        nameEn: item.standard.nameEn,
      })),
      labServices: service.labServices.map((ls) => ({
        id: ls.lab?.id,
        slug: ls.lab?.slug,
        nameZh: ls.lab?.nameZh,
        nameEn: ls.lab?.nameEn,
        city: ls.lab?.city,
        rating: toNumberOrNull(ls.lab?.rating),
      })),
    };

    return successResponse(data);
  } catch (error) {
    console.error('Service detail fetch error:', error);
    return errorResponse('获取服务详情失败', 500);
  }
}
