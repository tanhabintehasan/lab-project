# Remaining Work (Optional Enhancements)

## Payment Integration (Production)
- [ ] Implement Stripe provider in src/lib/payments.ts
- [ ] Implement WeChat Pay / Alipay providers
- [ ] Build webhook endpoint for payment confirmation
- [ ] Add reconciliation job/admin view
- [ ] Add refund handling UI

## File Uploads (Production)
- [ ] Implement S3/R2 provider in src/lib/storage.ts
- [ ] Build upload API endpoint (/api/uploads)
- [ ] Add upload UI to RFQ form, report upload, sample photos, avatar
- [ ] Implement signed URL access for private report files

## Email Integration
- [ ] Integrate email service (SendGrid/SES) for password reset emails
- [ ] Add order status notification emails
- [ ] Add report ready notification emails

## Enterprise Module
- [ ] Member invitation flow with email-based invite tokens
- [ ] Company-scoped order/report queries
- [ ] Order approval workflow
- [ ] Company wallet separation

## Admin Enhancements
- [ ] Real chart components for analytics (recharts/chart.js)
- [ ] Translation management UI (in-browser editing)
- [ ] Referral configuration management
- [ ] Invoice PDF generation
- [ ] Export functionality (CSV/Excel)

## Testing
- [ ] Auth/session integration tests
- [ ] Order state machine tests
- [ ] Payment webhook idempotency tests
- [ ] Sample ownership tests
- [ ] E2E happy path test

## UX / i18n
- [ ] Complete i18n coverage (remove remaining hardcoded Chinese strings)
- [ ] Dark mode support
- [ ] Mobile payment flow optimization
- [ ] Remember-me with extended session duration

## Infrastructure
- [ ] Replace in-memory rate limiter with Redis
- [ ] Add CSP and security headers
- [ ] Database connection pooling optimization
- [ ] Error monitoring (Sentry integration)
- [ ] CI/CD pipeline configuration
