import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    const { id } = await params;

    // Get user's company
    const membership = await prisma.companyMembership.findUnique({
      where: { userId: user.userId },
    });

    if (!membership) return errorResponse('您不属于任何企业', 403);

    // Only owners/admins can revoke
    if (!['owner', 'admin'].includes(membership.role)) {
      return errorResponse('权限不足', 403);
    }

    // Delete invitation
    await prisma.session.delete({ where: { id } });

    return successResponse({ message: '邀请已撤销' });
  } catch (error) {
    console.error('Revoke invitation error:', error);
    return errorResponse('撤销邀请失败', 500);
  }
}
