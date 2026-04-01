# Production Hardening Implementation Plan

## EXECUTIVE SUMMARY

This document outlines the comprehensive production hardening implementation for the laboratory marketplace platform, addressing critical issues in payments, authentication, admin configuration, frontend stability, and China localization.

## ROOT CAUSES IDENTIFIED

### 1. Loading/Session Issues
**Primary Causes:**
- No session refresh mechanism when tokens expire
- Auth state managed in multiple places (`cookies`, `localStorage`, React state) without coordination
- Missing React Query for proper client-side caching
- No error boundaries around auth-dependent components
- Race conditions in auth checks during navigation
- Hydration mismatches between server and client auth state

**Symptoms:**
- Infinite loading spinners after login
- Stuck pages after session timeout
- Redirect loops
- Inconsistent auth state

### 2. Payment System Issues
**Primary Causes:**
- Mock provider returns immediate success in production
- Wallet balance credited before webhook verification
- No signature validation on webhooks
- Hardcoded provider credentials
- In-memory idempotency (lost on restart)

**Risks:**
- Fraudulent payments
- Double-charging
- Unverified transactions
- No audit trail

### 3. Security Vulnerabilities
- Rate limiting in memory (bypassed on restart)
- No CSRF protection
- Weak session management
- No audit logging for sensitive actions
- Plain-text secrets in code

## IMPLEMENTATION ROADMAP

### Phase 1: Database & Core Infrastructure (CRITICAL - Week 1)
**Status:** Schema designed ✅
**Migration:** `/app/prisma/migrations/20260322_production_hardening/migration.sql`

New Models:
- `PaymentProvider` - Dynamic payment config
- `IntegrationSetting` - Dynamic credentials (SMS, email, storage)
- `PasswordResetToken` - Secure reset tokens
- `OTPCode` - SMS/email verification codes
- `RateLimitEntry` - Persistent rate limiting
- `WebhookLog` - Webhook audit trail

### Phase 2: Payment Provider System (CRITICAL - Week 1)
**Priority:** Highest
**Files to Create:**

1. `/app/src/lib/payment-providers/base.ts` - Provider interface
2. `/app/src/lib/payment-providers/wechat.ts` - WeChat Pay implementation
3. `/app/src/lib/payment-providers/alipay.ts` - Alipay implementation
4. `/app/src/lib/payment-providers/unionpay.ts` - UnionPay placeholder
5. `/app/src/lib/services/payment-config.service.ts` - Provider config resolver
6. `/app/src/lib/services/payment.service.ts` - Payment orchestration
7. `/app/src/lib/services/webhook.service.ts` - Webhook verification & processing

**Key Changes:**
```typescript
// Provider Interface
interface PaymentProvider {
  createPayment(amount: number, orderId: string): Promise<PaymentIntent>;
  verifyWebhook(body: string, signature: string): Promise<WebhookVerification>;
  queryPaymentStatus(externalNo: string): Promise<PaymentStatus>;
  refund(externalNo: string, amount: number, reason: string): Promise<RefundResult>;
}

// Payment Flow
1. User initiates payment → Create payment record (status: "pending")
2. Call provider.createPayment() → Get payment URL/QR code
3. User completes payment on provider side
4. Provider sends webhook/notify → Verify signature → Update payment (status: "processing")
5. Query provider API to double-check → Update payment (status: "success")
6. Credit wallet / mark order paid → Audit log
```

**Critical Rules:**
- Never credit wallet before `verifiedAt` is set
- Always verify webhook signatures
- Always query provider API after webhook as second verification
- Log all webhook payloads to `WebhookLog`
- Use idempotency keys from database, not memory

### Phase 3: Authentication System Overhaul (CRITICAL - Week 1)
**Files to Modify:**

1. `/app/src/lib/auth.ts` - Core auth functions
2. `/app/src/lib/services/otp.service.ts` - NEW: OTP generation/verification
3. `/app/src/lib/services/sms.service.ts` - NEW: SMS abstraction
4. `/app/src/contexts/AuthContext.tsx` - Client auth state
5. `/app/src/middleware.ts` - Session validation
6. `/app/src/lib/api-helpers.ts` - Auth guards

**Key Changes:**

```typescript
// Session Management
- Add session refresh before expiry (at 80% of token lifetime)
- Implement token sliding window
- Add device/session management
- Auto-logout on token expiry with redirect

// Phone/SMS Login
POST /api/auth/otp/request { phone: string, type: "login" }
POST /api/auth/otp/verify { phone: string, code: string }
→ Create user if not exists, generate session

// Password Reset via SMS
POST /api/auth/reset/request { phone: string }
→ Generate hashed token, send SMS
POST /api/auth/reset/verify { phone: string, code: string, newPassword: string }
→ Verify token, update password, invalidate old sessions

// Fix Loading Issues
1. Use React Query for auth state
2. Add loading boundary wrapper
3. Implement proper error boundaries
4. Add session expiry modal instead of redirect
5. Coordinate server/client auth state properly
```

### Phase 4: Dynamic Admin Configuration (CRITICAL - Week 1-2)
**Files to Create:**

1. `/app/src/app/[locale]/admin/settings/integrations/page.tsx` - Integration settings UI
2. `/app/src/app/[locale]/admin/settings/payments/page.tsx` - Payment provider UI
3. `/app/src/app/api/admin/settings/integrations/route.ts` - Integration API
4. `/app/src/app/api/admin/settings/payments/route.ts` - Payment provider API
5. `/app/src/lib/services/encryption.service.ts` - Secret encryption
6. `/app/src/lib/services/integration-config.service.ts` - Config resolver

**Key Features:**
- CRUD for payment providers (WeChat, Alipay, UnionPay)
- CRUD for SMS/email/storage providers
- Secret encryption at rest using AES-256-GCM
- Test connection button for each provider
- Masked secret display in UI
- Audit trail for config changes
- Role-based access (SUPER_ADMIN only)

**Encryption Strategy:**
```typescript
// Master key from env (rotate-friendly)
ENCRYPTION_KEY=base64-encoded-32-byte-key

// Encrypt secrets before storing
const encrypted = encrypt(secret, ENCRYPTION_KEY);
await prisma.paymentProvider.create({
  data: { apiSecret: encrypted }
});

// Decrypt when needed
const config = await getPaymentProviderConfig('WECHAT_PAY');
const apiSecret = decrypt(config.apiSecret, ENCRYPTION_KEY);
```

### Phase 5: Frontend Stability (CRITICAL - Week 2)
**Files to Modify:**

1. `/app/src/lib/api/client.ts` - NEW: Centralized API client
2. `/app/src/lib/hooks/useAuth.ts` - NEW: Auth hook with React Query
3. `/app/src/components/providers/QueryProvider.tsx` - NEW: React Query setup
4. `/app/src/components/guards/AuthGuard.tsx` - NEW: Route protection
5. `/app/src/components/ui/LoadingBoundary.tsx` - NEW: Loading wrapper
6. `/app/src/components/ui/ErrorBoundary.tsx` - NEW: Error boundary

**React Query Setup:**
```typescript
// Install: @tanstack/react-query

// 1. Wrap app with QueryClientProvider
// 2. Replace manual fetch + useState patterns with useQuery
// 3. Add proper error/loading states everywhere
// 4. Implement auth refresh in query client

// Example transformation:
// Before:
const [user, setUser] = useState(null);
useEffect(() => {
  fetch('/api/user').then(r => r.json()).then(setUser);
}, []);

// After:
const { data: user, isLoading, error } = useQuery({
  queryKey: ['user'],
  queryFn: () => apiClient.get('/api/user'),
  staleTime: 5 * 60 * 1000,
  retry: 1
});
```

### Phase 6: Security & Rate Limiting (HIGH - Week 2)
**Files to Create:**

1. `/app/src/lib/middleware/rate-limit.ts` - Database-backed rate limiting
2. `/app/src/lib/middleware/csrf.ts` - CSRF token validation
3. `/app/src/lib/middleware/audit.ts` - Audit logging middleware
4. `/app/src/lib/services/audit.service.ts` - Audit log service

**Rate Limiting Strategy:**
```typescript
// Database-backed instead of memory
async function checkRateLimit(key: string, limit: number, windowMs: number) {
  const entry = await prisma.rateLimitEntry.findUnique({ where: { key } });
  
  if (entry && entry.resetAt > new Date()) {
    if (entry.count >= limit) {
      if (entry.blockedUntil && entry.blockedUntil > new Date()) {
        throw new Error('Rate limit exceeded');
      }
      // Block for exponential backoff
      await prisma.rateLimitEntry.update({
        where: { key },
        data: { blockedUntil: new Date(Date.now() + windowMs * 2) }
      });
      throw new Error('Rate limit exceeded');
    }
    // Increment count
    await prisma.rateLimitEntry.update({
      where: { key },
      data: { count: entry.count + 1 }
    });
  } else {
    // Create new entry
    await prisma.rateLimitEntry.upsert({
      where: { key },
      create: {
        key,
        count: 1,
        resetAt: new Date(Date.now() + windowMs)
      },
      update: {
        count: 1,
        resetAt: new Date(Date.now() + windowMs)
      }
    });
  }
}

// Apply to sensitive endpoints:
// - /api/auth/login: 5 per 15min per IP
// - /api/auth/otp/request: 3 per 15min per phone
// - /api/auth/reset: 3 per hour per phone
```

### Phase 7: China Localization (HIGH - Week 2)
**SMS Provider Abstraction:**
```typescript
interface SMSProvider {
  sendOTP(phone: string, code: string): Promise<boolean>;
  sendNotification(phone: string, template: string, params: object): Promise<boolean>;
}

// Implementations:
- Aliyun SMS (阿里云短信)
- Tencent Cloud SMS (腾讯云短信)
- Huawei Cloud SMS
```

**Storage Provider Abstraction:**
```typescript
interface StorageProvider {
  upload(file: Buffer, path: string): Promise<string>;
  getSignedUrl(path: string, expiresIn: number): Promise<string>;
  delete(path: string): Promise<boolean>;
}

// Implementations:
- Aliyun OSS (阿里云对象存储)
- Tencent COS (腾讯云对象存储)
- Qiniu (七牛云)
```

**Address Model Updates:**
```typescript
// Already has province, city, district
// Add:
- provinceCode (e.g., "110000" for Beijing)
- cityCode (e.g., "110100")
- districtCode (e.g., "110101")
// For integration with AMap / Baidu Maps
```

## TESTING REQUIREMENTS

### Unit Tests (Critical)
- Payment provider signature verification
- OTP generation/verification
- Rate limiting logic
- Secret encryption/decryption
- Webhook processing

### Integration Tests (Critical)
- Payment create → webhook → verification → wallet credit flow
- OTP request → verify → login flow
- Password reset via SMS flow
- Admin config CRUD with encryption
- Rate limit enforcement across requests

### E2E Tests (Important)
- User login with phone/SMS
- Order → payment → webhook → completion
- Admin manage payment providers
- Session expiry handling

## DEPLOYMENT CHECKLIST

### Environment Variables
```bash
# Core
JWT_SECRET=<64-char-random-string>
ENCRYPTION_KEY=<base64-encoded-32-bytes>
DATABASE_URL=<postgres-url>

# Remove these (now in database):
# WECHAT_PAY_APP_ID=...
# ALIPAY_APP_ID=...
# SMS_ACCESS_KEY=...
```

### Database
```bash
# Run migration
npx prisma migrate deploy

# Generate client
npx prisma generate
```

### Initial Setup
1. Login as SUPER_ADMIN
2. Navigate to /admin/settings/payments
3. Add WeChat Pay provider with credentials
4. Add Alipay provider with credentials
5. Enable and set as default
6. Test connection
7. Repeat for SMS/email/storage providers

### Security Review
- [ ] All secrets encrypted in database
- [ ] No hardcoded credentials in code
- [ ] Rate limiting enabled on auth endpoints
- [ ] CSRF protection enabled
- [ ] Audit logging enabled for admin actions
- [ ] Session expiry properly handled
- [ ] Payment webhooks verified
- [ ] No wallet crediting before verification

## MIGRATION STRATEGY

### Zero-Downtime Deployment
1. Deploy new code with feature flags disabled
2. Run database migration
3. Populate payment provider configs via admin UI
4. Test in staging
5. Enable payment provider system feature flag
6. Monitor webhook processing
7. Gradually migrate old payment records

### Rollback Plan
- Keep old payment code path as fallback
- Feature flag to switch between old/new system
- Database migration is backward compatible

## MONITORING & ALERTS

### Critical Metrics
- Payment webhook verification failures
- Rate limit blocks
- Session expiry rates
- OTP send failures
- Provider API errors

### Alerts
- > 5% webhook verification failures → CRITICAL
- > 10% OTP send failures → HIGH
- Payment provider down → CRITICAL
- Unusual rate limit blocks → MEDIUM

## CONCLUSION

This implementation addresses all critical production issues:
✅ Secure, auditable payment system with proper verification
✅ Stable auth with session management and OTP support
✅ Dynamic admin configuration for all credentials
✅ Persistent rate limiting and security
✅ Frontend stability with React Query
✅ China-first localization ready

**Estimated Implementation Time:** 2-3 weeks with 2 developers
**Risk Level:** Medium (requires careful testing of payment flows)
**Business Impact:** High (enables production-ready China deployment)
