/**
 * Prisma Client Extension — Global Soft Delete
 *
 * Automatically filters out soft-deleted records (deletedAt !== null)
 * from all read queries. Overrides `delete()` to perform soft deletes
 * for configured models. Provides `softDelete()` and `restore()` helpers.
 *
 * Escape hatch: explicitly pass `deletedAt` in `where` to bypass filtering.
 */

import { Prisma, PrismaClient } from '@prisma/client';

// ─── Configuration ───────────────────────────────────────────

export const SOFT_DELETE_MODELS = new Set([
  'User',
  'ServiceCategory',
  'TestingService',
  'Order',
  'Sample',
  'Report',
  'Laboratory',
  'Equipment',
  'SiteSetting',
  'CMSPage',
  'Translation',
]);

export function hasSoftDelete(model: string): boolean {
  return SOFT_DELETE_MODELS.has(model);
}

// ─── Internal Helpers ────────────────────────────────────────

function withDeletedAtFilter(args: any): any {
  if (!args) args = {};
  if (!args.where) args.where = {};
  // Escape hatch: if caller explicitly queries deletedAt, respect it
  if (args.where.deletedAt === undefined) {
    args.where.deletedAt = null;
  }
  return args;
}

// ─── Extension Factory ───────────────────────────────────────

export function createSoftDeleteExtension(baseClient: PrismaClient) {
  return Prisma.defineExtension({
    name: 'softDelete',
    model: {
      $allModels: {
        /**
         * Perform a soft delete by setting deletedAt = now().
         * Prefer this over `.delete()` for soft-delete-enabled models.
         */
        async softDelete<T>(
          this: T,
          args: Prisma.Args<T, 'delete'>
        ): Promise<any> {
          const context = Prisma.getExtensionContext(this);
          return (context as any).update({
            where: args.where,
            data: { deletedAt: new Date() },
          });
        },

        /**
         * Restore a soft-deleted record by setting deletedAt = null.
         */
        async restore<T>(
          this: T,
          where: Prisma.Args<T, 'update'>['where']
        ): Promise<any> {
          const context = Prisma.getExtensionContext(this);
          return (context as any).update({
            where,
            data: { deletedAt: null },
          });
        },

        /**
         * Intercept `delete()` — convert to soft delete for configured models.
         * Non-soft-delete models fall through to the base client hard delete.
         */
        async delete<T>(
          this: T,
          args: Prisma.Args<T, 'delete'>
        ): Promise<any> {
          const context = Prisma.getExtensionContext(this);
          const modelName = (context as any).$name as string;

          if (hasSoftDelete(modelName)) {
            return (context as any).update({
              where: args.where,
              data: { deletedAt: new Date() },
            });
          }

          // Hard delete for models without soft-delete support
          return (baseClient as any)[modelName].delete(args);
        },
      },
    },
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (hasSoftDelete(model)) {
            args = withDeletedAtFilter(args);
          }
          return query(args);
        },
        async findFirst({ model, args, query }) {
          if (hasSoftDelete(model)) {
            args = withDeletedAtFilter(args);
          }
          return query(args);
        },
        async findFirstOrThrow({ model, args, query }) {
          if (hasSoftDelete(model)) {
            args = withDeletedAtFilter(args);
          }
          return query(args);
        },
        async findUnique({ model, args, query }) {
          if (hasSoftDelete(model)) {
            args = withDeletedAtFilter(args);
          }
          return query(args);
        },
        async findUniqueOrThrow({ model, args, query }) {
          if (hasSoftDelete(model)) {
            args = withDeletedAtFilter(args);
          }
          return query(args);
        },
        async count({ model, args, query }) {
          if (hasSoftDelete(model)) {
            args = withDeletedAtFilter(args);
          }
          return query(args);
        },
        async aggregate({ model, args, query }) {
          if (hasSoftDelete(model)) {
            args = withDeletedAtFilter(args);
          }
          return query(args);
        },
        async groupBy({ model, args, query }) {
          if (hasSoftDelete(model)) {
            args = withDeletedAtFilter(args);
          }
          return query(args);
        },
      },
    },
  });
}
