import { prisma } from '../src/lib/db';

async function main() {
  const homepage = await prisma.cMSPage.findUnique({ where: { slug: 'homepage' } });
  if (!homepage) {
    console.error('Homepage not found');
    process.exit(1);
  }
  const pageId = homepage.id;

  // Sections
  const sections = [
    { id: 'sec-home-hero', sectionKey: 'hero', name: '首页主横幅', titleZh: '度量衡科研平台', subtitleZh: '立足科学前沿，服务中国创新', descriptionZh: '一站式科研检测与实验室协同服务平台，连接高校、科研院所与顶尖检测实验室。', badgeZh: '国家科研与检测协同服务入口', imageUrl: '/images/hero-bg.jpg', layoutType: 'banner', styleVariant: 'dark', sortOrder: 0 },
    { id: 'sec-home-cats', sectionKey: 'service_categories', name: '服务分类', titleZh: '服务分类', subtitleZh: '按研究与检测方向快速进入', layoutType: 'grid', styleVariant: 'light', sortOrder: 1 },
    { id: 'sec-home-stats', sectionKey: 'stats_banner', name: '核心数据', titleZh: '用数据说话', subtitleZh: '让科研检测更高效', layoutType: 'grid', styleVariant: 'primary', sortOrder: 2 },
    { id: 'sec-home-advantages', sectionKey: 'advantages', name: '平台核心优势', titleZh: '平台核心优势', subtitleZh: '专业、权威、可信赖的科研检测服务', layoutType: 'grid', styleVariant: 'light', sortOrder: 3 },
    { id: 'sec-home-why', sectionKey: 'why_choose_us', name: '为什么选择我们', titleZh: '为什么选择我们', subtitleZh: '用数据说话，让科研检测更高效', layoutType: 'grid', styleVariant: 'light', sortOrder: 4 },
    { id: 'sec-home-labs', sectionKey: 'labs', name: '前沿实验室', titleZh: '前沿实验室', subtitleZh: '领先的科研检测实验室网络', layoutType: 'grid', styleVariant: 'light', sortOrder: 5 },
    { id: 'sec-home-partners', sectionKey: 'partners', name: '合作伙伴生态', titleZh: '合作伙伴生态', subtitleZh: '优先服务高校、科研院所、企业研发部门', layoutType: 'cards', styleVariant: 'light', sortOrder: 6 },
  ];

  for (const s of sections) {
    await prisma.cMSSection.upsert({
      where: { id: s.id },
      update: { ...s, pageId },
      create: { ...s, pageId, isPublished: true, isEnabled: true },
    });
  }
  console.log('Sections seeded');

  // Items
  const items = [
    // Service categories
    { id: 'cat-001', sectionId: 'sec-home-cats', titleZh: '前沿测试', icon: '🔬', linkUrl: '/services/categories/frontier-testing', sortOrder: 0 },
    { id: 'cat-002', sectionId: 'sec-home-cats', titleZh: '化学成分测试', icon: '🧪', linkUrl: '/services/categories/chemical-composition', sortOrder: 1 },
    { id: 'cat-003', sectionId: 'sec-home-cats', titleZh: '电化学测试', icon: '⚡', linkUrl: '/services/categories/electrochemical', sortOrder: 2 },
    { id: 'cat-004', sectionId: 'sec-home-cats', titleZh: '环境测试', icon: '🌿', linkUrl: '/services/categories/environmental', sortOrder: 3 },
    { id: 'cat-005', sectionId: 'sec-home-cats', titleZh: '生物测试', icon: '🧬', linkUrl: '/services/categories/biological', sortOrder: 4 },
    { id: 'cat-006', sectionId: 'sec-home-cats', titleZh: '材料微观分析', icon: '🔍', linkUrl: '/services/categories/microscopic-analysis', sortOrder: 5 },
    { id: 'cat-007', sectionId: 'sec-home-cats', titleZh: '专利服务', icon: '📄', linkUrl: '/services/categories/patent-services', sortOrder: 6 },
    { id: 'cat-008', sectionId: 'sec-home-cats', titleZh: '论文服务', icon: '📝', linkUrl: '/services/categories/paper-services', sortOrder: 7 },
    { id: 'cat-009', sectionId: 'sec-home-cats', titleZh: '可靠性测试', icon: '🛡️', linkUrl: '/services/categories/reliability-testing', sortOrder: 8 },
    { id: 'cat-010', sectionId: 'sec-home-cats', titleZh: '标准认证', icon: '✅', linkUrl: '/services/categories/standard-certification', sortOrder: 9 },
    // Stats
    { id: 'stat-001', sectionId: 'sec-home-stats', titleZh: '合作单位', value: '4000+', sortOrder: 0 },
    { id: 'stat-002', sectionId: 'sec-home-stats', titleZh: '样品测试', value: '220w+', sortOrder: 1 },
    { id: 'stat-003', sectionId: 'sec-home-stats', titleZh: '服务客户', value: '84w+', sortOrder: 2 },
    { id: 'stat-004', sectionId: 'sec-home-stats', titleZh: '平均测试周期', value: '4.1天', sortOrder: 3 },
    // Advantages
    { id: 'adv-001', sectionId: 'sec-home-advantages', titleZh: '权威认证', descriptionZh: 'CNAS实验室认可、CMA资质认定、HTE高新技术企业认证、ISO9001质量管理认证。', icon: 'Award', sortOrder: 0 },
    { id: 'adv-002', sectionId: 'sec-home-advantages', titleZh: '先进平台', descriptionZh: '全球顶级专家团队，一对一全流程定制服务，客户复购及推荐率＞87%。', icon: 'Users', sortOrder: 1 },
    { id: 'adv-003', sectionId: 'sec-home-advantages', titleZh: '专业服务', descriptionZh: '先测试后付费，免费上门取样/异地邮寄到付，专属技术顾问。', icon: 'FlaskConical', sortOrder: 2 },
    { id: 'adv-004', sectionId: 'sec-home-advantages', titleZh: '客户信任', descriptionZh: '60%项目测试周期3.3天，40%项目到样当天测试，服务6000+科研院所。', icon: 'Star', sortOrder: 3 },
    // Why choose stats
    { id: 'why-001', sectionId: 'sec-home-why', titleZh: '合作实验室', subtitleZh: '覆盖全国重点城市', value: '3000+', sortOrder: 0 },
    { id: 'why-002', sectionId: 'sec-home-why', titleZh: '平均测试周期', subtitleZh: '天', value: '4.2', sortOrder: 1 },
    { id: 'why-003', sectionId: 'sec-home-why', titleZh: '累计测试样品', subtitleZh: '覆盖全学科领域', value: '158W+', sortOrder: 2 },
    { id: 'why-004', sectionId: 'sec-home-why', titleZh: '专业检测设备', subtitleZh: '高端进口仪器', value: '700+', sortOrder: 3 },
    { id: 'why-005', sectionId: 'sec-home-why', titleZh: '服务科研人员', subtitleZh: '好评率超98%', value: '76W+', sortOrder: 4 },
    // Office cities (plain items under why_choose_us with no value)
    { id: 'city-001', sectionId: 'sec-home-why', titleZh: '北京', sortOrder: 5 },
    { id: 'city-002', sectionId: 'sec-home-why', titleZh: '上海', sortOrder: 6 },
    { id: 'city-003', sectionId: 'sec-home-why', titleZh: '广州', sortOrder: 7 },
    { id: 'city-004', sectionId: 'sec-home-why', titleZh: '深圳', sortOrder: 8 },
    { id: 'city-005', sectionId: 'sec-home-why', titleZh: '杭州', sortOrder: 9 },
    { id: 'city-006', sectionId: 'sec-home-why', titleZh: '南京', sortOrder: 10 },
    { id: 'city-007', sectionId: 'sec-home-why', titleZh: '武汉', sortOrder: 11 },
    { id: 'city-008', sectionId: 'sec-home-why', titleZh: '成都', sortOrder: 12 },
    { id: 'city-009', sectionId: 'sec-home-why', titleZh: '西安', sortOrder: 13 },
    { id: 'city-010', sectionId: 'sec-home-why', titleZh: '天津', sortOrder: 14 },
    // Labs
    { id: 'lab-item-001', sectionId: 'sec-home-labs', titleZh: '先进电池研发实验室', subtitleZh: '南京', descriptionZh: '电池测试，性能分析', sortOrder: 0 },
    { id: 'lab-item-002', sectionId: 'sec-home-labs', titleZh: '能源材料表征实验室', subtitleZh: '上海', descriptionZh: '材料表征，化学分析', sortOrder: 1 },
    { id: 'lab-item-003', sectionId: 'sec-home-labs', titleZh: '清洁能源转化实验室', subtitleZh: '镇江', descriptionZh: '材料表征，化学分析', sortOrder: 2 },
    { id: 'lab-item-004', sectionId: 'sec-home-labs', titleZh: '智能检测装备实验室', subtitleZh: '苏州', descriptionZh: '无损检测，可靠性分析', sortOrder: 3 },
    // Partners
    { id: 'part-001', sectionId: 'sec-home-partners', titleZh: '高校合作', subtitleZh: '重点优先', icon: 'GraduationCap', sortOrder: 0 },
    { id: 'part-002', sectionId: 'sec-home-partners', titleZh: '企业合作', subtitleZh: '产业创新协同', icon: 'Building2', sortOrder: 1 },
    { id: 'part-003', sectionId: 'sec-home-partners', titleZh: '检测与支撑单位', subtitleZh: '协同服务网络', icon: 'Landmark', sortOrder: 2 },
  ];

  for (const i of items) {
    await prisma.cMSSectionItem.upsert({
      where: { id: i.id },
      update: i,
      create: { ...i, isEnabled: true },
    });
  }
  console.log('Items seeded');

  // Points
  const points = [
    { id: 'pt-adv1-01', itemId: 'adv-001', textZh: 'CNAS实验室认可', sortOrder: 0 },
    { id: 'pt-adv1-02', itemId: 'adv-001', textZh: 'CMA资质认定', sortOrder: 1 },
    { id: 'pt-adv1-03', itemId: 'adv-001', textZh: 'HTE高新技术企业认证', sortOrder: 2 },
    { id: 'pt-adv1-04', itemId: 'adv-001', textZh: 'ISO9001质量管理认证', sortOrder: 3 },
    { id: 'pt-adv2-01', itemId: 'adv-002', textZh: '全球顶级专家团队', sortOrder: 0 },
    { id: 'pt-adv2-02', itemId: 'adv-002', textZh: '一对一全流程定制服务', sortOrder: 1 },
    { id: 'pt-adv2-03', itemId: 'adv-002', textZh: '客户复购及推荐率＞87%', sortOrder: 2 },
    { id: 'pt-adv2-04', itemId: 'adv-002', textZh: '测试服务满意度超93.2%', sortOrder: 3 },
    { id: 'pt-adv3-01', itemId: 'adv-003', textZh: '先测试后付费', sortOrder: 0 },
    { id: 'pt-adv3-02', itemId: 'adv-003', textZh: '免费上门取样 / 异地邮寄到付', sortOrder: 1 },
    { id: 'pt-adv3-03', itemId: 'adv-003', textZh: '专属技术顾问', sortOrder: 2 },
    { id: 'pt-adv3-04', itemId: 'adv-003', textZh: '数据真实可溯源', sortOrder: 3 },
    { id: 'pt-adv4-01', itemId: 'adv-004', textZh: '60%项目测试周期3.3天', sortOrder: 0 },
    { id: 'pt-adv4-02', itemId: 'adv-004', textZh: '40%项目到样当天测试', sortOrder: 1 },
    { id: 'pt-adv4-03', itemId: 'adv-004', textZh: '专业技术咨询服务', sortOrder: 2 },
    { id: 'pt-adv4-04', itemId: 'adv-004', textZh: '服务6000+科研院所', sortOrder: 3 },
    { id: 'pt-part1-01', itemId: 'part-001', textZh: '重点实验室共享服务', sortOrder: 0 },
    { id: 'pt-part1-02', itemId: 'part-001', textZh: '科研课题测试支撑', sortOrder: 1 },
    { id: 'pt-part1-03', itemId: 'part-001', textZh: '高校仪器开放合作', sortOrder: 2 },
    { id: 'pt-part2-01', itemId: 'part-002', textZh: '研发测试与中试验证', sortOrder: 0 },
    { id: 'pt-part2-02', itemId: 'part-002', textZh: '供应链质量评价', sortOrder: 1 },
    { id: 'pt-part2-03', itemId: 'part-002', textZh: '批量委托与年度协议', sortOrder: 2 },
    { id: 'pt-part3-01', itemId: 'part-003', textZh: '第三方检测机构', sortOrder: 0 },
    { id: 'pt-part3-02', itemId: 'part-003', textZh: '行业技术中心', sortOrder: 1 },
    { id: 'pt-part3-03', itemId: 'part-003', textZh: '公共实验平台', sortOrder: 2 },
  ];

  for (const p of points) {
    await prisma.cMSSectionItemPoint.upsert({
      where: { id: p.id },
      update: p,
      create: { ...p, isEnabled: true },
    });
  }
  console.log('Points seeded');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
