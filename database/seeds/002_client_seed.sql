-- ============================================================
-- CLIENT DEMO / CATALOG SEED DATA
-- ============================================================
-- This file populates the service catalog with sample categories,
-- testing services, and laboratories so the site looks complete
-- on first launch.
--
-- You can freely edit the INSERT VALUES below to match your
-- real business data, or skip running this file entirely if
-- you prefer to create categories/services through the admin UI.
-- ============================================================

-- ------------------------------------------------------------------
-- 1. Service Categories
-- ------------------------------------------------------------------
-- These are the top-level menu items shown in the homepage
-- service-categories section and the main navigation.
INSERT INTO "ServiceCategory" ("id", "nameZh", "nameEn", "slug", "sortOrder", "isActive")
VALUES
    ('cat-001', '前沿测试',       'Frontier Testing',        'frontier-testing',        0, true),
    ('cat-002', '化学成分测试',   'Chemical Composition',    'chemical-composition',    1, true),
    ('cat-003', '电化学测试',     'Electrochemical',         'electrochemical',         2, true),
    ('cat-004', '环境测试',       'Environmental',           'environmental',           3, true),
    ('cat-005', '生物测试',       'Biological',              'biological',              4, true),
    ('cat-006', '材料微观分析',   'Microscopic Analysis',    'microscopic-analysis',    5, true),
    ('cat-007', '专利服务',       'Patent Services',         'patent-services',         6, true),
    ('cat-008', '论文服务',       'Paper Services',          'paper-services',          7, true),
    ('cat-009', '可靠性测试',     'Reliability Testing',     'reliability-testing',     8, true),
    ('cat-010', '标准认证',       'Standard Certification',  'standard-certification',  9, true)
ON CONFLICT ("id") DO NOTHING;

-- ------------------------------------------------------------------
-- 2. Testing Services
-- ------------------------------------------------------------------
-- Each service belongs to a category.  Adjust prices, descriptions,
-- and category mappings to match your real offering.
INSERT INTO "TestingService" (
    "id", "categoryId", "nameZh", "nameEn",
    "descriptionZh", "descriptionEn",
    "price", "unit", "durationDays",
    "isActive", "sortOrder"
)
VALUES
    -- 前沿测试
    ('svc-001', 'cat-001', '电池性能测试', 'Battery Performance Testing',
     '测试电池的容量、循环寿命、充放电效率等关键性能指标。',
     'Test battery capacity, cycle life, charge/discharge efficiency and more.',
     800.00, '组', 5, true, 0),
    ('svc-002', 'cat-001', '太阳能电池测试', 'Solar Cell Testing',
     '光电转换效率、I-V曲线、光谱响应等全面测试。',
     'Comprehensive tests including conversion efficiency, I-V curves, spectral response.',
     1200.00, '片', 7, true, 1),

    -- 化学成分测试
    ('svc-003', 'cat-002', 'ICP元素分析', 'ICP Elemental Analysis',
     '电感耦合等离子体发射光谱法，精准测定金属及非金属元素含量。',
     'ICP-OES based precise determination of metal and non-metal content.',
     500.00, '样', 3, true, 0),
    ('svc-004', 'cat-002', '有机质谱分析', 'Organic Mass Spectrometry',
     'GC-MS/LC-MS定性定量分析有机化合物。',
     'GC-MS/LC-MS qualitative and quantitative analysis of organic compounds.',
     900.00, '样', 4, true, 1),

    -- 电化学测试
    ('svc-005', 'cat-003', '电化学阻抗谱', 'EIS Testing',
     '电化学阻抗谱(EIS)测试，分析电极/电解质界面特性。',
     'Electrochemical Impedance Spectroscopy to analyze electrode/electrolyte interfaces.',
     600.00, '样', 3, true, 0),
    ('svc-006', 'cat-003', '循环伏安测试', 'Cyclic Voltammetry',
     'CV测试，研究电化学反应机理及动力学参数。',
     'Cyclic Voltammetry for reaction mechanism and kinetic parameter studies.',
     400.00, '样', 2, true, 1),

    -- 环境测试
    ('svc-007', 'cat-004', '水质重金属检测', 'Water Heavy Metal Testing',
     '检测水样中铅、镉、汞、砷等重金属含量，符合国标要求。',
     'Test lead, cadmium, mercury, arsenic in water samples per national standards.',
     350.00, '样', 3, true, 0),
    ('svc-008', 'cat-004', '土壤污染物检测', 'Soil Contaminant Testing',
     '土壤中挥发性有机物(VOCs)、半挥发性有机物(SVOCs)及重金属检测。',
     'Soil VOCs, SVOCs and heavy metal testing.',
     700.00, '样', 5, true, 1),

    -- 生物测试
    ('svc-009', 'cat-005', '细胞毒性测试', 'Cytotoxicity Testing',
     'MTT/CCK-8法评价材料或药物的细胞毒性。',
     'MTT/CCK-8 assay to evaluate cytotoxicity of materials or drugs.',
     650.00, '组', 4, true, 0),
    ('svc-010', 'cat-005', '抗菌性能测试', 'Antibacterial Performance Testing',
     '抑菌圈法、贴膜法等多种方法评价抗菌材料效果。',
     'Inhibition zone and film-coating methods to assess antibacterial effects.',
     550.00, '样', 4, true, 1),

    -- 材料微观分析
    ('svc-011', 'cat-006', '扫描电镜分析', 'SEM Analysis',
     '高分辨率表面形貌观察，配备EDS进行微区成分分析。',
     'High-resolution surface morphology observation with EDS micro-area analysis.',
     300.00, '样', 2, true, 0),
    ('svc-012', 'cat-006', '透射电镜分析', 'TEM Analysis',
     '纳米级形貌、晶体结构、高分辨成像分析。',
     'Nanoscale morphology, crystal structure and high-resolution imaging analysis.',
     800.00, '样', 5, true, 1),

    -- 可靠性测试
    ('svc-013', 'cat-009', '高低温循环测试', 'Thermal Cycling Test',
     '模拟极端温度环境，评估产品可靠性及寿命。',
     'Simulate extreme temperatures to evaluate product reliability and lifetime.',
     1000.00, '项', 7, true, 0),
    ('svc-014', 'cat-009', '盐雾腐蚀测试', 'Salt Spray Corrosion Test',
     '中性盐雾、酸性盐雾测试，评价材料耐腐蚀性能。',
     'Neutral and acidic salt spray tests to evaluate material corrosion resistance.',
     750.00, '样', 5, true, 1),

    -- 标准认证
    ('svc-015', 'cat-010', 'CNAS实验室认可咨询', 'CNAS Accreditation Consulting',
     '帮助实验室建立质量管理体系，顺利通过CNAS认可评审。',
     'Help labs build quality management systems and pass CNAS accreditation.',
     15000.00, '项', 30, true, 0),
    ('svc-016', 'cat-010', 'CMA资质认定咨询', 'CMA Qualification Consulting',
     '提供CMA计量认证全流程咨询服务。',
     'Full-process consulting service for CMA metrology accreditation.',
     12000.00, '项', 30, true, 1)
ON CONFLICT ("id") DO NOTHING;

-- ------------------------------------------------------------------
-- 3. Laboratories
-- ------------------------------------------------------------------
-- Sample labs shown in the homepage labs section and admin panel.
INSERT INTO "Lab" ("id", "nameZh", "nameEn", "locationZh", "locationEn", "descriptionZh", "descriptionEn", "isActive", "sortOrder")
VALUES
    ('lab-001', '先进电池研发实验室', 'Advanced Battery R&D Lab',
     '江苏省南京市', 'Nanjing, Jiangsu',
     '专注于动力电池、储能电池的性能测试与安全评估。',
     'Focused on power battery and energy storage battery testing and safety evaluation.',
     true, 0),

    ('lab-002', '能源材料表征实验室', 'Energy Material Characterization Lab',
     '上海市浦东新区', 'Pudong, Shanghai',
     '配备XRD、XPS、SEM、TEM等先进表征设备。',
     'Equipped with XRD, XPS, SEM, TEM and other advanced characterization instruments.',
     true, 1),

    ('lab-003', '清洁能源转化实验室', 'Clean Energy Conversion Lab',
     '江苏省镇江市', 'Zhenjiang, Jiangsu',
     '从事太阳能、氢能等清洁能源材料与器件研究测试。',
     'Engaged in research and testing of solar, hydrogen and other clean energy materials and devices.',
     true, 2),

    ('lab-004', '智能检测装备实验室', 'Intelligent Detection Equipment Lab',
     '江苏省苏州市', 'Suzhou, Jiangsu',
     '专注于无损检测、可靠性分析及智能检测装备开发。',
     'Focused on non-destructive testing, reliability analysis and intelligent detection equipment development.',
     true, 3)
ON CONFLICT ("id") DO NOTHING;
