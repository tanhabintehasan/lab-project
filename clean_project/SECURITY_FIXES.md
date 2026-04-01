# Security Fixes Summary

## Critical Vulnerabilities Fixed

### 1. HttpOnly Cookie Sessions (was: client-side JWT storage)
JWT tokens no longer returned in JSON bodies or stored in localStorage/Zustand. Auth cookies are set server-side with HttpOnly, SameSite=Lax, Secure flags.

### 2. JWT Secret Default Removed
App now throws on startup if JWT_SECRET env var is missing (was: insecure default fallback).

### 3. Database Session Verification
getAuthUser() verifies session exists in DB and is not expired. Revoked sessions are immediately invalid.

### 4. Order PATCH RBAC + State Machine
Ownership check + role-based allowed state transitions. Prevents horizontal privilege escalation.

### 5. Quotation userId Privilege Escalation Fixed
Only admins can create quotations for other users. Regular users always create for themselves.

### 6. Admin Mutation Validation
All admin endpoints use Zod schemas. Self-demotion prevented. Raw body-to-Prisma patterns eliminated.

### 7. Wallet Recharge Safety
Payment intent pattern with idempotency keys. Balance only credited after verified payment.

### 8. Lab Partner Scope Enforcement
Lab partner order/sample/report mutations verified against assigned lab.

### 9. Rate Limiting
Login (10/min), Register (5/min), Reset Request (3/5min), Contact (3/min), Recharge (5/min).

### 10. Zod Validation on All Mutations
Centralized validation schemas in src/lib/validations.ts covering all POST/PUT/PATCH/DELETE routes.

### 11. Server-Side Logout
Cookie cleared via Set-Cookie header, not client-side document.cookie manipulation.

### 12. Comprehensive Audit Logging
All admin mutations, auth events, order changes, and password resets logged.

### 13. Password Reset Flow
Real token-based flow with 1-hour expiry, one-time use, and session invalidation on reset.
