-- Site Settings Enhancement Migration
-- Adds SEO/footer fields and AppConfig table for sensitive keys

-- 1. Add new fields to SiteSetting
ALTER TABLE "SiteSetting"
    ADD COLUMN IF NOT EXISTS "footerCopyrightZh" TEXT,
    ADD COLUMN IF NOT EXISTS "footerCopyrightEn" TEXT,
    ADD COLUMN IF NOT EXISTS "footerContactPhone" TEXT,
    ADD COLUMN IF NOT EXISTS "footerContactEmail" TEXT,
    ADD COLUMN IF NOT EXISTS "footerContactAddress" TEXT,
    ADD COLUMN IF NOT EXISTS "footerIcp" TEXT,
    ADD COLUMN IF NOT EXISTS "footerSocialLinks" JSONB,
    ADD COLUMN IF NOT EXISTS "seoKeywordsZh" TEXT,
    ADD COLUMN IF NOT EXISTS "seoKeywordsEn" TEXT;

-- 2. Create AppConfig table for sensitive keys
CREATE TABLE IF NOT EXISTS "AppConfig" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,

    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AppConfig_key_key" UNIQUE ("key")
);

CREATE INDEX IF NOT EXISTS "AppConfig_key_idx" ON "AppConfig"("key");
CREATE INDEX IF NOT EXISTS "AppConfig_category_idx" ON "AppConfig"("category");

-- 3. Seed default AppConfig entries for common sensitive keys
INSERT INTO "AppConfig" ("id", "key", "value", "category", "description")
VALUES
    (gen_random_uuid()::text, 'GOOGLE_MAPS_API_KEY', '', 'maps', 'Google Maps API Key'),
    (gen_random_uuid()::text, 'SMTP_HOST', '', 'email', 'SMTP Server Host'),
    (gen_random_uuid()::text, 'SMTP_PORT', '587', 'email', 'SMTP Server Port'),
    (gen_random_uuid()::text, 'SMTP_USER', '', 'email', 'SMTP Username'),
    (gen_random_uuid()::text, 'SMTP_PASS', '', 'email', 'SMTP Password'),
    (gen_random_uuid()::text, 'SMS_API_KEY', '', 'sms', 'SMS Provider API Key'),
    (gen_random_uuid()::text, 'SMS_API_SECRET', '', 'sms', 'SMS Provider API Secret'),
    (gen_random_uuid()::text, 'OSS_ACCESS_KEY_ID', '', 'storage', 'Alibaba OSS Access Key ID'),
    (gen_random_uuid()::text, 'OSS_ACCESS_KEY_SECRET', '', 'storage', 'Alibaba OSS Access Key Secret')
ON CONFLICT ("key") DO NOTHING;

-- 4. Seed a default SiteSetting row if none exists
INSERT INTO "SiteSetting" ("id", "siteName", "brandColor", "seoTitleZh", "seoDescriptionZh")
SELECT gen_random_uuid()::text, '度量衡科研平台', '#0066B3', '度量衡科研平台 - 立足科学前沿，服务中国创新', '一站式检测服务平台，连接企业与优质实验室，提供高效、透明、可靠的检测解决方案'
WHERE NOT EXISTS (SELECT 1 FROM "SiteSetting" LIMIT 1);
