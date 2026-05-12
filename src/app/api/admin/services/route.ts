import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  getPaginationParams,
  withAuth,
} from '@/lib/api-helpers';
import { adminServiceCreateSchema } from '@/lib/validations';
import { JWTPayload } from '@/lib/auth';

const handleGet = async (request: NextRequest) => {
  try {
    const { page, pageSize, skip } = getPaginationParams(request);
    const url = new URL(request.url);
    const query = (url.searchParams.get('q') || '').trim();
    const categoryId = (url.searchParams.get('categoryId') || '').trim();

    const where: Prisma.TestingServiceWhereInput = {};

    if (query) {
      where.OR = [
        { nameZh: { contains: query, mode: 'insensitive' } },
        { nameEn: { contains: query, mode: 'insensitive' } },
        { shortDescZh: { contains: query, mode: 'insensitive' } },
        { slug: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [services, total] = await Promise.all([
      prisma.testingService.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              nameZh: true,
              nameEn: true,
              slug: true,
            },
          },
          customFields: {
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: pageSize,
      }),
      prisma.testingService.count({ where }),
    ]);

    return paginatedResponse(services, total, page, pageSize);
  } catch (error) {
    console.error('Admin services GET error:', error);
    return errorResponse('获取服务列表失败', 500);
  }
};

const handlePost = async (request: NextRequest, user: JWTPayload) => {
  try {
    const body = await request.json();
    console.log("Incoming Body:", body);
    const data = adminServiceCreateSchema.parse(body);

    const category = await prisma.serviceCategory.findUnique({
      where: { id: data.categoryId },
      select: { id: true, isActive: true },
    });

    if (!category) {
      return errorResponse('所选分类不存在', 400);
    }

    const slug =
      data.slug?.trim().toLowerCase() ||
      `${data.nameZh.trim().replace(/\s+/g, '-').toLowerCase()}-${Date.now().toString(36)}`;

    const slugExists = await prisma.testingService.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (slugExists) {
      return errorResponse('服务 slug 已存在，请修改后重试', 400);
    }

    const service = await prisma.testingService.create({
      data: {
        slug,
        category: {
          connect: { id: data.categoryId },
        },
        nameZh: data.nameZh.trim(),
        nameEn: data.nameEn?.trim() || null,
        shortDescZh: data.shortDescZh?.trim() || null,
        shortDescEn: data.shortDescEn?.trim() || null,
        fullDescZh: data.fullDescZh?.trim() || null,
        pricingModel: data.pricingModel || 'FIXED',
        priceMin: data.priceMin,
        priceMax: data.priceMax,
        turnaroundDays: data.turnaroundDays,
        sampleRequirement: data.sampleRequirement?.trim() || null,
        sampleCount: data.sampleCount?.trim() || null,
        sampleSize: data.sampleSize?.trim() || null,
        sampleWeight: data.sampleWeight?.trim() || null,
        sampleCondition: data.sampleCondition?.trim() || null,
        samplePreservation: data.samplePreservation?.trim() || null,
        samplePreparation: data.samplePreparation?.trim() || null,
        isActive: true,
        isFeatured: data.isFeatured || false,
        isHot: data.isHot || false,
        customFields: data.customFields?.length
          ? { create: data.customFields.map((f) => ({
              label: f.label.trim(),
              fieldType: f.fieldType,
              options: f.options?.trim() || null,
              isRequired: f.isRequired,
              placeholder: f.placeholder?.trim() || null,
              sortOrder: f.sortOrder,
            })) }
          : undefined,
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
        customFields: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'ADMIN_CREATE_SERVICE',
        entity: 'TestingService',
        entityId: service.id,
      },
    });

    console.log("Created Service:", service);
    return successResponse(service, 201);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
};

export const GET = withAuth(handleGet, ['SUPER_ADMIN']);
export const POST = withAuth(handlePost, ['SUPER_ADMIN']);