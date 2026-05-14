# Production Stabilization Audit Report
**Date:** 2026-05-13
**Project:** Laboratory Marketplace Platform (Next.js 16 + React 19 + Prisma 7 + PostgreSQL)

---

## Executive Summary

The project suffers from three interconnected systemic problems:

1. **Database Architecture Fragmentation** — Dual migration systems (Prisma + manual SQL), schema drift, non-linear migration history, and scattered seed scripts.
2. **Authentication System Gaps** — No DB session validation, JWT tokens leaked in JSON responses, missing rate limiting, open redirect vulnerability, and inconsistent phone normalization.
3. **React DOM Instability** — `insertBefore` crashes caused by concurrent post-hydration re-renders from multiple independent data fetches (auth, settings, toast portal) combined with conditional tree swaps in Header.

---

## Phase 0: Deep Analysis Results

### 0.1 Database Architecture Problems

**Root Cause:** The project evolved through multiple schema management approaches simultaneously:
- Prisma migrations in `prisma/migrations/`
- Manual SQL patches in `database/migrations/`
- One-off fix scripts in `scripts/`
- Full pg_dump backups (`schema.sql`, `data.sql`) in repo root

**Consequences:**
- 12 pending Prisma migrations that were never applied via `prisma migrate deploy`
- Database kept in sync via direct Supabase SQL execution
- Schema drift between `prisma/schema.prisma` and live database
- Missing models in generated Prisma client (`equipmentMedia`, `testingServiceMedia`, `media`) requiring `(prisma as any)` casts
- Destructive primary seed (`prisma/seed.ts` deletes all data)

### 0.2 Prisma Schema vs Live Database Mismatch

**Agent failure note:** The automated schema comparison agent failed due to file size. Manual comparison is required during Phase 2.

**Known mismatches from prior work:**
- `SiteSetting` table missing columns: `footerCopyrightZh`, `footerCopyrightEn`, `footerContactPhone`, `footerContactEmail`, `footerContactAddress`, `footerIcp`, `footerSocialLinks`, `seoKeywordsZh`, `seoKeywordsEn`
- `AppConfig` table missing from some databases
- `equipmentMedia`, `testingServiceMedia`, `media` models missing from Prisma client generation
- `UserBrowseLog` table added via migration but may not exist in all DB instances

### 0.3 Authentication System Critical Issues

| # | Issue | Severity | Root Cause |
|---|-------|----------|------------|
| 1 | `getCurrentUser()` skips DB session validation | **Critical** | Only verifies JWT signature/expiry, never checks `Session` table |
| 2 | JWT token leaked in JSON response body | **Critical** | All login routes return `token` field, defeating `httpOnly` cookie |
| 3 | No rate limiting on password login | **Critical** | `/api/auth/login-phone-password` has zero rate limiting |
| 4 | Open redirect in `normalizeCallbackUrl` | **High** | `//evil.com` passes `startsWith('/')` check |
| 5 | Dual-phone fallback creates account splitting | **High** | Server tries `+86...` then falls back to raw phone, allowing duplicates |
| 6 | No transaction wrapping for registration | **High** | Multi-step create can orphan `Company` or `Wallet` rows |
| 7 | `login-phone` bypasses `PENDING_VERIFICATION` | **Medium** | Inconsistent status enforcement between login methods |
| 8 | `phoneVerified` not checked on password login | **Medium** | Unverified phones can access password-only features |
| 9 | Race condition: check-then-create | **Medium** | TOCTOU bug in registration allows P2002 crashes |
| 10 | `verifyTokenEdge()` swallows all errors silently | **High** | No logging for JWT verification failures in Edge runtime |

### 0.4 React DOM `insertBefore` Crash — Exact Root Cause

**The crash is NOT caused by SVG icons or motion wrappers.** Those were red herrings.

**Actual root cause sequence:**

1. **Server renders** with `user = null`, `settings = null`, `mounted = false` (SonnerToaster)
2. **Hydration completes** with DOM matching server tree
3. **Concurrent effects fire simultaneously:**
   - `AuthProvider` fetches `/api/auth/me` → `setUser()` → **Header swaps entire guest→auth subtree**
   - `Footer` fetches `/api/site-settings` independently → **15+ text nodes mutate**
   - `SiteSettingsProvider` fetches settings → `BrandColorProvider` mutates `:root` CSS variables
   - `SonnerToaster` useEffect fires → **portal inserts into `document.body`**
4. **React's concurrent reconciler** processes Header auth-state update. It attempts `insertBefore` on a sibling reference from the *old* guest subtree.
5. **That sibling was already removed** by an overlapping update (portal insertion or Footer text mutation), causing:
   ```
   Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.
   ```

**Contributing factors:**
- `loading.tsx` and `error.tsx` had competing `min-h-screen flex` wrappers with different flex directions
- `Footer` runs its own `fetch('/api/site-settings')` instead of consuming `useSiteSettings()` context
- `SonnerToaster` returns `null` on SSR then portals into body on client
- `Header` conditionally renders completely different element types based on `loggedIn`
- `reactStrictMode: false` hides effect cleanup bugs

---

## Phased Repair Strategy

### Phase 1: Database Folder Restructure (Safe — no code changes)
- Create `database/archive/`, `database/legacy/`, `database/backups/`, `database/debug/`
- Move root-level `schema.sql` and `data.sql` to `database/backups/`
- Move old manual SQL patches to `database/archive/`
- Move deprecated schema files to `database/legacy/`
- Update `.gitignore`
- Preserve everything — nothing deleted

### Phase 2: Prisma-First Schema Stabilization
- Manually compare `prisma/schema.prisma` with `schema.sql`
- Identify all missing tables, columns, enums, indexes
- Fix schema drift in `schema.prisma`
- Run `prisma generate` to validate
- Create a clean baseline migration
- Update `prisma/seed.ts` to be non-destructive

### Phase 3: Auth System Hardening
- Add DB session validation to `getCurrentUser()` and `/api/auth/me`
- Remove `token` field from all login/register JSON responses
- Add rate limiting to `/api/auth/login-phone-password`
- Fix `normalizeCallbackUrl` open redirect
- Implement unified E.164 phone normalization with country code selector
- Add transaction wrapping to registration
- Fix `PENDING_VERIFICATION` bypass
- Add debug logging to login flow

### Phase 4: React DOM Stability
- Fix `SonnerToaster` — render static placeholder SSR instead of `null`
- Fix `Footer` — consume `useSiteSettings()` context, remove independent fetch
- Fix `Header` — render stable shell during auth loading instead of swapping element types
- Fix `loading.tsx`/`error.tsx` — identical outer DOM structure
- Fix `BrandColorProvider` — use CSS custom properties in stylesheet instead of JS mutation
- Fix `next.config.ts` — enable `reactStrictMode: true` in dev

### Phase 5: Migration & Seed Cleanup
- Consolidate all seed scripts under `prisma/seeds/`
- Add `db:migrate` and `db:push` scripts to `package.json`
- Create `npm run seed:minimal` (safe upsert) vs `npm run seed:reset` (destructive)
- Test full workflow: `npm install` → `prisma generate` → `prisma migrate deploy` → `npm run seed` → `npm run dev`

### Phase 6: Documentation
- Update `database/README.md`
- Create `SETUP.md` for client handover
- Document all environment variables
- Document phone normalization rules

---

## Risk Assessment

| Phase | Risk Level | Rollback Strategy |
|-------|-----------|-------------------|
| 1 (Folder restructure) | **None** — only moves files | Git revert |
| 2 (Prisma schema) | **Medium** — affects DB | Keep old schema.prisma backup |
| 3 (Auth hardening) | **Medium** — affects login flow | Feature flags or revert commits |
| 4 (React stability) | **Low** — UI-only changes | Revert individual files |
| 5 (Seed cleanup) | **Low** — data seeding only | Revert seed scripts |
| 6 (Docs) | **None** | N/A |
