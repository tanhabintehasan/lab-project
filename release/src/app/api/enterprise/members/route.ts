import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, getAuthUser, getPaginationParams } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    // Get user's company
    const membership = await prisma.companyMembership.findUnique({
      where: { userId: user.userId },
    });

    if (!membership) return errorResponse('您不属于任何企业', 403);

    const { page, pageSize, skip } = getPaginationParams(request);

    const [members, total] = await Promise.all([
      prisma.companyMembership.findMany({
        where: { companyId: membership.companyId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              status: true,
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.companyMembership.count({ where: { companyId: membership.companyId } }),
    ]);

    const mapped = members.map(m => ({
      id: m.id,
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      avatar: m.user.avatar,
      role: m.role,
      status: m.user.status,
      joinedAt: m.joinedAt.toISOString(),
    }));

    return successResponse({
      data: mapped,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      total,
    });
  } catch (error) {
    console.error('Members fetch error:', error);
    return errorResponse('获取成员列表失败', 500);
  }
}
