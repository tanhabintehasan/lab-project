import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, getAuthUser, getPaginationParams } from '@/lib/api-helpers';

// Note: This is a mock implementation. In production, you'd have a dedicated Approval table
// For now, we'll return mock data to demonstrate the UI
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    // Get user's company
    const membership = await prisma.companyMembership.findUnique({
      where: { userId: user.userId },
    });

    if (!membership) return errorResponse('您不属于任何企业', 403);

    // Only admins/owners can view approvals
    if (!['owner', 'admin'].includes(membership.role)) {
      return errorResponse('权限不足', 403);
    }

    const { page, pageSize } = getPaginationParams(request);

    // Mock data for demonstration
    const mockApprovals = [
      {
        id: '1',
        type: '订单审批',
        requestedBy: '张三',
        description: '申请采购检测服务',
        amount: 5000,
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    ];

    return successResponse({
      data: mockApprovals,
      page,
      pageSize,
      totalPages: 1,
      total: mockApprovals.length,
    });
  } catch (error) {
    console.error('Approvals fetch error:', error);
    return errorResponse('获取审批列表失败', 500);
  }
}
