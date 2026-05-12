import { NextRequest } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, getAuthUser, getPaginationParams } from '@/lib/api-helpers';
import { sendEmail } from '@/lib/email';
import { enterpriseInviteEmail } from '@/lib/email-templates';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['owner', 'admin', 'member']).default('member'),
  name: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    // Get user's company
    const membership = await prisma.companyMembership.findUnique({
      where: { userId: user.userId },
      include: { company: true },
    });

    if (!membership) return errorResponse('您不属于任何企业', 403);

    // Only owners/admins can view invitations
    if (!['owner', 'admin'].includes(membership.role)) {
      return errorResponse('权限不足', 403);
    }

    const { page, pageSize, skip } = getPaginationParams(request);

    // Find pending invitations using Session table with special marker
    const [invitations, total] = await Promise.all([
      prisma.session.findMany({
        where: {
          userAgent: `enterprise-invite:${membership.companyId}`,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.session.count({
        where: {
          userAgent: `enterprise-invite:${membership.companyId}`,
          expiresAt: { gt: new Date() },
        },
      }),
    ]);

    // Parse metadata from ipAddress field (we store JSON there for invites)
    const mapped = invitations.map(inv => {
      const metadata = inv.ipAddress ? JSON.parse(inv.ipAddress) : {};
      return {
        id: inv.id,
        email: metadata.email || '',
        role: metadata.role || 'member',
        name: metadata.name || '',
        invitedBy: metadata.invitedBy || '',
        status: 'pending',
        expiresAt: inv.expiresAt.toISOString(),
        createdAt: inv.createdAt.toISOString(),
      };
    });

    return successResponse({
      data: mapped,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      total,
    });
  } catch (error) {
    console.error('Invitations fetch error:', error);
    return errorResponse('获取邀请列表失败', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    const body = await request.json();
    const data = inviteSchema.parse(body);

    // Get user's company
    const membership = await prisma.companyMembership.findUnique({
      where: { userId: user.userId },
      include: { company: true, user: true },
    });

    if (!membership) return errorResponse('您不属于任何企业', 403);

    // Only owners/admins can invite
    if (!['owner', 'admin'].includes(membership.role)) {
      return errorResponse('权限不足', 403);
    }

    // Check if email is already a member
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      const existingMembership = await prisma.companyMembership.findUnique({
        where: { userId: existingUser.id },
      });
      if (existingMembership) {
        return errorResponse('该用户已是企业成员', 400);
      }
    }

    // Check for existing pending invitation
    const existingInvite = await prisma.session.findFirst({
      where: {
        userAgent: `enterprise-invite:${membership.companyId}`,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      const metadata = existingInvite.ipAddress ? JSON.parse(existingInvite.ipAddress) : {};
      if (metadata.email === data.email) {
        return errorResponse('该邮箱已有待处理的邀请', 400);
      }
    }

    // Generate invitation token
    const inviteToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store invitation (using Session table with special marker)
    const metadata = {
      email: data.email,
      role: data.role,
      name: data.name || '',
      invitedBy: user.userId,
      inviterName: membership.user.name,
      companyId: membership.companyId,
      companyName: membership.company.name,
    };

    await prisma.session.create({
      data: {
        userId: user.userId,
        token: inviteToken,
        expiresAt,
        userAgent: `enterprise-invite:${membership.companyId}`,
        ipAddress: JSON.stringify(metadata),
      },
    });

    // Send invitation email
    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/accept-invite?token=${inviteToken}`;
    const emailContent = enterpriseInviteEmail({
      name: data.name || data.email,
      companyName: membership.company.name,
      inviterName: membership.user.name,
      inviteUrl,
      role: data.role,
    });

    await sendEmail({
      to: data.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    return successResponse({ message: '邀请已发送' }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '参数无效', 400);
    }
    console.error('Invitation create error:', error);
    return errorResponse('发送邀请失败', 500);
  }
}
