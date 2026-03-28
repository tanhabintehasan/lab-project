import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-helpers';

type ServiceRow = {
  id: string;
  slug: string;
  categoryId: string;
  nameZh: string;
  nameEn: string | null;
  shortDescZh: string | null;
  shortDescEn: string | null;
  fullDescZh: string | null;
  fullDescEn: string | null;
  priceMin: unknown;
  priceMax: unknown;
  currency: string | null;
  turnaroundDays: number | null;
  turnaroundDesc: string | null;
  isActive: boolean;
  isFeatured: boolean;
  isHot: boolean;
  orderCount: number;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    slug: string;
    nameZh: string;
    nameEn: string | null;
  } | null;
  materials: Array<{
    material: {
      id: string;
      slug: string;
      nameZh: string;
      nameEn: string | null;
    };
  }>;
  industries: Array<{
    industry: {
      id: string;
      slug: string;
      nameZh: string;
      nameEn: string | null;
    };
  }>;
  standards: Array<{
    standard: {
      id: string;
      code: string;
      nameZh: string;
      nameEn: string | null;
    };
  }>;
};

function toPositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = toPositiveInt(searchParams.get('page'), 1);
    const pageSize = Math.min(toPositiveInt(searchParams.get('pageSize'), 12), 100);
    const skip = (page - 1) * pageSize;

    const q = searchParams.get('q')?.trim() || '';
    const category = searchParams.get('category')?.trim() || '';
    const material = searchParams.get('material')?.trim() || '';
    const industry = searchParams.get('industry')?.trim() || '';
    const standard = searchParams.get('standard')?.trim() || '';
    const sort = searchParams.get('sort')?.trim() || '';
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';
    const featured = searchParams.get('featured');
    const hot = searchParams.get('hot');

    const where: any = {
      isActive: true,
    };

    if (q) {
      where.OR = [
        { nameZh: { contains: q } },
        { nameEn: { contains: q } },
        { shortDescZh: { contains: q } },
        { shortDescEn: { contains: q } },
        { fullDescZh: { contains: q } },
        { fullDescEn: { contains: q } },
        {
          category: {
            OR: [{ nameZh: { contains: q } }, { nameEn: { contains: q } }],
          },
        },
      ];
    }

    if (category) {
      const matchedCategory = await prisma.serviceCategory.findFirst({
        where: {
          isActive: true,
          OR: [{ id: category }, { slug: category }],
        },
        select: { id: true },
      });

      if (!matchedCategory) {
        return successResponse({
          data: [],
          page,
          pageSize,
          total: 0,
          totalPages: 1,
        });
      }

      where.categoryId = matchedCategory.id;
    }

    if (material) {
      where.materials = {
        some: {
          OR: [{ materialId: material }, { material: { slug: material } }],
        },
      };
    }

    if (industry) {
      where.industries = {
        some: {
          OR: [{ industryId: industry }, { industry: { slug: industry } }],
        },
      };
    }

    if (standard) {
      where.standards = {
        some: {
          OR: [{ standardId: standard }, { standard: { code: standard } }],
        },
      };
    }

    if (featured === 'true') where.isFeatured = true;
    if (hot === 'true') where.isHot = true;

    let orderBy: any = { createdAt: 'desc' };

    if (sort === 'price') {
      orderBy = { priceMin: order };
    } else if (sort === 'popular') {
      orderBy = [{ isHot: 'desc' }, { orderCount: 'desc' }, { createdAt: 'desc' }];
    } else {
      orderBy = { createdAt: order };
    }

    const [services, total] = await Promise.all([
      prisma.testingService.findMany({
        where,
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
        },
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.testingService.count({ where }),
    ]);

    const data = (services as ServiceRow[]).map((service: ServiceRow) => ({
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
      isActive: service.isActive,
      isFeatured: service.isFeatured,
      isHot: service.isHot,
      orderCount: service.orderCount,
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
    }));

    return successResponse({
      data,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (error) {
    console.error('Services fetch error:', error);

    return errorResponse(
      error instanceof Error ? error.message : '获取服务列表失败',
      500
    );
  }
}