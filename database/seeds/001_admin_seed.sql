-- ============================================================
-- ADMIN / INTERNAL SEED DATA
-- ============================================================
-- WARNING: This file contains the master admin login credential.
-- Only run this on initial setup. Keep this file secure.
--
-- Admin credentials after seeding:
--   Email:    admin@labtest.com
--   Password: Admin@123456
-- ============================================================

-- ------------------------------------------------------------------
-- 1. Admin User
-- ------------------------------------------------------------------
-- Password hash is for: Admin@123456
INSERT INTO "User" ("id", "email", "passwordHash", "name", "role", "status", "locale", "emailVerified")
VALUES (
    'admin-001',
    'admin@labtest.com',
    '$2a$12$LJ3BRmqEIvGTbL8fLUVCcO8VmRlCDYoJHUPFLn4q2Ey5JMR1eHwne',
    'System Admin',
    'SUPER_ADMIN',
    'ACTIVE',
    'zh-CN',
    true
) ON CONFLICT ("id") DO NOTHING;

-- ------------------------------------------------------------------
-- 2. Referral System Config
-- ------------------------------------------------------------------
INSERT INTO "ReferralConfig" (
    "id", "registrationReward", "commissionRate", "minWithdrawalAmount",
    "frozenDays", "maxTiers", "isActive", "registrationRedPacketAmount",
    "orderRewardRate", "paperRewardMaxAmount"
)
VALUES (
    'config-001',
    50.00,
    0.0500,
    100.00,
    30,
    1,
    true,
    5.00,
    0.10,
    5000.00
) ON CONFLICT ("id") DO NOTHING;
