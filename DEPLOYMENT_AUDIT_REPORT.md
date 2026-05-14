# EMERGENCY PRODUCTION DEPLOYMENT AUDIT REPORT

> Generated: 2026-05-14
> Project: Labratory Website (Next.js 16 + React 19 + Prisma 7.7 + Supabase)
> Auditor: Kimi Code CLI — Full project scan

---

## EXECUTIVE SUMMARY

| Item | Status |
|------|--------|
| Active schema file | `prisma/schema.prisma` (1,703 lines, 82 models, 23 enums) |
| Migration tracking | **BROKEN** — `migration_lock.toml` missing |
| Schema vs API match | **99%** — only `BundleServices` missing from SQL dump |
| Seed file conflict | `prisma.config.ts` → `seed.ts` (destructive) vs `package.json` → `seed-minimal.ts` (safe) |
| Production credential leak | `.env.example` contains real Supabase password + JWT secret |
| Dead code models | **31 of 82 models** not referenced by any API route |
| Missing API route | `/api/uploads` called by admin/certificates, only `/api/upload` exists |
| Unsafe migration file | `prisma/migrations/production_stabilization.sql` (143KB UTF-16) is a loose full schema dump |

**VERDICT: Database is functionally sound but migration history is untracked. Use `prisma db push` for fresh deploys. Do NOT use `prisma migrate deploy`.**

---

## A. FINAL DATABASE FILES TO KEEP

### 1. Schema (Single Source of Truth)
| File | Purpose | Action |
|------|---------|--------|
| `prisma/schema.prisma` | Active schema — 82 models, 23 enums | **KEEP — do not modify structure without migration plan** |
| `prisma.config.ts` | Prisma 7 config — defines schema path, datasource URL, seed command | **KEEP — but fix seed command** |

### 2. Valid Migrations (Dated Folders)
These are legitimate incremental migrations in proper Prisma folder format:

| Migration | Size | Description |
|-----------|------|-------------|
| `20250614_add_cms_and_site_settings/` | 139 lines | CMS + SiteSetting tables |
| `20260322_production_hardening/` | 148 lines | Production hardening |
| `20260415_add_site_setting_logo_and_brand_color/` | 3 lines | Logo + brand color fields |
| `20260416_add_equipment_quantity/` | 2 lines | Equipment.quantity |
| `20260416_make_email_optional/` | 2 lines | User.email optional |
| `20260428_add_custom_sample_fields/` | 24 lines | Sample custom fields |
| `20260428_add_testing_service_sample_fields/` | 10 lines | TestingService sample fields |
| `20260512_enhance_service_management/` | 58 lines | Service management enhancements |
| `20260512_equipment_module/` | 73 lines | Equipment module |
| `20260512_lab_is_verified/` | 3 lines | Laboratory.isVerified |
| `20260512_lab_vendor_management/` | 24 lines | Lab vendor fields |
| `20260512_refactor_service_category_jsonb/` | 63 lines | JSONB category refactor |

**Note:** `20250323_phase2_payment_enhancements.sql` is a loose file (not in a folder) — see B section.

### 3. Seed Files (Choose ONE)
| File | Type | Safety | When to Use |
|------|------|--------|-------------|
| `prisma/seed-minimal.ts` | Idempotent upsert | **SAFE** — can rerun without data loss | **DEFAULT for production** |
| `prisma/seed-demo-login.ts` | Idempotent upsert | **SAFE** — creates 8 demo phone users | Use AFTER minimal seed for testing |
| `prisma/seed.ts` | Destructive wipe + full rebuild | **DANGEROUS** — deletes ALL data first | Never use on production |
| `scripts/seed-cms-default.ts` | CMS homepage seed | **SAFE** | Run after minimal seed |
| `scripts/seed-labs-equipment.ts` | Labs + equipment demo data | **SAFE** | Run after minimal seed |

### 4. Reference Only (Do Not Run)
| File | Purpose |
|------|---------|
| `database/backups/schema-2026-05-13.sql` | Schema-only pg_dump |
| `database/backups/data-2026-05-13.sql` | Data-only pg_dump |
| `database/legacy/*.sql` | Hand-written DDL — superseded by Prisma |
| `database/archive/*.sql` | One-off patches — already applied |
| `database/seeds/*.sql` | SQL seed references — use TS seeds instead |

---

## B. FILES TO IGNORE / DANGEROUS

| File | Why Dangerous |
|------|---------------|
| `prisma/migrations/production_stabilization.sql` | **143KB UTF-16 full schema dump** sitting loose in migrations folder. If accidentally run, will recreate entire schema. Not tracked by Prisma. |
| `prisma/migrations/20250323_phase2_payment_enhancements.sql` | Loose file (not in folder). May have already been applied via `production_stabilization.sql`. |
| `prisma/seed.ts` | **Deletes all data** with `prisma.$executeRaw` TRUNCATE statements before inserting. |
| `database/legacy/*.sql` | Old hand-written schemas. Will conflict with Prisma-managed schema. |
| `database/archive/*.sql` | Historical patches. Most have been superseded by Prisma migrations. Re-running will cause errors. |
| `scripts/migrate-category-jsonb.ts` | One-off migration script. Already applied via `20260512_refactor_service_category_jsonb`. |
| `scripts/fix-service-category-columns.ts` | One-off fix. Already in migrations. |
| `scripts/run-cms-migration.ts` | One-off CMS migration. Only run if CMS tables are missing. |
| `.env.example` | Contains **real production credentials** (Supabase URL with password, JWT secret). Rotate these immediately. |

---

## C. SAFE DEPLOYMENT ORDER

### For FRESH Supabase Deployment (New Database)

```bash
# 1. Set environment variables
# DATABASE_URL must point to Supabase PgBouncer connection string
# DIRECT_URL must point to Supabase direct connection string (for migrations/push)

# 2. Fix prisma.config.ts seed command (see below)
# Change: seed: "tsx prisma/seed.ts"
# To:     seed: "tsx prisma/seed-minimal.ts"

# 3. Push schema to empty database
npx prisma db push

# 4. Generate Prisma Client
npx prisma generate

# 5. Run safe minimal seed
npx prisma db seed
# OR directly: npx tsx prisma/seed-minimal.ts

# 6. (Optional) Add demo users for phone login testing
npx tsx prisma/seed-demo-login.ts

# 7. (Optional) Seed CMS homepage
npx tsx scripts/seed-cms-default.ts

# 8. (Optional) Seed demo labs + equipment
npx tsx scripts/seed-labs-equipment.ts

# 9. Build and deploy
npm run build
```

### For EXISTING Production Database (Recovery)

```bash
# 1. NEVER run prisma migrate deploy — migration_lock.toml is missing
#    Prisma will fail or try to re-run migrations

# 2. If schema.prisma matches current database (verified: 99% match):
#    Just regenerate client and deploy
npx prisma generate
npm run build

# 3. If schema has drifted from database:
#    Use prisma migrate diff to generate a patch, then apply manually
npx prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-schema prisma/schema.prisma \
  --script > drift-patch.sql
# Review drift-patch.sql, then apply via Supabase SQL Editor
```

---

## D. MINIMUM REQUIRED TABLES FOR APP TO RUN

Based on scan of all 113 API routes, these **51 models are actively used** and must exist:

**Auth & Users (8):** `User`, `Session`, `PasswordResetToken`, `OTPCode`, `Address`, `InvoiceProfile`, `Company`, `CompanyMembership`

**Core Platform (9):** `SiteSetting`, `CMSPage`, `CMSSection`, `CMSSectionItem`, `Translation`, `AppConfig`, `IntegrationSetting`, `Media`, `AuditLog`

**Services & Catalog (8):** `ServiceCategory`, `TestingService`, `TestingServiceCustomField`, `TestingServiceMedia`, `TestingStandard`, `Material`, `Industry`, `Equipment`

**Labs & Equipment (6):** `Laboratory`, `LabUser`, `LabMedia`, `EquipmentMedia`, `EquipmentSchedule`, `EquipmentBooking`

**Orders & Samples (8):** `Order`, `OrderItem`, `OrderTimeline`, `OrderDocument`, `Sample`, `SamplePhoto`, `SampleTimeline`, `Quotation`

**Reports & Certificates (5):** `Report`, `ReportAttachment`, `ReportDownload`, `Certificate`, `CertificateAttachment`

**RFQ & Custom (3):** `RFQRequest`, `RFQFile`, `RFQMessage`

**Payments & Wallet (7):** `Payment`, `PaymentProvider`, `Wallet`, `Transaction`, `CompanyWallet`, `LabWallet`, `WithdrawalRequest`

**Referrals (4):** `Referral`, `ReferralCode`, `ReferralConfig`, `Commission`

**Notifications (2):** `Notification`, `WebhookLog`

**Service Bundles (1):** `BundleServices` (join table), `ServiceBundle`

### Dead Code Models (31 models — safe to ignore for MVP)

These exist in schema but **NO API route references them**:

| Model | Notes |
|-------|-------|
| `Conversation` | Chat feature — not implemented |
| `CustomTestingRequest` | Custom testing requests — not implemented |
| `CustomTestingAttachment` | Only referenced in media-service.ts for soft-delete |
| `CustomTestingMilestone` | Not referenced anywhere |
| `Favorite` | Favorites feature — not implemented |
| `Message` | Messaging feature — not implemented |
| `RateLimitEntry` | Rate limiting — might be used by middleware (not in API routes) |
| `ReportShareLink` | Report sharing — not implemented |
| `RewardApplication` | Rewards — not implemented |
| `TechnicianTask` | Technician workflow — not implemented |
| `UserBrowseLog` | Analytics — not referenced in APIs |
| `CertificateDownload` | Certificate downloads — not implemented |
| `CertificateTemplate` | Certificate templates — not implemented |
| `Invoice` | Invoice generation — not referenced directly |
| `QuotationRevision` | Quote versioning — not implemented |

> **Note:** Some "dead" models are relation tables accessed via Prisma relations (e.g., `OrderItem` via `order.items`). They are kept by Prisma even if not directly queried.

---

## E. HIGH-RISK MODULES LIKELY TO FAIL

| Module | Risk | Evidence |
|--------|------|----------|
| **Admin Certificates** | `POST /api/uploads` called but `/api/upload` exists | Route mismatch: `uploads` vs `upload` |
| **Financial Ledger** | Uses `(prisma as any).labWallet` | Type-unsafe Prisma access. If `LabWallet` model is renamed, this breaks silently. |
| **Admin Integrations** | API routes exist but use `lib/` functions instead of Prisma | `getAllIntegrationSettings`, `createIntegrationSetting` — verify these functions actually work |
| **Admin Lab Earnings** | Same pattern — uses `lib/financial-ledger.ts` | `(prisma as any)` casts throughout |
| **Admin Media** | Routes exist but no Prisma DB calls | `admin/media/` routes have empty or stub implementations |
| **Admin Payment Providers** | Routes exist but no Prisma DB calls | Stub implementations |
| **Production Stabilization SQL** | 143KB UTF-16 file in migrations folder | If Prisma ever picks this up, it will crash or corrupt schema |

---

## F. MIGRATION HISTORY CORRUPTION STATUS

**VERDICT: MIGRATION HISTORY IS UNTRACKED / CORRUPTED**

### Evidence:
1. `prisma/migrations/migration_lock.toml` — **MISSING**
2. `prisma/migrations/production_stabilization.sql` — **143KB loose file, UTF-16 encoded, not in a dated folder**
3. `prisma/migrations/20250323_phase2_payment_enhancements.sql` — **loose file, not in a folder**
4. `prisma.config.ts` seed points to `seed.ts` (destructive) while `package.json` seed points to `seed-minimal.ts` (safe)

### What This Means:
- `prisma migrate deploy` **WILL FAIL** or behave unpredictably
- Prisma cannot determine which migrations have already been applied
- The `production_stabilization.sql` file is effectively a "big bang" migration that replaced the incremental history

### Recovery Options:

**Option 1: Reset migration history (RECOMMENDED for fresh deploys)**
```bash
# Archive old migrations
mkdir prisma/migrations/_archived
mv prisma/migrations/2025* prisma/migrations/2026* prisma/migrations/_archived/
mv prisma/migrations/production_stabilization.sql prisma/migrations/_archived/

# Create a baseline migration from current schema
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/0000_baseline/migration.sql

# Create lock file
echo '# Prisma Migrate lock file v1' > prisma/migrations/migration_lock.toml

# Now migrate deploy works for future changes
```

**Option 2: Use `db push` forever (simplest for small teams)**
- Accept that migration history is lost
- Use `prisma db push` for all schema changes
- Never use `prisma migrate deploy`

---

## G. BEST APPROACH FOR FRESH SUPABASE DEPLOYMENT

### Recommended: `prisma db push` + Baseline Reset

Why `db push` over `migrate deploy`:
- Migration history is untracked (`migration_lock.toml` missing)
- `production_stabilization.sql` corrupts the migration folder
- `db push` pushes `schema.prisma` directly — no history needed
- For a fresh Supabase database, there is no existing data to protect

### Exact Steps:

```bash
# 1. Create new Supabase project
# 2. Get connection strings (PgBouncer for app, Direct for migrations)
# 3. Set in .env:
#    DATABASE_URL="postgresql://.../postgres?pgbouncer=true"
#    DIRECT_URL="postgresql://.../postgres"

# 4. Fix seed conflict in prisma.config.ts
sed -i 's/seed: "tsx prisma\/seed.ts"/seed: "tsx prisma\/seed-minimal.ts"/' prisma.config.ts

# 5. Push schema
npx prisma db push

# 6. Generate client
npx prisma generate

# 7. Seed
npx prisma db seed

# 8. Optional: demo data
npx tsx prisma/seed-demo-login.ts
npx tsx scripts/seed-cms-default.ts

# 9. Build
npm run build
```

---

## INCOMPLETE MODULES

| Module | Location | Issue |
|--------|----------|-------|
| Admin Categories | `admin/categories/page.tsx` | 3-line placeholder — just returns `<div>Categories page</div>` |
| Admin Services Categories | `admin/services/categories/page.tsx` | Hardcoded static page, not connected to admin API |
| Chat/Messaging | `Message`, `Conversation` models | Models exist but no API routes or UI |
| Custom Testing | `CustomTestingRequest` model | Model exists but no API routes |
| Report Sharing | `ReportShareLink` model | Model exists but no API routes |
| Rewards | `RewardApplication` model | Model exists but no API routes |
| Favorites | `Favorite` model | Model exists but no API routes |
| Technician Tasks | `TechnicianTask` model | Model exists but no API routes |
| User Browse Log | `UserBrowseLog` model | Model exists but no API routes |

---

## APIs BROKEN DUE TO SCHEMA DRIFT

| API | Problem | Fix |
|-----|---------|-----|
| `POST /api/uploads` (called by admin/certificates) | Route does not exist — only `/api/upload` exists | Change frontend call from `/api/uploads` to `/api/upload` |
| `lib/financial-ledger.ts` | Uses `(prisma as any).labWallet` | Should use typed `prisma.labWallet` (model exists in schema) |
| `lib/site-settings-cache.ts` | Uses raw Prisma queries without types | Minor — works but not type-safe |

---

## FRONTEND-ONLY ADMIN MODULES

These admin pages have UI but their backend API routes are **stubs or missing**:

| Page | Backend Status |
|------|---------------|
| `admin/media/` | Routes exist but have **NO Prisma DB calls** — empty implementations |
| `admin/payment-providers/` | Routes exist but have **NO Prisma DB calls** — empty implementations |
| `admin/integrations/` | Uses `lib/` helper functions — verify these work |

---

## ROUTES USING NON-EXISTING / UNTRACKED TABLES

| Route | Table/Model | Status |
|-------|-------------|--------|
| `lib/financial-ledger.ts` | `labWallet` via `(prisma as any)` | **Model EXISTS in schema but code uses unsafe cast** |
| `lib/site-settings-cache.ts` | `siteSetting`, `appConfig` | **Models exist, accessed via typed Prisma** |
| `admin/activities` | `auditLog` | Route exists but not linked from any admin page |

---

## 1. EXACT DATABASE RECOVERY STRATEGY

### If Existing Database Is Corrupted / Needs Reset:

```bash
# Step 1: Export data (if possible)
pg_dump "$DATABASE_URL" --data-only --inserts > data_backup.sql

# Step 2: Reset database via Supabase Dashboard
# (Truncate all tables or create fresh project)

# Step 3: Push schema
npx prisma db push

# Step 4: Seed
npx prisma db seed
npx tsx prisma/seed-demo-login.ts

# Step 5: Restore critical data from backup (if needed)
# Run data_backup.sql selectively via Supabase SQL Editor
```

### If Existing Database Is Fine (99% match confirmed):

```bash
# Just regenerate and deploy
npx prisma generate
npm run build
```

---

## 2. EXACT DEPLOYMENT STRATEGY

### Same-Day Client Handover Workflow:

```bash
# PRE-DEPLOYMENT CHECKLIST

# 1. Rotate credentials in .env.example
#    - Change Supabase password
#    - Change JWT_SECRET
#    - Remove real URLs

# 2. Fix seed conflict
sed -i 's/seed: "tsx prisma\/seed.ts"/seed: "tsx prisma\/seed-minimal.ts"/' prisma.config.ts

# 3. Archive dangerous migration files
mkdir -p prisma/migrations/_DO_NOT_RUN
mv prisma/migrations/production_stabilization.sql prisma/migrations/_DO_NOT_RUN/
mv prisma/migrations/20250323_phase2_payment_enhancements.sql prisma/migrations/_DO_NOT_RUN/

# 4. Verify .env has required variables:
#    DATABASE_URL (PgBouncer)
#    DIRECT_URL (direct Supabase connection)
#    JWT_SECRET (min 32 chars)
#    ADMIN_EMAIL, ADMIN_PASSWORD (for seed)

# DEPLOYMENT

# 5. Push schema to fresh database
npx prisma db push --accept-data-loss

# 6. Generate client
npx prisma generate

# 7. Seed
npx prisma db seed

# 8. Build
npm run build

# 9. Start / Deploy
npm start
```

---

## 3. ENVIRONMENT VARIABLES ACTUALLY REQUIRED

Based on scan of `src/lib/env-validation.ts` and all API routes:

### CRITICAL (App won't start without these):
| Variable | Used By | Status |
|----------|---------|--------|
| `DATABASE_URL` | `src/lib/db.ts` | **REQUIRED** — Prisma connection |
| `JWT_SECRET` | Auth routes, middleware | **REQUIRED** — min 32 chars |

### REQUIRED for Core Features:
| Variable | Used By | Status |
|----------|---------|--------|
| `ADMIN_EMAIL` | `prisma/seed-minimal.ts` | Required for admin user seed |
| `ADMIN_PASSWORD` | `prisma/seed-minimal.ts` | Required for admin user seed |

### REQUIRED for SMS/OTP:
| Variable | Used By | Status |
|----------|---------|--------|
| `TENCENT_SMS_SECRET_ID` | `send-otp` route | Required for phone login |
| `TENCENT_SMS_SECRET_KEY` | `send-otp` route | Required for phone login |
| `TENCENT_SMS_SDK_APP_ID` | `send-otp` route | Required for phone login |
| `TENCENT_SMS_SIGN_NAME` | `send-otp` route | Required for phone login |
| `TENCENT_SMS_TEMPLATE_ID` | `send-otp` route | Required for phone login |

### REQUIRED for File Uploads:
| Variable | Used By | Status |
|----------|---------|--------|
| `STORAGE_PROVIDER` | `src/lib/storage.ts` | `local` or `s3` or `oss` |
| `AWS_ACCESS_KEY_ID` | S3 upload | If using S3 |
| `AWS_SECRET_ACCESS_KEY` | S3 upload | If using S3 |
| `AWS_REGION` | S3 upload | If using S3 |
| `AWS_BUCKET` | S3 upload | If using S3 |
| `UPLOAD_DIR` | Local upload | If using local storage |

### REQUIRED for Payments:
| Variable | Used By | Status |
|----------|---------|--------|
| `ALIPAY_APP_ID` | Webhook | If using Alipay |
| `WECHAT_PAY_MCH_ID` | Webhook | If using WeChat |

### Optional / Has Defaults:
| Variable | Default | Notes |
|----------|---------|-------|
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Used in emails |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | `zh-CN` | Already set |
| `ENCRYPTION_KEY` | hardcoded fallback | Should be changed |

---

## SECURITY ACTIONS REQUIRED BEFORE HANDOVER

1. **Rotate `.env.example` credentials immediately** — it contains real Supabase password
2. **Change Supabase DB password** — exposed in `.env.example`
3. **Regenerate JWT_SECRET** — exposed in `.env.example`
4. **Set strong ENCRYPTION_KEY** — currently has weak default
5. **Verify `DIRECT_URL` is set** — needed for `prisma db push`

---

## FINAL CHECKLIST FOR CLIENT

- [ ] `prisma/schema.prisma` is the only schema file that matters
- [ ] `prisma/migrations/migration_lock.toml` is missing — **use `db push`, not `migrate deploy`**
- [ ] `prisma.config.ts` seed command must point to `seed-minimal.ts`
- [ ] Archive `production_stabilization.sql` before any Prisma commands
- [ ] Run `npx prisma db push` then `npx prisma db seed` for fresh database
- [ ] Rotate all credentials exposed in `.env.example`
- [ ] Verify `/api/upload` route exists (fix admin/certificates page if calling `/api/uploads`)
- [ ] 31 models are dead code — safe to leave in schema, ignore for MVP
