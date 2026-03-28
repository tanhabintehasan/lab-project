import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers';
import { JWTPayload } from '@/lib/auth';

const actionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
});

const handler = async (request: NextRequest, user: JWTPayload) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    const body = await request.json();
    const data = actionSchema.parse(body);

    // Get user's company
    const membership = await prisma.companyMembership.findUnique({
      where: { userId: user.userId },
    });

    if (!membership) return errorResponse('您不属于任何企业', 403);

    // Only admins/owners can approve
    if (!['owner', 'admin'].includes(membership.role)) {
      return errorResponse('权限不足', 403);
    }

    // In a real implementation, you would:
    // 1. Find the approval request
    // 2. Update its status
    // 3. Trigger the appropriate workflow (e.g., process order, release payment)
    // 4. Create notifications

    // Mock response
    return successResponse({ message: `审批${data.action === 'approve' ? '已通过' : '已拒绝'}` });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '参数无效', 400);
    }
    console.error('Approval action error:', error);
    return errorResponse('处理审批失败', 500);
  }
};

import { withAuth } from '@/lib/api-helpers';
export const PATCH = withAuth(handler, ['ENTERPRISE_MEMBER']);
