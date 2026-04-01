/**
 * Audit Logging Service
 * Logs important admin and user actions for security and compliance
 */

import prisma from '@/lib/db';

export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'PASSWORD_RESET'
  | 'PAYMENT_CREATE'
  | 'PAYMENT_REFUND'
  | 'WEBHOOK_RECEIVED';

export type AuditEntity = 
  | 'PaymentProvider'
  | 'IntegrationSetting'
  | 'User'
  | 'Payment'
  | 'Order'
  | 'Session';

interface AuditLogData {
  userId?: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create audit log entry
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        details: data.details as any,
        ipAddress: data.ipAddress
      }
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging failure shouldn't break the main flow
  }
}

/**
 * Query audit logs
 */
export async function getAuditLogs(
  filters: {
    userId?: string;
    entity?: AuditEntity;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}
) {
  const { limit = 50, offset = 0, ...where } = filters;

  const conditions: any = {};

  if (where.userId) conditions.userId = where.userId;
  if (where.entity) conditions.entity = where.entity;
  if (where.action) conditions.action = where.action;
  if (where.startDate || where.endDate) {
    conditions.createdAt = {};
    if (where.startDate) conditions.createdAt.gte = where.startDate;
    if (where.endDate) conditions.createdAt.lte = where.endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: conditions,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    }),
    prisma.auditLog.count({ where: conditions })
  ]);

  return { logs, total };
}

/**
 * Clean up old audit logs (optional - run periodically)
 */
export async function cleanupOldAuditLogs(daysToKeep: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate
      }
    }
  });

  return result.count;
}
