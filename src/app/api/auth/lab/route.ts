import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { JWTPayload } from '@/lib/auth';

export const runtime = 'nodejs';

const handler = async (_request: NextRequest, user: JWTPayload) => {
  try {
    const labUser = await prisma.labUser.findUnique({
      where: { userId: user.userId },
      select: { labId: true, role: true },
    });

    return successResponse({
      hasLab: !!labUser,
      labId: labUser?.labId || null,
      role: labUser?.role || null,
    });
  } catch {
    return errorResponse('查询失败', 500);
  }
};

export const GET = withAuth(handler);
