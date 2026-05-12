/**
 * Company-scoped data access helper functions
 * Use these to ensure enterprise members only see their company's data
 */

import { prisma } from './db';
import { JWTPayload } from './auth';

/**
 * Get user's company ID
 * Returns null if user is not part of any company
 */
export async function getUserCompanyId(userId: string): Promise<string | null> {
  const membership = await prisma.companyMembership.findUnique({
    where: { userId },
    select: { companyId: true },
  });
  return membership?.companyId || null;
}

/**
 * Get user's company membership with role
 */
export async function getUserCompanyMembership(userId: string) {
  return await prisma.companyMembership.findUnique({
    where: { userId },
    include: { company: true },
  });
}

/**
 * Check if user is company admin (owner or admin role)
 */
export async function isCompanyAdmin(userId: string): Promise<boolean> {
  const membership = await prisma.companyMembership.findUnique({
    where: { userId },
    select: { role: true },
  });
  return membership ? ['owner', 'admin'].includes(membership.role) : false;
}

/**
 * Apply company filter to Prisma where clause
 * For orders, reports, and other company-scoped resources
 */
export async function applyCompanyScope(
  user: JWTPayload,
  where: Record<string, unknown> = {}
): Promise<Record<string, unknown>> {
  // If user is enterprise member, filter by company
  if (user.role === 'ENTERPRISE_MEMBER') {
    const companyId = await getUserCompanyId(user.userId);
    if (companyId) {
      // For orders and similar: find all orders by company members
      const memberIds = await prisma.companyMembership
        .findMany({
          where: { companyId },
          select: { userId: true },
        })
        .then(members => members.map(m => m.userId));

      return {
        ...where,
        userId: { in: memberIds },
      };
    }
  }

  // For regular customers, only their own data
  if (user.role === 'CUSTOMER') {
    return {
      ...where,
      userId: user.userId,
    };
  }

  // Admins and lab partners see everything (or filtered by their own scope)
  return where;
}

/**
 * Check if user has access to a specific order
 */
export async function canAccessOrder(userId: string, orderId: string): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true },
  });

  if (!order) return false;

  // Order belongs to user
  if (order.userId === userId) return true;

  // Check if order belongs to company member
  const companyId = await getUserCompanyId(userId);
  if (companyId) {
    const orderOwnerMembership = await prisma.companyMembership.findUnique({
      where: { userId: order.userId },
      select: { companyId: true },
    });
    return orderOwnerMembership?.companyId === companyId;
  }

  return false;
}

/**
 * Check if user has access to a specific report
 */
export async function canAccessReport(userId: string, reportId: string): Promise<boolean> {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { order: { select: { userId: true } } },
  });

  if (!report) return false;

  return await canAccessOrder(userId, report.orderId);
}
