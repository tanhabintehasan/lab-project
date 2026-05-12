-- ============================================================
-- SANITIZED DEMO SEED DATA
-- Safe for client handover. Contains only non-sensitive demo data.
-- ============================================================

-- Admin user (password: Admin@123456)
INSERT INTO "User" ("id", "email", "passwordHash", "name", "role", "status", "locale", "emailVerified")
VALUES (
    'admin-001',
    'admin@labtest.com',
    '$2b$12$XcexWd3Tk.nsordLXHmCfuSdeux0wV9eThw.ufEJd0Qe6ughgnNwS',
    'System Admin',
    'SUPER_ADMIN',
    'ACTIVE',
    'zh-CN',
    true
) ON CONFLICT ("id") DO NOTHING;

-- Service categories
INSERT INTO "ServiceCategory" ("id", "slug", "nameZh", "nameEn", "sortOrder", "isActive") VALUES
    ('cat-001', 'mechanical-testing', '力学性能测试', 'Mechanical Testing', 1, true),
    ('cat-002', 'chemical-analysis', '化学成分分析', 'Chemical Analysis', 2, true),
    ('cat-003', 'environmental-testing', '环境可靠性测试', 'Environmental Testing', 3, true),
    ('cat-004', 'material-testing', '材料微观分析', 'Material Testing', 4, true)
ON CONFLICT ("id") DO NOTHING;

-- Testing services
INSERT INTO "TestingService" ("id", "slug", "categoryId", "nameZh", "nameEn", "shortDescZh", "shortDescEn", "pricingModel", "priceMin", "turnaroundDays", "isActive", "isFeatured") VALUES
    ('svc-001', 'tensile-test', 'cat-001', '拉伸试验', 'Tensile Test', '测量材料在拉伸载荷下的力学性能', 'Measure mechanical properties under tensile load', 'FIXED', 500.00, 5, true, true),
    ('svc-002', 'hardness-test', 'cat-001', '硬度测试', 'Hardness Test', '测定材料抵抗局部压入的能力', 'Determine material resistance to indentation', 'FIXED', 300.00, 3, true, false),
    ('svc-003', 'composition-analysis', 'cat-002', '成分分析', 'Composition Analysis', '分析材料的化学元素组成及含量', 'Analyze chemical composition of materials', 'RANGE', 800.00, 7, true, true),
    ('svc-004', 'salt-spray-test', 'cat-003', '盐雾试验', 'Salt Spray Test', '评估材料耐腐蚀性能', 'Evaluate material corrosion resistance', 'FIXED', 1200.00, 10, true, false)
ON CONFLICT ("id") DO NOTHING;

-- Laboratories
INSERT INTO "Laboratory" ("id", "slug", "nameZh", "nameEn", "shortDescZh", "shortDescEn", "city", "province", "status", "rating") VALUES
    ('lab-001', 'shanghai-testing-center', '上海检测中心', 'Shanghai Testing Center', '专业的材料检测与分析实验室', 'Professional material testing and analysis laboratory', '上海', '上海', 'ACTIVE', 4.80),
    ('lab-002', 'beijing-material-lab', '北京材料实验室', 'Beijing Material Lab', '综合性材料测试服务中心', 'Comprehensive material testing service center', '北京', '北京', 'ACTIVE', 4.60)
ON CONFLICT ("id") DO NOTHING;

-- Referral config
INSERT INTO "ReferralConfig" ("id", "registrationReward", "commissionRate", "minWithdrawalAmount", "frozenDays", "maxTiers", "isActive")
VALUES ('config-001', 50.00, 0.0500, 100.00, 30, 1, true)
ON CONFLICT ("id") DO NOTHING;
