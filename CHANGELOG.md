# Changelog

## v2.0.0 — Production Hardening Release

### Auth & Security
- Migrated from client-side JWT to HttpOnly cookie-based sessions
- Removed JWT_SECRET default fallback (app throws if missing)
- Added DB session verification on every authenticated request
- Added rate limiting to auth, contact, and payment endpoints
- Added Zod validation to all 30+ mutation API routes
- Fixed quotation userId privilege escalation
- Fixed order PATCH allowing unauthorized status transitions
- Fixed lab partner accessing orders outside their lab scope
- Added comprehensive audit logging for all mutations
- Implemented real password reset flow (token + email + expiry)

### API Routes (46 total)
- Auth: login, register, logout, request-reset, reset-password
- Profile, addresses (CRUD), invoice-profiles, settings (password, preferences)
- Dashboard stats, wallet (balance, transactions, recharge with idempotency)
- Notifications (list, mark-read), quotations (list, create, accept/reject)
- Reports (list, detail, public verify), labs (list, detail), equipment (list, detail)
- Services (list, detail), orders (list, detail, update with RBAC)
- Referrals, contact, admin (stats, users, services, labs, CMS, finance)
- Lab portal (orders, samples, reports — all with scope enforcement)

### Pages (64 total)
- Auth: login, register, forgot-password, reset-password
- Public: about, contact, help/FAQ, terms, privacy, lab detail, equipment, categories, materials, industries, standards, RFQ (list/new/detail), reports verify
- Dashboard: home, orders (list/detail), reports, samples, wallet, quotations, referral, messages, profile, settings
- Admin: dashboard, users, services, orders, rfq, samples, reports, labs, equipment, finance, referrals, CMS, translations, analytics
- Lab Portal: dashboard, orders, samples, rfq, reports, equipment
- Enterprise: layout + workspace, members, billing, orders, reports, approvals

### Infrastructure
- Created centralized validation library (src/lib/validations.ts)
- Created rate limiting utility (src/lib/rate-limit.ts)
- Created storage abstraction for file uploads (src/lib/storage.ts)
- Created payment provider abstraction (src/lib/payments.ts)
- Fixed 30+ client pages: removed stale token references, added credentials:'include'
- Fixed header language switcher
- Fixed SearchInput debounce
- Added error, not-found, and loading pages

### Client Auth Migration
- Removed token from Zustand auth store
- All fetch calls use credentials:'include' for cookie auth
- Login respects callbackUrl parameter
- Logout uses server-side cookie clearing
