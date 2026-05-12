# Database Setup Guide

## Overview

This project uses **Prisma** with **PostgreSQL** (Supabase). The Prisma schema (`prisma/schema.prisma`) is the single source of truth for the data model.

## Quick Reference: Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | **Source of truth** for all tables, enums, indexes |
| `database/schema/supabase-schema.sql` | Complete generated SQL schema (for manual execution or reference) |
| `database/seeds/001_admin_seed.sql` | **Admin/internal only** — master admin user + referral config |
| `database/seeds/002_client_seed.sql` | **Client-safe** — sample service categories, testing services, labs |
| `database/seeds/003_cms_seed.sql` | **Client-safe** — CMS pages, homepage sections, site settings |
| `database/migrations/20260415_fix_schema_mismatch.sql` | One-stop patch for existing databases missing new tables/columns |

## Fresh Install (New Database)

For a completely new database, use Prisma's schema-driven workflow:

```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Push schema to database (creates tables, enums, indexes)
npx prisma db push

# 3. (Optional) Run migrations if any exist
npx prisma migrate dev
```

Then seed in this order:

```bash
# A. Admin / internal seed (contains login credentials)
npx prisma db execute --file database/seeds/001_admin_seed.sql

# B. Client catalog seed (demo services, categories, labs)
npx prisma db execute --file database/seeds/002_client_seed.sql

# C. CMS seed (homepage content, site settings, patent/paper pages)
npx prisma db execute --file database/seeds/003_cms_seed.sql
```

> **Note:** `database/schema/supabase-schema.sql` is a **generated reference** of the full schema. It is useful for documentation or for manual execution in environments where Prisma CLI is not available, but `prisma/schema.prisma` remains the authoritative source.

## Admin Credentials (after running 001_admin_seed.sql)

- **Email:** `admin@labtest.com`
- **Password:** `Admin@123456`

## Existing Database (Migrations)

If the database already exists and may be missing newer tables/columns (e.g. `SiteSetting`, CMS tables, `PaymentProvider`, `Certificate*`, `CustomTesting*`, etc.):

```bash
# Run the comprehensive patch
npx prisma db execute --file database/migrations/20260415_fix_schema_mismatch.sql
```

Alternatively, if you are confident the environment supports it:

```bash
npx prisma migrate dev
```

## Seeds Explained

### `001_admin_seed.sql`
- **Who runs it:** Deployer / internal team only.
- **What it does:** Creates the master admin user and referral system config.
- **Security:** Do not share this file with end clients unless you change the password first.

### `002_client_seed.sql`
- **Who runs it:** Client or deployer.
- **What it does:** Populates the service catalog with 10 categories, 16 sample testing services, and 4 laboratories.
- **Customization:** Edit the `INSERT INTO ... VALUES` lines to match real business data, or skip this file entirely if you want to start with an empty catalog.

### `003_cms_seed.sql`
- **Who runs it:** Client or deployer.
- **What it does:** Creates the default CMS pages (`homepage`, `about`, `contact`, `patent-services`, `paper-services`) plus all homepage sections, stats, advantages, labs, partner ecosystem, sample/equipment showcases, and site settings.
- **Idempotency:** All inserts use `ON CONFLICT DO NOTHING`, so it is safe to run multiple times.

## Backups (Reference Only)

- `database/backups/` contains historical schema/data snapshots.
- **Do not run these directly on production.** They are for reference and disaster recovery only.

## Common Commands

```bash
# Reset and re-push schema (destructive — only for dev)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Validate schema
npx prisma validate

# Regenerate reference schema SQL from Prisma
npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > database/schema/supabase-schema.sql
```
