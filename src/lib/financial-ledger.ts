/**
 * Financial Ledger Service
 *
 * Core math and persistence logic for the platform's lab vendor earnings system.
 *
 * Concepts:
 * - Gross Amount: total order revenue allocated to a lab
 * - Platform Fee: platform commission = Gross * feeRate
 * - Net Payout: what the lab actually earns = Gross - Platform Fee
 *
 * All monetary values use Prisma.Decimal to avoid floating-point errors.
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

const DEFAULT_FEE_RATE = new Prisma.Decimal(0.15);

export interface PayoutBreakdown {
  grossAmount: Prisma.Decimal;
  platformFee: Prisma.Decimal;
  netAmount: Prisma.Decimal;
  feeRate: Prisma.Decimal;
}

export interface LabWalletSummary {
  labId: string;
  balance: Prisma.Decimal;
  frozenAmount: Prisma.Decimal;
  availableBalance: Prisma.Decimal;
  totalEarned: Prisma.Decimal;
  totalWithdrawn: Prisma.Decimal;
  currency: string;
}

/**
 * Calculate payout breakdown from gross amount and fee rate.
 */
export function calculatePayout(
  grossAmount: Prisma.Decimal | number | string,
  feeRate?: Prisma.Decimal | number | string
): PayoutBreakdown {
  const gross = new Prisma.Decimal(grossAmount);
  const rate = feeRate !== undefined ? new Prisma.Decimal(feeRate) : DEFAULT_FEE_RATE;
  const platformFee = gross.mul(rate);
  const netAmount = gross.sub(platformFee);

  return {
    grossAmount: gross,
    platformFee,
    netAmount,
    feeRate: rate,
  };
}

/**
 * Get the current platform fee rate from SiteSetting.
 * Falls back to DEFAULT_FEE_RATE if no setting exists.
 */
export async function getPlatformFeeRate(): Promise<Prisma.Decimal> {
  try {
    const setting = await (prisma as any).siteSetting.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { platformFeeRate: true },
    });
    if (setting?.platformFeeRate != null) {
      return new Prisma.Decimal(setting.platformFeeRate);
    }
  } catch {
    // Schema may not be synced yet; fall back gracefully
  }
  return DEFAULT_FEE_RATE;
}

/**
 * Get or create a LabWallet for a given laboratory.
 */
export async function getOrCreateLabWallet(labId: string) {
  let wallet = await (prisma as any).labWallet.findUnique({
    where: { labId },
  });

  if (!wallet) {
    wallet = await (prisma as any).labWallet.create({
      data: { labId },
    });
  }

  return wallet;
}

/**
 * Record a payout transaction when an order is completed.
 * Credits the lab's wallet with the net amount after platform fee.
 *
 * Idempotent: if a payout already exists for this order + lab, returns existing.
 */
export async function recordLabPayout(
  orderId: string,
  labId: string,
  grossAmount: Prisma.Decimal | number | string,
  options?: {
    feeRate?: Prisma.Decimal | number | string;
    description?: string;
    referenceType?: string;
    referenceId?: string;
  }
): Promise<{ transaction: any; wallet: any; breakdown: PayoutBreakdown }> {
  const feeRate = options?.feeRate ?? (await getPlatformFeeRate());
  const breakdown = calculatePayout(grossAmount, feeRate);

  return await (prisma as any).$transaction(async (tx: any) => {
    // Idempotency check
    const existing = await tx.transaction.findFirst({
      where: {
        labWallet: { labId },
        type: 'PAYOUT',
        referenceType: options?.referenceType || 'order',
        referenceId: options?.referenceId || orderId,
      },
    });

    if (existing) {
      const wallet = await tx.labWallet.findUnique({ where: { labId } });
      return { transaction: existing, wallet, breakdown };
    }

    const wallet = await getOrCreateLabWalletTx(tx, labId);

    const newBalance = new Prisma.Decimal(wallet.balance).add(breakdown.netAmount);
    const newTotalEarned = new Prisma.Decimal(wallet.totalEarned).add(breakdown.netAmount);

    const transaction = await tx.transaction.create({
      data: {
        labWalletId: wallet.id,
        type: 'PAYOUT',
        amount: breakdown.netAmount,
        balanceAfter: newBalance,
        description:
          options?.description ||
          `订单收益 ¥${breakdown.grossAmount.toString()} (平台服务费 ¥${breakdown.platformFee.toString()})`,
        referenceType: options?.referenceType || 'order',
        referenceId: options?.referenceId || orderId,
        grossAmount: breakdown.grossAmount,
        platformFee: breakdown.platformFee,
        netAmount: breakdown.netAmount,
        feeRate: breakdown.feeRate,
      },
    });

    const updatedWallet = await tx.labWallet.update({
      where: { id: wallet.id },
      data: {
        balance: newBalance,
        totalEarned: newTotalEarned,
      },
    });

    return { transaction, wallet: updatedWallet, breakdown };
  });
}

async function getOrCreateLabWalletTx(tx: any, labId: string) {
  let wallet = await tx.labWallet.findUnique({ where: { labId } });
  if (!wallet) {
    wallet = await tx.labWallet.create({ data: { labId } });
  }
  return wallet;
}

/**
 * Get a lab's wallet summary with computed available balance.
 */
export async function getLabWalletSummary(labId: string): Promise<LabWalletSummary | null> {
  const wallet = await (prisma as any).labWallet.findUnique({
    where: { labId },
  });

  if (!wallet) return null;

  return {
    labId: wallet.labId,
    balance: new Prisma.Decimal(wallet.balance),
    frozenAmount: new Prisma.Decimal(wallet.frozenAmount),
    availableBalance: new Prisma.Decimal(wallet.balance).sub(wallet.frozenAmount),
    totalEarned: new Prisma.Decimal(wallet.totalEarned),
    totalWithdrawn: new Prisma.Decimal(wallet.totalWithdrawn),
    currency: wallet.currency,
  };
}

/**
 * Get paginated transaction history for a lab wallet.
 */
export async function getLabTransactions(
  labId: string,
  options?: { page?: number; pageSize?: number }
) {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const wallet = await (prisma as any).labWallet.findUnique({
    where: { labId },
    select: { id: true },
  });

  if (!wallet) {
    return { transactions: [], total: 0, page, pageSize };
  }

  const [transactions, total] = await Promise.all([
    (prisma as any).transaction.findMany({
      where: { labWalletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    (prisma as any).transaction.count({
      where: { labWalletId: wallet.id },
    }),
  ]);

  return { transactions, total, page, pageSize };
}

/**
 * Platform-wide earnings summary for admin dashboards.
 */
export async function getPlatformEarningsSummary() {
  const [labWalletsAgg, payoutsAgg] = await Promise.all([
    (prisma as any).labWallet.aggregate({
      _sum: { balance: true, totalEarned: true, totalWithdrawn: true },
      _count: { id: true },
    }),
    (prisma as any).transaction.aggregate({
      where: { type: 'PAYOUT' },
      _sum: { grossAmount: true, platformFee: true, netAmount: true, amount: true },
      _count: { id: true },
    }),
  ]);

  return {
    totalLabWallets: labWalletsAgg._count.id || 0,
    totalLabBalance: new Prisma.Decimal(labWalletsAgg._sum.balance ?? 0),
    totalLabEarned: new Prisma.Decimal(labWalletsAgg._sum.totalEarned ?? 0),
    totalLabWithdrawn: new Prisma.Decimal(labWalletsAgg._sum.totalWithdrawn ?? 0),
    totalPayouts: payoutsAgg._count.id || 0,
    totalGrossAmount: new Prisma.Decimal(payoutsAgg._sum.grossAmount ?? 0),
    totalPlatformFees: new Prisma.Decimal(payoutsAgg._sum.platformFee ?? 0),
    totalNetPaid: new Prisma.Decimal(payoutsAgg._sum.netAmount ?? 0),
  };
}

/**
 * Get all lab wallets with their summaries (for admin listing).
 */
export async function getAllLabWallets(
  options?: { page?: number; pageSize?: number }
) {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const [wallets, total] = await Promise.all([
    (prisma as any).labWallet.findMany({
      skip,
      take: pageSize,
      include: {
        lab: { select: { nameZh: true, nameEn: true, slug: true, status: true } },
        _count: { select: { transactions: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    (prisma as any).labWallet.count(),
  ]);

  return { wallets, total, page, pageSize };
}

/**
 * Record a lab withdrawal (payout to bank / external transfer).
 * Deducts from lab wallet balance and creates a WITHDRAWAL transaction.
 */
export async function recordLabWithdrawal(
  labId: string,
  amount: Prisma.Decimal | number | string,
  options?: {
    method?: string;
    accountInfo?: Record<string, any>;
    description?: string;
    referenceId?: string;
  }
) {
  const withdrawalAmount = new Prisma.Decimal(amount);

  return await (prisma as any).$transaction(async (tx: any) => {
    const wallet = await tx.labWallet.findUnique({ where: { labId } });
    if (!wallet) {
      throw new Error('Lab wallet not found');
    }

    const currentBalance = new Prisma.Decimal(wallet.balance);
    if (currentBalance.lessThan(withdrawalAmount)) {
      throw new Error('Insufficient balance');
    }

    const newBalance = currentBalance.sub(withdrawalAmount);
    const newTotalWithdrawn = new Prisma.Decimal(wallet.totalWithdrawn).add(withdrawalAmount);

    const transaction = await tx.transaction.create({
      data: {
        labWalletId: wallet.id,
        type: 'WITHDRAWAL',
        amount: withdrawalAmount.neg(),
        balanceAfter: newBalance,
        description: options?.description || `提现 ¥${withdrawalAmount.toString()}`,
        referenceType: 'lab_withdrawal',
        referenceId: options?.referenceId || undefined,
      },
    });

    const updatedWallet = await tx.labWallet.update({
      where: { id: wallet.id },
      data: {
        balance: newBalance,
        totalWithdrawn: newTotalWithdrawn,
      },
    });

    return { transaction, wallet: updatedWallet };
  });
}
