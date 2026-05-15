import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { adminLabCreateSchema, adminLabStatusSchema } from '@/lib/validations';
import { JWTPayload } from '@/lib/auth';

export const runtime = 'nodejs';

const handleGet = async (request: NextRequest) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop()!;
  try {
    const lab = await prisma.laboratory.findUnique({ where: { id } });
    if (!lab) return errorResponse('实验室未找到', 404);
    return successResponse(lab);
  } catch {
    return errorResponse('获取实验室失败', 500);
  }
};

const handlePut = async (request: NextRequest, user: JWTPayload) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop()!;
  try {
    const body = await request.json();
    const data = adminLabCreateSchema.partial().parse(body);
    const lab = await prisma.laboratory.update({ where: { id }, data });
    await prisma.auditLog.create({
      data: { userId: user.userId, action: 'ADMIN_UPDATE_LAB', entity: 'Laboratory', entityId: id },
    });
    return successResponse(lab);
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse(error.issues[0]?.message || '参数无效', 400);
    return errorResponse('更新失败', 500);
  }
};

const handlePatch = async (request: NextRequest, user: JWTPayload) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop()!;
  try {
    const body = await request.json();
    const data = adminLabStatusSchema.parse(body);
    const lab = await prisma.laboratory.update({ where: { id }, data: { status: data.status } });
    await prisma.auditLog.create({
      data: { userId: user.userId, action: 'ADMIN_UPDATE_LAB_STATUS', entity: 'Laboratory', entityId: id, details: { status: data.status } },
    });
    return successResponse(lab);
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse(error.issues[0]?.message || '参数无效', 400);
    return errorResponse('更新失败', 500);
  }
};

const handleDelete = async (request: NextRequest, user: JWTPayload) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop()!;
  try {
    await prisma.laboratory.delete({ where: { id } });
    await prisma.auditLog.create({
      data: { userId: user.userId, action: 'ADMIN_DELETE_LAB', entity: 'Laboratory', entityId: id },
    });
    return successResponse({ id });
  } catch (error: any) {
    if (error?.code === 'P2003') {
      return errorResponse('该实验室已有关联数据，无法删除', 400);
    }
    return errorResponse('删除失败', 500);
  }
};

export const GET = withAuth(handleGet, ['SUPER_ADMIN']);
export const PUT = withAuth(handlePut, ['SUPER_ADMIN']);
export const PATCH = withAuth(handlePatch, ['SUPER_ADMIN']);
export const DELETE = withAuth(handleDelete, ['SUPER_ADMIN']);
