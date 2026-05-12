-- ============================================================
-- CMS & SITE SETTINGS SEED DATA
-- Safe for client handover. Provides default homepage content.
-- Run after 001_demo_seed.sql so that services/categories exist.
-- ============================================================

-- ------------------------------------------------------------------
-- 1. Site Settings (single row)
-- ------------------------------------------------------------------
INSERT INTO "SiteSetting" (
    "id", "siteName", "siteNameEn", "logoUrl", "logoUploadUrl", "faviconUrl",
    "supportEmail", "supportPhone", "whatsapp", "wechat",
    "addressZh", "addressEn",
    "facebookUrl", "linkedinUrl", "youtubeUrl",
    "footerTextZh", "footerTextEn",
    "seoTitleZh", "seoTitleEn", "seoDescriptionZh", "seoDescriptionEn"
) VALUES (
    'setting-001',
    '度量衡科研平台',
    'DuLiangHeng Research Platform',
    '/logo.png',
    NULL,
    '/favicon.ico',
    'support@labtest.com',
    '400-123-4567',
    '+8612345678901',
    'lab_wechat_id',
    '中国上海市浦东新区张江高科技园区',
    'Zhangjiang Hi-Tech Park, Pudong, Shanghai, China',
    'https://facebook.com/labtest',
    'https://linkedin.com/company/labtest',
    'https://youtube.com/labtest',
    '度量衡科研平台 — 立足科学前沿，服务中国创新。提供专业的科研检测与实验室协同服务。',
    'DuLiangHeng Research Platform — Serving innovation through scientific excellence.',
    '度量衡科研平台 | 专业科研检测服务',
    'DuLiangHeng Research Platform | Professional Testing Services',
    '度量衡科研平台提供前沿测试、化学成分分析、电化学测试、环境测试等专业科研检测服务，服务6000+科研院所。',
    'DuLiangHeng Research Platform offers frontier testing, chemical analysis, electrochemical testing, environmental testing and more for research institutes.'
) ON CONFLICT ("id") DO NOTHING;

-- ------------------------------------------------------------------
-- 2. CMS Pages (idempotent by slug)
-- ------------------------------------------------------------------
INSERT INTO "CMSPage" ("id", "slug", "type", "titleZh", "titleEn", "contentZh", "contentEn", "isPublished", "sortOrder", "publishedAt")
VALUES
    ('page-home',     'homepage',       'homepage', '首页', 'Homepage', NULL, NULL, true, 0, CURRENT_TIMESTAMP),
    ('page-about',    'about',          'page',     '关于我们', 'About Us', '我们是一家专注于科研检测与实验室协同服务的平台。', 'We are a platform dedicated to research testing and laboratory collaboration.', true, 1, CURRENT_TIMESTAMP),
    ('page-contact',  'contact',        'page',     '联系我们', 'Contact Us', '如有任何问题，请通过以下方式联系我们。', 'Please contact us through the following channels.', true, 2, CURRENT_TIMESTAMP),
    ('page-patent',   'patent-services','page',     '专利服务', 'Patent Services', '专业知识产权服务，助力科技创新与保护。', 'Professional IP services to empower innovation and protection.', true, 3, CURRENT_TIMESTAMP),
    ('page-paper',    'paper-services', 'page',     '论文服务', 'Paper Services', '专业学术论文服务，助力科研成果发表。', 'Professional academic paper services to help research publications.', true, 4, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

-- ------------------------------------------------------------------
-- 3. Homepage Sections
-- ------------------------------------------------------------------

-- Hero section
INSERT INTO "CMSSection" ("id", "pageId", "sectionKey", "name", "titleZh", "titleEn", "subtitleZh", "subtitleEn", "descriptionZh", "descriptionEn", "badgeZh", "badgeEn", "imageUrl", "layoutType", "styleVariant", "isEnabled", "isPublished", "sortOrder")
SELECT
    'sec-home-hero', p.id, 'hero', '首页主横幅', '度量衡科研平台', 'DuLiangHeng Research Platform', '立足科学前沿，服务中国创新', 'At the Frontier of Science, Serving Chinese Innovation', '一站式科研检测与实验室协同服务平台，连接高校、科研院所与顶尖检测实验室。', 'A one-stop research testing and laboratory collaboration platform connecting universities, research institutes and top testing labs.', '国家科研与检测协同服务入口', 'National Research & Testing Portal', '/images/hero-bg.jpg', 'banner', 'dark', true, true, 0
FROM "CMSPage" p WHERE p.slug = 'homepage'
ON CONFLICT ("id") DO NOTHING;

-- Service Categories
INSERT INTO "CMSSection" ("id", "pageId", "sectionKey", "name", "titleZh", "titleEn", "subtitleZh", "subtitleEn", "layoutType", "styleVariant", "isEnabled", "isPublished", "sortOrder")
SELECT
    'sec-home-cats', p.id, 'service_categories', '服务分类', '服务分类', 'Service Categories', '按研究与检测方向快速进入', 'Quick access by research and testing direction', 'grid', 'light', true, true, 1
FROM "CMSPage" p WHERE p.slug = 'homepage'
ON CONFLICT ("id") DO NOTHING;

-- Stats Banner
INSERT INTO "CMSSection" ("id", "pageId", "sectionKey", "name", "titleZh", "titleEn", "subtitleZh", "subtitleEn", "layoutType", "styleVariant", "isEnabled", "isPublished", "sortOrder")
SELECT
    'sec-home-stats', p.id, 'stats_banner', '核心数据', '用数据说话', 'By the Numbers', '让科研检测更高效', 'Making Research Testing More Efficient', 'grid', 'primary', true, true, 2
FROM "CMSPage" p WHERE p.slug = 'homepage'
ON CONFLICT ("id") DO NOTHING;

-- Advantages
INSERT INTO "CMSSection" ("id", "pageId", "sectionKey", "name", "titleZh", "titleEn", "subtitleZh", "subtitleEn", "layoutType", "styleVariant", "isEnabled", "isPublished", "sortOrder")
SELECT
    'sec-home-advantages', p.id, 'advantages', '平台核心优势', '平台核心优势', 'Core Advantages', '专业、权威、可信赖的科研检测服务', 'Professional, Authoritative, Trustworthy', 'grid', 'light', true, true, 3
FROM "CMSPage" p WHERE p.slug = 'homepage'
ON CONFLICT ("id") DO NOTHING;

-- Why Choose Us
INSERT INTO "CMSSection" ("id", "pageId", "sectionKey", "name", "titleZh", "titleEn", "subtitleZh", "subtitleEn", "layoutType", "styleVariant", "isEnabled", "isPublished", "sortOrder")
SELECT
    'sec-home-why', p.id, 'why_choose_us', '为什么选择我们', '为什么选择我们', 'Why Choose Us', '用数据说话，让科研检测更高效', 'Making Research Testing More Efficient with Data', 'grid', 'light', true, true, 4
FROM "CMSPage" p WHERE p.slug = 'homepage'
ON CONFLICT ("id") DO NOTHING;

-- Labs
INSERT INTO "CMSSection" ("id", "pageId", "sectionKey", "name", "titleZh", "titleEn", "subtitleZh", "subtitleEn", "layoutType", "styleVariant", "isEnabled", "isPublished", "sortOrder")
SELECT
    'sec-home-labs', p.id, 'labs', '前沿实验室', '前沿实验室', 'Frontier Laboratories', '领先的科研检测实验室网络', 'Leading Research Testing Laboratory Network', 'grid', 'light', true, true, 5
FROM "CMSPage" p WHERE p.slug = 'homepage'
ON CONFLICT ("id") DO NOTHING;

-- Partners
INSERT INTO "CMSSection" ("id", "pageId", "sectionKey", "name", "titleZh", "titleEn", "subtitleZh", "subtitleEn", "layoutType", "styleVariant", "isEnabled", "isPublished", "sortOrder")
SELECT
    'sec-home-partners', p.id, 'partners', '合作伙伴生态', '合作伙伴生态', 'Partner Ecosystem', '优先服务高校、科研院所、企业研发部门', 'Prioritizing Universities, Research Institutes, and R&D Departments', 'cards', 'light', true, true, 6
FROM "CMSPage" p WHERE p.slug = 'homepage'
ON CONFLICT ("id") DO NOTHING;

-- Sample Showcase (NEW)
INSERT INTO "CMSSection" ("id", "pageId", "sectionKey", "name", "titleZh", "titleEn", "subtitleZh", "subtitleEn", "layoutType", "styleVariant", "isEnabled", "isPublished", "sortOrder")
SELECT
    'sec-home-samples', p.id, 'sample_showcase', '样品展示', '典型样品与案例', 'Typical Samples & Cases', '覆盖材料、生物、环境、能源等多领域样品测试', 'Covering materials, biology, environment, energy and more', 'grid', 'light', true, true, 7
FROM "CMSPage" p WHERE p.slug = 'homepage'
ON CONFLICT ("id") DO NOTHING;

-- Equipment Showcase (NEW)
INSERT INTO "CMSSection" ("id", "pageId", "sectionKey", "name", "titleZh", "titleEn", "subtitleZh", "subtitleEn", "layoutType", "styleVariant", "isEnabled", "isPublished", "sortOrder")
SELECT
    'sec-home-equipment', p.id, 'equipment_showcase', '设备展示', '高端检测设备', 'Advanced Equipment', '国际领先的检测与分析仪器设备', 'World-leading testing and analysis instruments', 'grid', 'light', true, true, 8
FROM "CMSPage" p WHERE p.slug = 'homepage'
ON CONFLICT ("id") DO NOTHING;

-- ------------------------------------------------------------------
-- 4. Patent Services Sections
-- ------------------------------------------------------------------
INSERT INTO "CMSSection" ("id", "pageId", "sectionKey", "name", "titleZh", "titleEn", "subtitleZh", "subtitleEn", "layoutType", "styleVariant", "isEnabled", "isPublished", "sortOrder")
SELECT
    'sec-patent-hero', p.id, 'hero', '专利服务主横幅', '专利服务', 'Patent Services', '专业知识产权服务，助力科技创新与保护', 'Professional IP services to empower innovation and protection', 'banner', 'dark', true, true, 0
FROM "CMSPage" p WHERE p.slug = 'patent-services'
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CMSSection" ("id", "pageId", "sectionKey", "name", "titleZh", "titleEn", "subtitleZh", "subtitleEn", "layoutType", "styleVariant", "isEnabled", "isPublished", "sortOrder")
SELECT
    'sec-patent-features', p.id, 'features', '专利服务项目', '我们的服务项目', 'Our Services', '从申请到维权的一站式专利解决方案', 'One-stop patent solutions from application to enforcement', 'grid', 'light', true, true, 1
FROM "CMSPage" p WHERE p.slug = 'patent-services'
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CMSSection" ("id", "pageId", "sectionKey", "name", "titleZh", "titleEn", "subtitleZh", "subtitleEn", "layoutType", "styleVariant", "isEnabled", "isPublished", "sortOrder")
SELECT
    'sec-patent-cta', p.id, 'cta', '联系我们', '立即咨询专利服务', 'Contact Us Now', '获取专属知识产权顾问一对一服务', 'Get one-on-one IP consultant service', 'banner', 'primary', true, true, 2
FROM "CMSPage" p WHERE p.slug = 'patent-services'
ON CONFLICT ("id") DO NOTHING;

-- ------------------------------------------------------------------
-- 5. Paper Services Sections
-- ------------------------------------------------------------------
INSERT INTO "CMSSection" ("id", "pageId", "sectionKey", "name", "titleZh", "titleEn", "subtitleZh", "subtitleEn", "layoutType", "styleVariant", "isEnabled", "isPublished", "sortOrder")
SELECT
    'sec-paper-hero', p.id, 'hero', '论文服务主横幅', '论文服务', 'Paper Services', '专业学术论文服务，助力科研成果发表', 'Professional academic paper services to help research publications', 'banner', 'dark', true, true, 0
FROM "CMSPage" p WHERE p.slug = 'paper-services'
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CMSSection" ("id", "pageId", "sectionKey", "name", "titleZh", "titleEn", "subtitleZh", "subtitleEn", "layoutType", "styleVariant", "isEnabled", "isPublished", "sortOrder")
SELECT
    'sec-paper-features', p.id, 'features', '论文服务项目', '我们的服务项目', 'Our Services', '从选题到发表的全流程论文支持', 'Full-process paper support from topic selection to publication', 'grid', 'light', true, true, 1
FROM "CMSPage" p WHERE p.slug = 'paper-services'
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CMSSection" ("id", "pageId", "sectionKey", "name", "titleZh", "titleEn", "subtitleZh", "subtitleEn", "layoutType", "styleVariant", "isEnabled", "isPublished", "sortOrder")
SELECT
    'sec-paper-cta', p.id, 'cta', '联系我们', '立即咨询论文服务', 'Contact Us Now', '获取专属学术顾问一对一服务', 'Get one-on-one academic consultant service', 'banner', 'primary', true, true, 2
FROM "CMSPage" p WHERE p.slug = 'paper-services'
ON CONFLICT ("id") DO NOTHING;

-- ------------------------------------------------------------------
-- 6. Homepage Section Items
-- ------------------------------------------------------------------

-- Service Category items
INSERT INTO "CMSSectionItem" ("id", "sectionId", "titleZh", "titleEn", "icon", "linkUrl", "sortOrder", "isEnabled")
VALUES
    ('cat-001', 'sec-home-cats', '前沿测试', 'Frontier Testing', '🔬', 'frontier-testing', 0, true),
    ('cat-002', 'sec-home-cats', '化学成分测试', 'Chemical Composition', '🧪', 'chemical-composition', 1, true),
    ('cat-003', 'sec-home-cats', '电化学测试', 'Electrochemical', '⚡', 'electrochemical', 2, true),
    ('cat-004', 'sec-home-cats', '环境测试', 'Environmental', '🌿', 'environmental', 3, true),
    ('cat-005', 'sec-home-cats', '生物测试', 'Biological', '🧬', 'biological', 4, true),
    ('cat-006', 'sec-home-cats', '材料微观分析', 'Microscopic Analysis', '🔍', 'microscopic-analysis', 5, true),
    ('cat-007', 'sec-home-cats', '专利服务', 'Patent Services', '📄', 'patent-services', 6, true),
    ('cat-008', 'sec-home-cats', '论文服务', 'Paper Services', '📝', 'paper-services', 7, true),
    ('cat-009', 'sec-home-cats', '可靠性测试', 'Reliability Testing', '🛡️', 'reliability-testing', 8, true),
    ('cat-010', 'sec-home-cats', '标准认证', 'Standard Certification', '✅', 'standard-certification', 9, true)
ON CONFLICT ("id") DO NOTHING;

-- Stats banner items
INSERT INTO "CMSSectionItem" ("id", "sectionId", "titleZh", "titleEn", "value", "sortOrder", "isEnabled")
VALUES
    ('stat-001', 'sec-home-stats', '合作单位', 'Partner Units', '4000+', 0, true),
    ('stat-002', 'sec-home-stats', '样品测试', 'Samples Tested', '220w+', 1, true),
    ('stat-003', 'sec-home-stats', '服务客户', 'Served Customers', '84w+', 2, true),
    ('stat-004', 'sec-home-stats', '平均测试周期', 'Avg Turnaround', '4.1天', 3, true)
ON CONFLICT ("id") DO NOTHING;

-- Advantages items
INSERT INTO "CMSSectionItem" ("id", "sectionId", "titleZh", "titleEn", "descriptionZh", "descriptionEn", "icon", "sortOrder", "isEnabled")
VALUES
    ('adv-001', 'sec-home-advantages', '权威认证', 'Authoritative Certifications', 'CNAS实验室认可、CMA资质认定、HTE高新技术企业认证、ISO9001质量管理认证。', 'CNAS, CMA, HTE High-Tech Enterprise, ISO9001 certifications.', 'Award', 0, true),
    ('adv-002', 'sec-home-advantages', '先进平台', 'Advanced Platform', '全球顶级专家团队，一对一全流程定制服务，客户复购及推荐率＞87%。', 'World-class expert team, one-on-one customized service, >87% repurchase rate.', 'Users', 1, true),
    ('adv-003', 'sec-home-advantages', '专业服务', 'Professional Service', '先测试后付费，免费上门取样/异地邮寄到付，专属技术顾问。', 'Pay after testing, free pickup/mail-in, dedicated technical consultant.', 'FlaskConical', 2, true),
    ('adv-004', 'sec-home-advantages', '客户信任', 'Customer Trust', '60%项目测试周期3.3天，40%项目到样当天测试，服务6000+科研院所。', '60% projects in 3.3 days, 40% same-day testing, serving 6000+ institutes.', 'Star', 3, true)
ON CONFLICT ("id") DO NOTHING;

-- Advantage detail points
INSERT INTO "CMSSectionItemPoint" ("id", "itemId", "textZh", "textEn", "sortOrder", "isEnabled")
VALUES
    ('pt-adv1-01', 'adv-001', 'CNAS实验室认可', 'CNAS Laboratory Accreditation', 0, true),
    ('pt-adv1-02', 'adv-001', 'CMA资质认定', 'CMA Qualification', 1, true),
    ('pt-adv1-03', 'adv-001', 'HTE高新技术企业认证', 'HTE High-Tech Certification', 2, true),
    ('pt-adv1-04', 'adv-001', 'ISO9001质量管理认证', 'ISO9001 Quality Management', 3, true),

    ('pt-adv2-01', 'adv-002', '全球顶级专家团队', 'World-Class Expert Team', 0, true),
    ('pt-adv2-02', 'adv-002', '一对一全流程定制服务', 'One-on-One Customized Service', 1, true),
    ('pt-adv2-03', 'adv-002', '客户复购及推荐率＞87%', 'Repurchase & Referral >87%', 2, true),
    ('pt-adv2-04', 'adv-002', '测试服务满意度超93.2%', 'Satisfaction >93.2%', 3, true),

    ('pt-adv3-01', 'adv-003', '先测试后付费', 'Pay After Testing', 0, true),
    ('pt-adv3-02', 'adv-003', '免费上门取样 / 异地邮寄到付', 'Free Pickup / Mail-In', 1, true),
    ('pt-adv3-03', 'adv-003', '专属技术顾问', 'Dedicated Consultant', 2, true),
    ('pt-adv3-04', 'adv-003', '数据真实可溯源', 'Traceable Data', 3, true),

    ('pt-adv4-01', 'adv-004', '60%项目测试周期3.3天', '60% Projects in 3.3 Days', 0, true),
    ('pt-adv4-02', 'adv-004', '40%项目到样当天测试', '40% Same-Day Testing', 1, true),
    ('pt-adv4-03', 'adv-004', '专业技术咨询服务', 'Professional Consulting', 2, true),
    ('pt-adv4-04', 'adv-004', '服务6000+科研院所', '6000+ Institutes Served', 3, true)
ON CONFLICT ("id") DO NOTHING;

-- Why Choose Us items (stats)
INSERT INTO "CMSSectionItem" ("id", "sectionId", "titleZh", "titleEn", "subtitleZh", "subtitleEn", "value", "sortOrder", "isEnabled")
VALUES
    ('why-001', 'sec-home-why', '合作实验室', 'Partner Labs', '覆盖全国重点城市', 'Covering major cities nationwide', '3000+', 0, true),
    ('why-002', 'sec-home-why', '平均测试周期', 'Avg Turnaround', '天', 'Days', '4.2', 1, true),
    ('why-003', 'sec-home-why', '累计测试样品', 'Samples Tested', '覆盖全学科领域', 'Covering all disciplines', '158W+', 2, true),
    ('why-004', 'sec-home-why', '专业检测设备', 'Testing Equipment', '高端进口仪器', 'High-end imported instruments', '700+', 3, true),
    ('why-005', 'sec-home-why', '服务科研人员', 'Researchers Served', '好评率超98%', 'Over 98% positive reviews', '76W+', 4, true)
ON CONFLICT ("id") DO NOTHING;

-- Office cities (plain items under why_choose_us with no value)
INSERT INTO "CMSSectionItem" ("id", "sectionId", "titleZh", "titleEn", "sortOrder", "isEnabled")
VALUES
    ('city-001', 'sec-home-why', '北京', 'Beijing', 5, true),
    ('city-002', 'sec-home-why', '上海', 'Shanghai', 6, true),
    ('city-003', 'sec-home-why', '广州', 'Guangzhou', 7, true),
    ('city-004', 'sec-home-why', '深圳', 'Shenzhen', 8, true),
    ('city-005', 'sec-home-why', '杭州', 'Hangzhou', 9, true),
    ('city-006', 'sec-home-why', '南京', 'Nanjing', 10, true),
    ('city-007', 'sec-home-why', '武汉', 'Wuhan', 11, true),
    ('city-008', 'sec-home-why', '成都', 'Chengdu', 12, true),
    ('city-009', 'sec-home-why', '西安', 'Xi’an', 13, true),
    ('city-010', 'sec-home-why', '天津', 'Tianjin', 14, true)
ON CONFLICT ("id") DO NOTHING;

-- Labs items
INSERT INTO "CMSSectionItem" ("id", "sectionId", "titleZh", "titleEn", "subtitleZh", "subtitleEn", "descriptionZh", "descriptionEn", "sortOrder", "isEnabled")
VALUES
    ('lab-item-001', 'sec-home-labs', '先进电池研发实验室', 'Advanced Battery R&D Lab', '南京', 'Nanjing', '电池测试，性能分析', 'Battery testing and performance analysis', 0, true),
    ('lab-item-002', 'sec-home-labs', '能源材料表征实验室', 'Energy Material Characterization Lab', '上海', 'Shanghai', '材料表征，化学分析', 'Material characterization and chemical analysis', 1, true),
    ('lab-item-003', 'sec-home-labs', '清洁能源转化实验室', 'Clean Energy Conversion Lab', '镇江', 'Zhenjiang', '材料表征，化学分析', 'Material characterization and chemical analysis', 2, true),
    ('lab-item-004', 'sec-home-labs', '智能检测装备实验室', 'Intelligent Detection Equipment Lab', '苏州', 'Suzhou', '无损检测，可靠性分析', 'Non-destructive testing and reliability analysis', 3, true)
ON CONFLICT ("id") DO NOTHING;

-- Partner ecosystem items
INSERT INTO "CMSSectionItem" ("id", "sectionId", "titleZh", "titleEn", "subtitleZh", "subtitleEn", "icon", "sortOrder", "isEnabled")
VALUES
    ('part-001', 'sec-home-partners', '高校合作', 'University Cooperation', '重点优先', 'Priority', 'GraduationCap', 0, true),
    ('part-002', 'sec-home-partners', '企业合作', 'Enterprise Cooperation', '产业创新协同', 'Industry Innovation', 'Building2', 1, true),
    ('part-003', 'sec-home-partners', '检测与支撑单位', 'Testing & Support Units', '协同服务网络', 'Collaborative Network', 'Landmark', 2, true)
ON CONFLICT ("id") DO NOTHING;

-- Partner ecosystem points
INSERT INTO "CMSSectionItemPoint" ("id", "itemId", "textZh", "textEn", "sortOrder", "isEnabled")
VALUES
    ('pt-part1-01', 'part-001', '重点实验室共享服务', 'Key Lab Sharing Services', 0, true),
    ('pt-part1-02', 'part-001', '科研课题测试支撑', 'Research Project Testing Support', 1, true),
    ('pt-part1-03', 'part-001', '高校仪器开放合作', 'University Instrument Collaboration', 2, true),

    ('pt-part2-01', 'part-002', '研发测试与中试验证', 'R&D Testing and Pilot Validation', 0, true),
    ('pt-part2-02', 'part-002', '供应链质量评价', 'Supply Chain Quality Evaluation', 1, true),
    ('pt-part2-03', 'part-002', '批量委托与年度协议', 'Batch Contracts and Annual Agreements', 2, true),

    ('pt-part3-01', 'part-003', '第三方检测机构', 'Third-Party Testing Organizations', 0, true),
    ('pt-part3-02', 'part-003', '行业技术中心', 'Industry Technology Centers', 1, true),
    ('pt-part3-03', 'part-003', '公共实验平台', 'Public Experiment Platforms', 2, true)
ON CONFLICT ("id") DO NOTHING;

-- Sample Showcase items
INSERT INTO "CMSSectionItem" ("id", "sectionId", "titleZh", "titleEn", "descriptionZh", "descriptionEn", "imageUrl", "sortOrder", "isEnabled")
VALUES
    ('sample-001', 'sec-home-samples', '新能源材料样品', 'New Energy Material Samples', '锂电池正极材料、隔膜、电解液等关键材料成分与性能测试。', 'Testing of cathode materials, separators, electrolytes for lithium batteries.', '/images/sample-energy.jpg', 0, true),
    ('sample-002', 'sec-home-samples', '生物医疗样品', 'Biomedical Samples', '医疗器械、生物材料、药物载体的理化性能与生物相容性评价。', 'Physicochemical and biocompatibility evaluation of medical devices and biomaterials.', '/images/sample-bio.jpg', 1, true),
    ('sample-003', 'sec-home-samples', '环境土壤/水质样品', 'Environmental Soil/Water Samples', '土壤重金属、水质污染物、大气颗粒物等环境要素精确检测。', 'Precise detection of heavy metals, water pollutants, and atmospheric particulates.', '/images/sample-env.jpg', 2, true)
ON CONFLICT ("id") DO NOTHING;

-- Equipment Showcase items
INSERT INTO "CMSSectionItem" ("id", "sectionId", "titleZh", "titleEn", "descriptionZh", "descriptionEn", "imageUrl", "sortOrder", "isEnabled")
VALUES
    ('equip-001', 'sec-home-equipment', '场发射扫描电子显微镜', 'FE-SEM', '高分辨率表面形貌观察与微区成分分析，适用于材料、生物、半导体等领域。', 'High-resolution surface morphology and micro-area composition analysis.', '/images/equip-sem.jpg', 0, true),
    ('equip-002', 'sec-home-equipment', 'X射线光电子能谱仪', 'XPS', '表面元素组成、化学态及定量分析，深度剖析薄膜与涂层结构。', 'Surface elemental composition, chemical state and quantitative analysis.', '/images/equip-xps.jpg', 1, true),
    ('equip-003', 'sec-home-equipment', '电感耦合等离子体质谱仪', 'ICP-MS', '超痕量元素分析与同位素比值测定，检测限可达ppb-ppt级别。', 'Ultra-trace elemental analysis and isotope ratio determination.', '/images/equip-icpms.jpg', 2, true)
ON CONFLICT ("id") DO NOTHING;

-- ------------------------------------------------------------------
-- 7. Patent Services Items
-- ------------------------------------------------------------------
INSERT INTO "CMSSectionItem" ("id", "sectionId", "titleZh", "titleEn", "descriptionZh", "descriptionEn", "icon", "sortOrder", "isEnabled")
VALUES
    ('patent-feat-001', 'sec-patent-features', '专利申请代理', 'Patent Application Agency', '专业专利申请代理服务，包括发明专利、实用新型、外观设计等全类型专利申请。', 'Professional patent application agency covering invention, utility model and design patents.', 'FileText', 0, true),
    ('patent-feat-002', 'sec-patent-features', '专利无效宣告', 'Patent Invalidation', '针对现有专利进行无效宣告程序，帮助客户维护自身权益。', 'Invalidation procedures for existing patents to protect client interests.', 'ShieldCheck', 1, true),
    ('patent-feat-003', 'sec-patent-features', '专利侵权分析', 'Patent Infringement Analysis', '提供专利侵权风险评估和侵权判定分析服务。', 'Patent infringement risk assessment and determination analysis.', 'Search', 2, true),
    ('patent-feat-004', 'sec-patent-features', '专利布局规划', 'Patent Portfolio Planning', '为企业提供专利战略规划和专利组合构建服务。', 'Patent strategy planning and portfolio construction for enterprises.', 'Award', 3, true)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CMSSectionItemPoint" ("id", "itemId", "textZh", "textEn", "sortOrder", "isEnabled")
VALUES
    ('pt-pat1-01', 'patent-feat-001', '专利检索', 'Patent Search', 0, true),
    ('pt-pat1-02', 'patent-feat-001', '申请文件撰写', 'Application Drafting', 1, true),
    ('pt-pat1-03', 'patent-feat-001', '审查意见答复', 'Examination Opinion Response', 2, true),
    ('pt-pat1-04', 'patent-feat-001', '年费监控', 'Annual Fee Monitoring', 3, true),

    ('pt-pat2-01', 'patent-feat-002', '专利分析', 'Patent Analysis', 0, true),
    ('pt-pat2-02', 'patent-feat-002', '无效理由撰写', 'Invalidation Reason Drafting', 1, true),
    ('pt-pat2-03', 'patent-feat-002', '复审程序', 'Reexamination Procedure', 2, true),
    ('pt-pat2-04', 'patent-feat-002', '法律支持', 'Legal Support', 3, true),

    ('pt-pat3-01', 'patent-feat-003', '侵权比对', 'Infringement Comparison', 0, true),
    ('pt-pat3-02', 'patent-feat-003', '风险评估', 'Risk Assessment', 1, true),
    ('pt-pat3-03', 'patent-feat-003', '法律意见', 'Legal Opinion', 2, true),
    ('pt-pat3-04', 'patent-feat-003', '应对策略', 'Response Strategy', 3, true),

    ('pt-pat4-01', 'patent-feat-004', '技术分析', 'Technical Analysis', 0, true),
    ('pt-pat4-02', 'patent-feat-004', '竞争分析', 'Competitive Analysis', 1, true),
    ('pt-pat4-03', 'patent-feat-004', '专利地图', 'Patent Mapping', 2, true),
    ('pt-pat4-04', 'patent-feat-004', '战略建议', 'Strategic Recommendations', 3, true)
ON CONFLICT ("id") DO NOTHING;

-- ------------------------------------------------------------------
-- 8. Paper Services Items
-- ------------------------------------------------------------------
INSERT INTO "CMSSectionItem" ("id", "sectionId", "titleZh", "titleEn", "descriptionZh", "descriptionEn", "icon", "sortOrder", "isEnabled")
VALUES
    ('paper-feat-001', 'sec-paper-features', '论文撰写指导', 'Paper Writing Guidance', '专业学术论文撰写指导服务，帮助科研人员完成高质量论文。', 'Professional academic paper writing guidance for high-quality research papers.', 'BookOpen', 0, true),
    ('paper-feat-002', 'sec-paper-features', '论文翻译服务', 'Paper Translation', '中英文论文翻译服务，支持SCI论文翻译和润色。', 'Chinese-English paper translation and polishing for SCI journals.', 'Globe', 1, true),
    ('paper-feat-003', 'sec-paper-features', '论文发表指导', 'Publication Guidance', '期刊选择、投稿指导、审稿回复等全流程发表服务。', 'Full-process publication support from journal selection to submission.', 'Send', 2, true),
    ('paper-feat-004', 'sec-paper-features', '数据分析服务', 'Data Analysis', '论文数据统计分析、图表制作、可视化服务。', 'Statistical analysis, chart production and visualization for papers.', 'BarChart', 3, true)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CMSSectionItemPoint" ("id", "itemId", "textZh", "textEn", "sortOrder", "isEnabled")
VALUES
    ('pt-pap1-01', 'paper-feat-001', '选题指导', 'Topic Guidance', 0, true),
    ('pt-pap1-02', 'paper-feat-001', '结构设计', 'Structure Design', 1, true),
    ('pt-pap1-03', 'paper-feat-001', '内容撰写', 'Content Writing', 2, true),
    ('pt-pap1-04', 'paper-feat-001', '语言润色', 'Language Polishing', 3, true),

    ('pt-pap2-01', 'paper-feat-002', '专业翻译', 'Professional Translation', 0, true),
    ('pt-pap2-02', 'paper-feat-002', '学术润色', 'Academic Polishing', 1, true),
    ('pt-pap2-03', 'paper-feat-002', '格式调整', 'Formatting', 2, true),
    ('pt-pap2-04', 'paper-feat-002', '审校把关', 'Proofreading', 3, true),

    ('pt-pap3-01', 'paper-feat-003', '期刊推荐', 'Journal Recommendation', 0, true),
    ('pt-pap3-02', 'paper-feat-003', '投稿指导', 'Submission Guidance', 1, true),
    ('pt-pap3-03', 'paper-feat-003', '审稿回复', 'Peer Review Response', 2, true),
    ('pt-pap3-04', 'paper-feat-003', '修改建议', 'Revision Suggestions', 3, true),

    ('pt-pap4-01', 'paper-feat-004', '统计分析', 'Statistical Analysis', 0, true),
    ('pt-pap4-02', 'paper-feat-004', '图表制作', 'Chart Production', 1, true),
    ('pt-pap4-03', 'paper-feat-004', '结果解读', 'Result Interpretation', 2, true),
    ('pt-pap4-04', 'paper-feat-004', '方法描述', 'Method Description', 3, true)
ON CONFLICT ("id") DO NOTHING;
