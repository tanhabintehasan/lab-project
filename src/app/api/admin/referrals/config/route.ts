import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { JWTPayload } from '@/lib/auth';
import { z } from 'zod';

const configSchema = z.object({
  registrationReward: z.number().nonnegative(),
  commissionRate: z.number().min(0).max(1),
  minWithdrawalAmount: z.number().positive(),
  frozenDays: z.number().int().nonnegative(),
});

const getHandler = async () => {
  try {
    const config = await prisma.referralConfig.findFirst();
    if (!config) {
      // Create default config
      const defaultConfig = await prisma.referralConfig.create({
        data: {
          registrationReward: 0,
          commissionRate: 0.05,
          minWithdrawalAmount: 100,
          frozenDays: 30,
          maxTiers: 1,
          isActive: true,
        },
      });
      return successResponse({
        registrationReward: Number(defaultConfig.registrationReward),
        commissionRate: Number(defaultConfig.commissionRate),
        minWithdrawalAmount: Number(defaultConfig.minWithdrawalAmount),
        frozenDays: defaultConfig.frozenDays,
      });
    }

    return successResponse({
      registrationReward: Number(config.registrationReward),
      commissionRate: Number(config.commissionRate),
      minWithdrawalAmount: Number(config.minWithdrawalAmount),
      frozenDays: config.frozenDays,
    });
  } catch (error) {
    console.error('Config fetch error:', error);
    return errorResponse('获取配置失败', 500);
  }
};

const postHandler = async (request: NextRequest, user: JWTPayload) => {
  try {
    const body = await request.json();
    const data = configSchema.parse(body);

    const config = await prisma.referralConfig.findFirst();
    if (config) {
      await prisma.referralConfig.update({
        where: { id: config.id },
        data: {
          registrationReward: data.registrationReward,
          commissionRate: data.commissionRate,
          minWithdrawalAmount: data.minWithdrawalAmount,
          frozenDays: data.frozenDays,
        },
      });
    } else {
      await prisma.referralConfig.create({
        data: {
          ...data,
          maxTiers: 1,
          isActive: true,
        },
      });
    }

    return successResponse({ message: '配置已更新' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '参数无效', 400);
    }
    console.error('Config save error:', error);
    return errorResponse('保存配置失败', 500);
  }
};

export const GET = withAuth(getHandler, ['SUPER_ADMIN', 'FINANCE_ADMIN']);
export const POST = withAuth(postHandler, ['SUPER_ADMIN']);
