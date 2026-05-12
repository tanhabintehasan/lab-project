import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;

    // Find invitation
    const invitation = await prisma.session.findUnique({
      where: { token },
    });

    if (!invitation || !invitation.userAgent?.startsWith('enterprise-invite:')) {
      return errorResponse('邀请不存在', 404);
    }

    if (invitation.expiresAt < new Date()) {
      return errorResponse('邀请已过期', 400);
    }

    // Parse metadata
    const metadata = invitation.ipAddress ? JSON.parse(invitation.ipAddress) : {};

    return successResponse({
      email: metadata.email,
      companyName: metadata.companyName,
      inviterName: metadata.inviterName,
      role: metadata.role,
      expiresAt: invitation.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Invitation fetch error:', error);
    return errorResponse('获取邀请信息失败', 500);
  }
}
