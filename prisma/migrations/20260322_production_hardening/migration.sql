-- Production Hardening Migration
-- Adds: Payment providers, Integration settings, Rate limiting, OTP, Password reset, Webhook logs

-- Payment Provider Type Enum
CREATE TYPE "PaymentProviderType" AS ENUM ('WECHAT_PAY', 'ALIPAY', 'UNION_PAY', 'BANK_TRANSFER');

-- Provider Mode Enum
CREATE TYPE "ProviderMode" AS ENUM ('SANDBOX', 'LIVE');

-- Integration Type Enum
CREATE TYPE "IntegrationType" AS ENUM ('SMS', 'EMAIL', 'STORAGE', 'OAUTH', 'CAPTCHA');

-- Payment Providers Table
CREATE TABLE "PaymentProvider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" "PaymentProviderType" NOT NULL,
    "appId" TEXT,
    "merchantId" TEXT,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "privateKey" TEXT,
    "publicKey" TEXT,
    "certSerialNo" TEXT,
    "notifyUrl" TEXT,
    "mode" "ProviderMode" NOT NULL DEFAULT 'SANDBOX',
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "lastTestedAt" TIMESTAMP(3),
    "lastTestResult" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "PaymentProvider_type_idx" ON "PaymentProvider"("type");
CREATE INDEX "PaymentProvider_isEnabled_idx" ON "PaymentProvider"("isEnabled");

-- Integration Settings Table
CREATE TABLE "IntegrationSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" "IntegrationType" NOT NULL,
    "provider" TEXT NOT NULL,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "accessKey" TEXT,
    "accessSecret" TEXT,
    "endpoint" TEXT,
    "region" TEXT,
    "bucket" TEXT,
    "config" JSONB,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "mode" "ProviderMode" NOT NULL DEFAULT 'SANDBOX',
    "lastTestedAt" TIMESTAMP(3),
    "lastTestResult" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "IntegrationSetting_type_idx" ON "IntegrationSetting"("type");
CREATE INDEX "IntegrationSetting_isEnabled_idx" ON "IntegrationSetting"("isEnabled");

-- Password Reset Tokens Table
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL UNIQUE,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- OTP Codes Table
CREATE TABLE "OTPCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "OTPCode_identifier_type_idx" ON "OTPCode"("identifier", "type");
CREATE INDEX "OTPCode_expiresAt_idx" ON "OTPCode"("expiresAt");

-- Rate Limiting Table
CREATE TABLE "RateLimitEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL UNIQUE,
    "count" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "blockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "RateLimitEntry_key_idx" ON "RateLimitEntry"("key");
CREATE INDEX "RateLimitEntry_resetAt_idx" ON "RateLimitEntry"("resetAt");

-- Webhook Logs Table
CREATE TABLE "WebhookLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "eventType" TEXT,
    "payload" TEXT NOT NULL,
    "signature" TEXT,
    "isVerified" BOOLEAN NOT NULL,
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "relatedEntity" TEXT,
    "relatedId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "WebhookLog_provider_idx" ON "WebhookLog"("provider");
CREATE INDEX "WebhookLog_createdAt_idx" ON "WebhookLog"("createdAt");
CREATE INDEX "WebhookLog_relatedEntity_relatedId_idx" ON "WebhookLog"("relatedEntity", "relatedId");

-- Update Payment table
ALTER TABLE "Payment" 
  ADD COLUMN "providerId" TEXT,
  ADD COLUMN "notifyData" JSONB,
  ADD COLUMN "verifiedAt" TIMESTAMP(3),
  ADD COLUMN "refundedAt" TIMESTAMP(3),
  ADD COLUMN "refundAmount" DECIMAL(12,2),
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD FOREIGN KEY ("providerId") REFERENCES "PaymentProvider"("id");

ALTER TABLE "Payment" ALTER COLUMN "status" SET DEFAULT 'pending';

-- Update status values comment
COMMENT ON COLUMN "Payment"."status" IS 'pending, processing, success, failed, refunded, expired';

CREATE INDEX "Payment_providerId_idx" ON "Payment"("providerId");
CREATE INDEX "Payment_externalNo_idx" ON "Payment"("externalNo");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
