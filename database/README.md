# Database Setup Guide

## Overview

This project uses **Prisma** with **PostgreSQL** (Supabase). The Prisma schema (`prisma/schema.prisma`) is the **single source of truth** for the data model.

**Critical rule:** Never edit the database directly via SQL. Always modify `prisma/schema.prisma` and use Prisma migrations.

---

## Folder Structure

```
database/
├── README.md              # This file
├── archive/               # Old manual SQL patches (historical reference only)
│   ├── 20260414_fix_cms_hybrid_schema.sql
│   ├── 20260415_add_logo_upload_url.sql
│   ├── 20260415_final_schema_cleanup.sql
│   ├── fix-service-category-schema.sql
│   ├── migrate-category-jsonb.sql
│   ├── migrate-financial-ledger.sql
│   ├── migrate-site-settings.sql
│   ├── migrate-user-browse-log.sql
│   └── verify-migration.sql
├── backups/               # Historical pg_dump snapshots (DO NOT RUN)
│   ├── data-2026-05-13.sql
│   └── schema-2026-05-13.sql
├── debug/                 # Debug logs, audit queries, investigation files
├── legacy/                # Hand-written DDL schemas (superseded by Prisma)
│   ├── 001_app_schema.sql
│   ├── 002_cms_schema.sql
│   ├── 003_indexes.sql
│   ├── 004_triggers.sql
│   └── supabase-schema.sql
└── seeds/                 # SQL seed files (for reference; prefer TS seeds)
    ├── 001_admin_seed.sql
    ├── 001_demo_seed.sql
    ├── 002_client_seed.sql
    └── 003_cms_seed.sql

prisma/
├── schema.prisma          # SOURCE OF TRUTH
├── seed.ts                # Primary seed orchestrator
├── seed-demo-login.ts     # Idempotent demo users for phone login
├── config.ts              # Prisma configuration
└── migrations/            # Prisma-native migration history
    └── ...
```

---

## Quick Start (Fresh Database)

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma Client
npx prisma generate

# 3. Push schema to database (creates tables, enums, indexes)
npx prisma db push

# 4. Run migrations (if any pending)
npx prisma migrate deploy

# 5. Seed the database
npm run db:seed

# 6. Start development
npm run dev
```

---

## Quick Start (Existing Database)

```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Check migration status
npx prisma migrate status

# 3. Deploy pending migrations
npx prisma migrate deploy

# 4. (Optional) Seed if database is empty
npm run db:seed
```

---

## Important Rules

1. **Prisma schema is the ONLY source of truth.**
   - Edit `prisma/schema.prisma` for any schema changes
   - Never run `ALTER TABLE` directly in Supabase SQL editor
   - Never edit files in `database/legacy/` or `database/archive/`

2. **Migrations must be created via Prisma CLI:**
   ```bash
   npx prisma migrate dev --name descriptive_name
   ```

3. **Seeds should be idempotent.**
   - Use `upsert` instead of `delete + create`
   - The primary seed (`prisma/seed.ts`) is safe to run multiple times

4. **SQL files in root are ignored by git.**
   - If you need to export a schema dump, place it in `database/backups/`
   - Backups are for disaster recovery only — do not run them as migrations

---

## Available Scripts

```bash
# Development
npm run dev              # Start Next.js dev server

# Database
npm run db:seed          # Run primary seed (idempotent)
npm run db:seed:labs     # Seed labs and equipment
npm run db:reset         # Reset database (destructive — dev only)

# Prisma
npx prisma generate      # Generate Prisma Client
npx prisma db push       # Push schema changes (dev)
npx prisma migrate dev   # Create and apply migration (dev)
npx prisma migrate deploy # Apply pending migrations (production)
npx prisma studio        # Open Prisma Studio GUI
npx prisma validate      # Validate schema syntax
npx prisma migrate status # Check migration status
```

---

## Phone Normalization Standard

All phone numbers are stored in **E.164 format** (`+<country_code><national_number>`).

- China: `+8613800138000` (not `13800138000`)
- The backend normalizes all phone inputs before DB queries
- Frontend provides a country code selector with China (`+86`) as default

---

## Demo Login Credentials

After running seeds:

- **Phone:** `+8613800000000` through `+8613800000007`
- **Password:** `demo123456`
- **Admin:** `admin@labtest.com` / `Admin@123456` (if admin seed is run)

---

## Troubleshooting

### `PrismaClientValidationError: Unknown field...`
Run `npx prisma generate` after any schema change.

### `P3005: Database error...`
The database schema may have drifted from Prisma. Run:
```bash
npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema prisma/schema.prisma --script > database/debug/drift.sql
```
Review `drift.sql` to identify differences, then fix `schema.prisma` and create a migration.

### Missing tables after `prisma db push`
Some models may have been added via migration but not pushed. Run:
```bash
npx prisma migrate deploy
```
