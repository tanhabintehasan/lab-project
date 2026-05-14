# Base Admin API Foundation

## Overview

This document describes the reusable, data-driven CRUD foundation for all admin API routes. It eliminates duplicated boilerplate across admin modules by providing standardized factories for list, get, create, update, delete, and toggle operations.

All admin routes **must** use this foundation to maintain a **100% consistent JSON response structure**.

## Single Import Point

Every admin route imports from **one file only**:

```typescript
import { withAdminApi, apiSuccess, apiError, apiPaginated, createAdminListHandler, ... } from '@/lib/admin-api';
```

`@/lib/admin-api` re-exports everything you need:
- `withAdminApi` — auth + CSRF + standardized error wrapper
- `createAdminListHandler` / `createAdminGetHandler` / `createAdminCreateHandler` / `createAdminUpdateHandler` / `createAdminDeleteHandler` / `createAdminToggleHandler` — CRUD factories
- `createAdminCrudModule` — bundles all factories for full-CRUD routes
- `apiSuccess` / `apiError` / `apiPaginated` / `apiUnauthorized` / `apiForbidden` / `apiNotFound` / `apiValidationError` / `apiConflict` / `apiServerError` — response helpers
- `logAdminAudit` — audit logging
- `getRouteId` — route param extraction

## Files

| File | Purpose |
|------|---------|
| `src/types/admin-api.ts` | TypeScript interfaces and types |
| `src/lib/api-response.ts` | Standardized response envelope (`apiSuccess`, `apiError`, etc.) |
| `src/lib/admin-api.ts` | **Single import point** — factories, wrappers, re-exports |
| `src/lib/prisma-soft-delete.ts` | Global soft-delete extension |
| `src/lib/db.ts` | Prisma client with soft-delete extension applied |

---

## Pattern A — Full CRUD with Factories (Recommended)

For standard list/get/create/update/delete routes, use the factory functions.

### `route.ts` (List + Create)

```typescript
import { prisma } from '@/lib/db';
import {
  withAdminApi,
  createAdminListHandler,
  createAdminCreateHandler,
} from '@/lib/admin-api';
import { myCreateSchema } from '@/lib/validations';

export const GET = withAdminApi(
  createAdminListHandler({
    prismaModel: prisma.myModel,
    searchFields: ['nameZh', 'nameEn'],
    include: { relatedModel: true },
    orderBy: { createdAt: 'desc' },
  }),
  { roles: ['SUPER_ADMIN'] }
);

export const POST = withAdminApi(
  createAdminCreateHandler({
    prismaModel: prisma.myModel,
    schema: myCreateSchema,
    transform: (data) => ({
      ...data,
      slug: data.slug || generateSlug(data.nameZh),
    }),
    include: { relatedModel: true },
    auditAction: 'ADMIN_CREATE_MY_MODEL',
    entityName: 'MyModel',
  }),
  { roles: ['SUPER_ADMIN'] }
);
```

### `[id]/route.ts` (Get + Update + Delete)

```typescript
import { prisma } from '@/lib/db';
import {
  withAdminApi,
  createAdminGetHandler,
  createAdminUpdateHandler,
  createAdminDeleteHandler,
} from '@/lib/admin-api';
import { myCreateSchema } from '@/lib/validations';

export const GET = withAdminApi(
  createAdminGetHandler({
    prismaModel: prisma.myModel,
    include: { relatedModel: true },
    notFoundMessage: '资源未找到',
  }),
  { roles: ['SUPER_ADMIN'] }
);

export const PUT = withAdminApi(
  createAdminUpdateHandler({
    prismaModel: prisma.myModel,
    schema: myCreateSchema,
    auditAction: 'ADMIN_UPDATE_MY_MODEL',
    entityName: 'MyModel',
    notFoundMessage: '资源未找到',
  }),
  { roles: ['SUPER_ADMIN'] }
);

export const DELETE = withAdminApi(
  createAdminDeleteHandler({
    prismaModel: prisma.myModel,
    auditAction: 'ADMIN_DELETE_MY_MODEL',
    entityName: 'MyModel',
    checkDependencies: async (id) => {
      const count = await prisma.relatedModel.count({ where: { myModelId: id } });
      return count > 0 ? '该资源已有关联数据，无法删除' : null;
    },
  }),
  { roles: ['SUPER_ADMIN'] }
);
```

---

## Pattern B — `createAdminCrudModule` (One-liner Config)

For routes that need the full CRUD suite with minimal code:

```typescript
import { prisma } from '@/lib/db';
import { withAdminApi, createAdminCrudModule } from '@/lib/admin-api';
import { mySchema } from '@/lib/validations';

const {
  listHandler,
  getHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} = createAdminCrudModule({
  prismaModel: prisma.equipment,
  createSchema: mySchema,
  searchFields: ['nameZh', 'nameEn', 'model'],
  include: { lab: { select: { id: true, nameZh: true } } },
  auditActions: {
    create: 'ADMIN_CREATE_EQUIPMENT',
    update: 'ADMIN_UPDATE_EQUIPMENT',
    delete: 'ADMIN_DELETE_EQUIPMENT',
  },
  entityName: 'Equipment',
  transformCreate: (data) => ({
    ...data,
    slug: data.slug || generateSlug(data.nameZh),
  }),
  checkDependencies: async (id) => {
    const bookings = await prisma.equipmentBooking.count({ where: { equipmentId: id } });
    return bookings > 0 ? '该设备已有关联预约记录，无法删除' : null;
  },
});

export const GET    = withAdminApi(listHandler,    { roles: ['SUPER_ADMIN'] });
export const POST   = withAdminApi(createHandler,  { roles: ['SUPER_ADMIN'] });
// In [id]/route.ts:
// export const GET    = withAdminApi(getHandler,    { roles: ['SUPER_ADMIN'] });
// export const PUT    = withAdminApi(updateHandler, { roles: ['SUPER_ADMIN'] });
// export const DELETE = withAdminApi(deleteHandler, { roles: ['SUPER_ADMIN'] });
```

---

## Pattern C — Custom Logic Routes

For routes with complex business logic that don't fit the generic factories:

```typescript
import { prisma } from '@/lib/db';
import { withAdminApi, apiSuccess, apiError, apiPaginated, logAdminAudit } from '@/lib/admin-api';
import { mySchema } from '@/lib/validations';
import { JWTPayload } from '@/lib/auth';

const handler = async (request: NextRequest, user: JWTPayload) => {
  // Zod validation errors are caught automatically by withAdminApi
  const body = await request.json();
  const data = mySchema.parse(body);

  // Custom business logic
  const exists = await prisma.model.findFirst({ where: { slug: data.slug } });
  if (exists) {
    return apiError('Slug 已存在', 409);
  }

  const item = await prisma.model.create({ data });

  await logAdminAudit({
    userId: user.userId,
    action: 'ADMIN_CREATE_MODEL',
    entity: 'Model',
    entityId: item.id,
  });

  return apiSuccess(item, 201);
};

export const POST = withAdminApi(handler, { roles: ['SUPER_ADMIN'] });
```

**Rules for custom routes:**
1. Always wrap with `withAdminApi` (never `withAuth`)
2. Use `apiSuccess` / `apiError` / `apiPaginated` for responses
3. Use `logAdminAudit` for mutations
4. Do NOT wrap in manual `try/catch` for Zod or Prisma errors — `withAdminApi` handles them
5. Only use `try/catch` if you need to catch and re-throw with a different message

---

## API Reference

### `withAdminApi(handler, options)`

Wraps any route handler with:
- **Authentication** via JWT cookie or Bearer token
- **Role authorization** (`SUPER_ADMIN` bypasses all restrictions)
- **CSRF validation** for `POST`, `PUT`, `PATCH`, `DELETE` (disable with `requireCsrf: false`)
- **Centralized error handling** with standardized error envelope

```typescript
withAdminApi(handler, {
  roles: ['SUPER_ADMIN', 'FINANCE_ADMIN'],
  requireCsrf?: boolean, // default: true
})
```

### `createAdminCrudModule(config)`

Bundles all standard CRUD handlers from a single configuration object.

| Config | Type | Description |
|--------|------|-------------|
| `prismaModel` | Prisma delegate | e.g. `prisma.equipment` |
| `createSchema` | `ZodSchema` | Validation schema for create/update |
| `updateSchema` | `ZodSchema` | Optional separate schema for updates |
| `searchFields` | `string[]` | Fields to search with `?q=...` |
| `include` | `object` | Prisma `include` object |
| `orderBy` | `object` | Default ordering |
| `auditActions` | `{ create, update, delete }` | Action names for audit log |
| `entityName` | `string` | Entity name for audit log |
| `transformCreate` | `(data, user) => data` | Transform before Prisma create |
| `transformUpdate` | `(data, existing, user) => data` | Transform before Prisma update |
| `checkDependencies` | `(id) => Promise<string \| null>` | Pre-delete dependency check |
| `identifyBy` | `'id' \| 'slug' \| 'id-or-slug'` | How to look up the resource |

### Factory Functions

See the full factory documentation in earlier sections of this doc.

---

## Response Format

All admin routes now return the **same standardized envelope**:

**Success**
```json
{
  "success": true,
  "data": { ... },
  "meta": { "timestamp": "2026-05-12T12:00:00.000Z" }
}
```

**Error**
```json
{
  "success": false,
  "error": "请求参数错误",
  "code": "VALIDATION_ERROR",
  "status": 400,
  "details": { "email": ["Invalid format"] },
  "meta": { "timestamp": "2026-05-12T12:00:00.000Z" }
}
```

**Paginated**
```json
{
  "success": true,
  "data": [...],
  "total": 100,
  "page": 1,
  "pageSize": 20,
  "totalPages": 5,
  "meta": { "timestamp": "2026-05-12T12:00:00.000Z" }
}
```

---

## Migration Checklist

The following routes have **already been migrated** to the new foundation:

- ✅ `src/app/api/admin/equipment/*`
- ✅ `src/app/api/admin/labs/*`
- ✅ `src/app/api/admin/users/*`
- ✅ `src/app/api/admin/activities/*`
- ✅ `src/app/api/admin/site-settings/*`
- ✅ `src/app/api/admin/service-categories/*`

**Remaining routes to migrate** (use Pattern A, B, or C above):

- ⬜ `src/app/api/admin/services/*` — complex custom fields logic
- ⬜ `src/app/api/admin/bookings/*`
- ⬜ `src/app/api/admin/cms/*`
- ⬜ `src/app/api/admin/finance/*`
- ⬜ `src/app/api/admin/integrations/*`
- ⬜ `src/app/api/admin/payment-providers/*`
- ⬜ `src/app/api/admin/referrals/*`
- ⬜ `src/app/api/admin/stats/*`
- ⬜ `src/app/api/admin/transactions/*`
- ⬜ `src/app/api/admin/translations/*`
- ⬜ `src/app/api/admin/upload/qr-code/*`
- ⬜ `src/app/api/admin/webhook-logs/*`

**Migration steps for each route:**
1. Replace `import { withAuth, successResponse, errorResponse, paginatedResponse } from '@/lib/api-helpers'` with `import { withAdminApi, apiSuccess, apiError, apiPaginated, ... } from '@/lib/admin-api'`
2. Replace `withAuth(handler, roles)` with `withAdminApi(handler, { roles })`
3. Replace `successResponse(data)` → `apiSuccess(data)`
4. Replace `errorResponse(msg, status)` → `apiError(msg, status)`
5. Replace `paginatedResponse(data, total, page, pageSize)` → `apiPaginated(data, total, page, pageSize)`
6. Remove manual `try/catch` blocks around Zod/Prisma errors (handled by `withAdminApi`)
7. For mutations, add `logAdminAudit({ userId: user.userId, action: '...', entity: '...', entityId: '...' })`

---

## Soft Deletes

All admin-managed models support **global soft delete** via a Prisma Client Extension.

### Behavior

| Operation | Behavior |
|-----------|----------|
| `findMany`, `findFirst`, `findUnique`, `count`, `aggregate`, `groupBy` | Automatically filters `deletedAt: null` |
| `delete()` | Converts to `update({ data: { deletedAt: new Date() } })` for configured models |
| `softDelete()` | Explicit soft delete helper (same as intercepted `delete`) |
| `restore()` | Sets `deletedAt: null` to undelete a record |

### Escape Hatch

To query deleted records (e.g., admin trash/bin), explicitly include `deletedAt` in the `where` clause:

```typescript
// List only deleted users
prisma.user.findMany({ where: { deletedAt: { not: null } } });

// Include deleted records in a search
prisma.testingService.findMany({
  where: {
    deletedAt: { not: null },
    nameZh: { contains: 'test' },
  },
});
```

When `deletedAt` is explicitly provided in `where`, the extension **does not** inject `deletedAt: null`.

### Models with Soft Delete

- `User`
- `ServiceCategory`
- `TestingService`
- `Order`
- `Sample`
- `Report`
- `Laboratory`
- `Equipment`
- `SiteSetting`
- `CMSPage`
- `Translation`

### Files

| File | Purpose |
|------|---------|
| `src/lib/prisma-soft-delete.ts` | Extension definition (`SOFT_DELETE_MODELS`, `createSoftDeleteExtension`) |
| `src/lib/db.ts` | Applies the extension to the Prisma client |

### Migration Notes

When soft-deleting a record with unique fields (e.g., `slug`), the unique constraint still applies because the row still exists in the database. If you need to allow re-creating a record with the same slug after deletion, consider:

1. Appending a deleted suffix on soft delete (e.g., `slug = \`${slug}--deleted--${Date.now()}\``)
2. Using a composite unique index on `(slug, deletedAt)`

This is not handled automatically — implement in your `transform` function if needed.
