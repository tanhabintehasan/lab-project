import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getAuthUser, successResponse, errorResponse } from '@/lib/api-helpers';

const rewardConfigSchema = z.object({
  registrationReward: z.number().min(0).optional(),
  commissionRate: z.number().min(0).max(1).optional(),
  minWithdrawalAmount: z.number().min(0).optional(),
  frozenDays: z.number().int().min(0).optional(),
  maxTiers: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
});

function toNumber(value: unknown) {
  if (value === null || value === undefined) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function getRoleFlags(role?: string) {
  const isAdmin = role === 'SUPER_ADMIN';
  return { isAdmin };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user) {
      return errorResponse('未授权访问', 401);
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'dashboard';
    const { isAdmin } = getRoleFlags(user.role);

    if (scope === 'admin') {
      if (!isAdmin) {
        return errorResponse('权限不足', 403);
      }

      const [config, referralCount, commissionCount, referralStats, recentCommissions] =
        await Promise.all([
          prisma.referralConfig.findFirst(),
          prisma.referral.count(),
          prisma.commission.count(),
          prisma.commission.aggregate({
            _sum: {
              amount: true,
            },
          }),
          prisma.commission.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
              referral: {
                include: {
                  referrerUser: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                  referredUser: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          }),
        ]);

      return successResponse({
        config: config || null,
        overview: {
          referralCount,
          commissionCount,
          totalCommissionAmount: toNumber(referralStats._sum.amount),
        },
        recentCommissions: recentCommissions.map((item) => ({
          id: item.id,
          amount: toNumber(item.amount),
          rate: toNumber(item.rate),
          status: item.status,
          releasedAt: item.releasedAt,
          createdAt: item.createdAt,
          referral: {
            id: item.referral?.id,
            status: item.referral?.status,
            referrerUser: item.referral?.referrerUser || null,
            referredUser: item.referral?.referredUser || null,
          },
          orderId: item.orderId,
        })),
      });
    }

    const [referralCode, referralConfig, referrals, commissions, wallet] = await Promise.all([
      prisma.referralCode.findUnique({
        where: { userId: user.userId },
      }),
      prisma.referralConfig.findFirst({
        where: { isActive: true },
      }),
      prisma.referral.findMany({
        where: {
          referrerUserId: user.userId,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          referredUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.commission.findMany({
        where: {
          referral: {
            referrerUserId: user.userId,
          },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          referral: {
            include: {
              referredUser: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      prisma.wallet.findUnique({
        where: {
          userId: user.userId,
        },
      }),
    ]);

    const summary = {
      referralCount: referrals.length,
      registeredReferralCount: referrals.filter((item) => item.status === 'registered').length,
      qualifiedReferralCount: referrals.filter((item) => item.status === 'qualified').length,
      rewardedReferralCount: referrals.filter((item) => item.status === 'rewarded').length,
      totalCommissionAmount: commissions.reduce((sum, item) => sum + toNumber(item.amount), 0),
      releasedCommissionAmount: commissions
        .filter((item) => ['released', 'paid'].includes(item.status))
        .reduce((sum, item) => sum + toNumber(item.amount), 0),
      pendingCommissionAmount: commissions
        .filter((item) => ['pending', 'frozen'].includes(item.status))
        .reduce((sum, item) => sum + toNumber(item.amount), 0),
      walletBalance: toNumber(wallet?.balance),
    };

    return successResponse({
      referralCode: referralCode || null,
      config: referralConfig || null,
      summary,
      referrals: referrals.map((item) => ({
        id: item.id,
        status: item.status,
        createdAt: item.createdAt,
        referredUser: item.referredUser || null,
      })),
      commissions: commissions.map((item) => ({
        id: item.id,
        amount: toNumber(item.amount),
        rate: toNumber(item.rate),
        status: item.status,
        releasedAt: item.releasedAt,
        createdAt: item.createdAt,
        orderId: item.orderId,
        referral: {
          id: item.referral?.id,
          status: item.referral?.status,
          referredUser: item.referral?.referredUser || null,
        },
      })),
    });
  } catch (error) {
    console.error('Rewards GET error:', error);
    return errorResponse('获取奖励数据失败', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user) {
      return errorResponse('未授权访问', 401);
    }

    if (user.role !== 'SUPER_ADMIN') {
      return errorResponse('权限不足', 403);
    }

    const body = await request.json();
    const data = rewardConfigSchema.parse(body);

    const existing = await prisma.referralConfig.findFirst();

    let config;

    if (existing) {
      config = await prisma.referralConfig.update({
        where: { id: existing.id },
        data: {
          ...(data.registrationReward !== undefined
            ? { registrationReward: data.registrationReward }
            : {}),
          ...(data.commissionRate !== undefined ? { commissionRate: data.commissionRate } : {}),
          ...(data.minWithdrawalAmount !== undefined
            ? { minWithdrawalAmount: data.minWithdrawalAmount }
            : {}),
          ...(data.frozenDays !== undefined ? { frozenDays: data.frozenDays } : {}),
          ...(data.maxTiers !== undefined ? { maxTiers: data.maxTiers } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        },
      });
    } else {
      config = await prisma.referralConfig.create({
        data: {
          registrationReward: data.registrationReward ?? 0,
          commissionRate: data.commissionRate ?? 0.05,
          minWithdrawalAmount: data.minWithdrawalAmount ?? 100,
          frozenDays: data.frozenDays ?? 30,
          maxTiers: data.maxTiers ?? 1,
          isActive: data.isActive ?? true,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'ADMIN_UPDATE_REWARD_CONFIG',
        entity: 'ReferralConfig',
        entityId: config.id,
        details: data,
      },
    });

    return successResponse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '参数无效', 400);
    }

    console.error('Rewards POST error:', error);
    return errorResponse('保存奖励配置失败', 500);
  }
}