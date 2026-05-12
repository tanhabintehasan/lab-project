import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers';
import { hashPassword, createToken, buildSessionCookie } from '@/lib/auth';

const acceptSchema = z.object({
  // If user already exists, they just accept
  // If new user, they must provide password
  password: z.string().min(8).optional(),
  name: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const body = await request.json();
    const data = acceptSchema.parse(body);

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
    const { email, role, companyId, name: invitedName } = metadata;

    // Check if user exists
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Create new user
      if (!data.password) {
        return errorResponse('新用户必须设置密码', 400);
      }

      const passwordHash = await hashPassword(data.password);
      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: data.name || invitedName || email.split('@')[0],
          role: 'ENTERPRISE_MEMBER',
          status: 'ACTIVE',
          emailVerified: true,
        },
      });

      // Create wallet
      await prisma.wallet.create({
        data: { userId: user.id },
      });
    } else {
      // Existing user - update role if needed
      if (user.role === 'CUSTOMER' || user.role === 'VISITOR') {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'ENTERPRISE_MEMBER' },
        });
      }
    }

    // Add to company
    await prisma.companyMembership.create({
      data: {
        userId: user.id,
        companyId,
        role,
      },
    });

    // Delete invitation token
    await prisma.session.delete({ where: { id: invitation.id } });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'SYSTEM',
        titleZh: '欢迎加入企业',
        titleEn: 'Welcome to the Company',
        contentZh: `您已成功加入 ${metadata.companyName}`,
        contentEn: `You have successfully joined ${metadata.companyName}`,
        link: '/enterprise/workspace',
      },
    });

    // Create session for login
    const sessionToken = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: '',
    });

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // Update token with sessionId
    const finalToken = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    });

    await prisma.session.update({
      where: { id: session.id },
      data: { token: finalToken },
    });

    return new Response(
      JSON.stringify({ success: true, message: '成功加入企业' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': buildSessionCookie(finalToken),
        },
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '参数无效', 400);
    }
    console.error('Accept invitation error:', error);
    return errorResponse('接受邀请失败', 500);
  }
}
