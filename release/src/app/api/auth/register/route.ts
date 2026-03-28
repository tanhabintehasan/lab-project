import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashPassword, createToken, buildSessionCookie } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { registerSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const rlKey = getRateLimitKey(request, 'register');
  const rl = rateLimit(rlKey, 5, 60_000);
  if (!rl.ok) return errorResponse('请求过于频繁，请稍后再试', 429);

  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return errorResponse('该邮箱已注册', 409);

    const passwordHash = await hashPassword(data.password);

    // Determine role: if companyName provided, still CUSTOMER initially
    // Enterprise membership is separate from role
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        phone: data.phone,
        locale: data.locale,
        role: 'CUSTOMER',
      },
    });

    await prisma.wallet.create({ data: { userId: user.id } });

    if (data.companyName) {
      const company = await prisma.company.create({
        data: {
          name: data.companyName,
          contactPerson: data.name,
          contactEmail: data.email,
          contactPhone: data.phone,
        },
      });

      await prisma.companyMembership.create({
        data: { userId: user.id, companyId: company.id, role: 'owner' },
      });

      // Upgrade role to ENTERPRISE_MEMBER
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ENTERPRISE_MEMBER' },
      });
      user.role = 'ENTERPRISE_MEMBER';
    }

    // Create session
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: '',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    });

    await prisma.session.update({ where: { id: session.id }, data: { token } });

    await prisma.auditLog.create({
      data: { 
        userId: user.id, 
        action: 'REGISTER', 
        entity: 'User', 
        entityId: user.id,
        ipAddress: request.headers.get('x-forwarded-for') || undefined
      },
    });

    const response = successResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        locale: user.locale,
      },
    }, 201);

    response.headers.set('Set-Cookie', buildSessionCookie(token));
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '请求参数无效', 400);
    }
    console.error('Registration error:', error);
    return errorResponse('注册失败，请稍后重试', 500);
  }
}
