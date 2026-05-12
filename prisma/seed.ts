import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

// Load environment variables FIRST
config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

// Hash password function
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data to avoid conflicts
  console.log('🧹 Cleaning existing data...');
  await prisma.reportDownload.deleteMany();
  await prisma.reportShareLink.deleteMany();
  await prisma.reportAttachment.deleteMany();
  await prisma.report.deleteMany();
  await prisma.sampleTimeline.deleteMany();
  await prisma.samplePhoto.deleteMany();
  await prisma.sample.deleteMany();
  await prisma.orderDocument.deleteMany();
  await prisma.orderTimeline.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.quotationRevision.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.rFQMessage.deleteMany();
  await prisma.rFQFile.deleteMany();
  await prisma.rFQRequest.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.serviceMaterial.deleteMany();
  await prisma.serviceIndustry.deleteMany();
  await prisma.serviceStandard.deleteMany();
  await prisma.labService.deleteMany();
  await prisma.testingService.deleteMany();
  await prisma.equipmentSchedule.deleteMany();
  await prisma.equipmentBooking.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.labMedia.deleteMany();
  await prisma.labUser.deleteMany();
  await prisma.laboratory.deleteMany();
  await prisma.technicianTask.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.invoiceProfile.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.companyWallet.deleteMany();
  await prisma.companyMembership.deleteMany();
  await prisma.company.deleteMany();
  await prisma.withdrawalRequest.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.referralCode.deleteMany();
  await prisma.referralConfig.deleteMany();
  await prisma.address.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.cMSPage.deleteMany();
  await prisma.translation.deleteMany();
  await prisma.serviceBundle.deleteMany();
  await prisma.testingStandard.deleteMany();
  await prisma.material.deleteMany();
  await prisma.industry.deleteMany();
  await prisma.serviceCategory.deleteMany();

  console.log('✅ Existing data cleaned');

  // Create Service Categories
  console.log('📁 Creating service categories...');
  const mechanicalCat = await prisma.serviceCategory.create({
    data: {
      slug: 'mechanical-testing',
      nameZh: '力学性能测试',
      nameEn: 'Mechanical Testing',
      descZh: '材料力学性能检测服务',
      descEn: 'Material mechanical property testing services',
      icon: '🔧',
      sortOrder: 1,
      isActive: true,
    },
  });

  const chemicalCat = await prisma.serviceCategory.create({
    data: {
      slug: 'chemical-analysis',
      nameZh: '化学成分分析',
      nameEn: 'Chemical Analysis',
      descZh: '材料化学成分检测',
      descEn: 'Material chemical composition analysis',
      icon: '🧪',
      sortOrder: 2,
      isActive: true,
    },
  });

  const environmentalCat = await prisma.serviceCategory.create({
    data: {
      slug: 'environmental-testing',
      nameZh: '环境模拟试验',
      nameEn: 'Environmental Testing',
      descZh: '环境可靠性测试',
      descEn: 'Environmental reliability testing',
      icon: '🌡️',
      sortOrder: 3,
      isActive: true,
    },
  });

  const ndtCat = await prisma.serviceCategory.create({
    data: {
      slug: 'non-destructive-testing',
      nameZh: '无损检测',
      nameEn: 'Non-Destructive Testing',
      descZh: '无损检测技术服务',
      descEn: 'NDT services',
      icon: '🔍',
      sortOrder: 4,
      isActive: true,
    },
  });

  const categories = [mechanicalCat, chemicalCat, environmentalCat, ndtCat];

  // Create Materials
  console.log('🧱 Creating materials...');
  const metalMat = await prisma.material.create({
    data: {
      slug: 'metal',
      nameZh: '金属材料',
      nameEn: 'Metal',
      descZh: '各类金属及合金',
      isActive: true,
      sortOrder: 1,
    },
  });

  const polymerMat = await prisma.material.create({
    data: {
      slug: 'polymer',
      nameZh: '高分子材料',
      nameEn: 'Polymer',
      descZh: '塑料、橡胶等高分子材料',
      isActive: true,
      sortOrder: 2,
    },
  });

  const compositeMat = await prisma.material.create({
    data: {
      slug: 'composite',
      nameZh: '复合材料',
      nameEn: 'Composite',
      descZh: '纤维增强复合材料',
      isActive: true,
      sortOrder: 3,
    },
  });

  const materials = [metalMat, polymerMat, compositeMat];

  // Create Industries
  console.log('🏭 Creating industries...');
  const automotiveInd = await prisma.industry.create({
    data: {
      slug: 'automotive',
      nameZh: '汽车工业',
      nameEn: 'Automotive',
      descZh: '汽车及零部件行业',
      isActive: true,
      sortOrder: 1,
    },
  });

  const aerospaceInd = await prisma.industry.create({
    data: {
      slug: 'aerospace',
      nameZh: '航空航天',
      nameEn: 'Aerospace',
      descZh: '航空航天工业',
      isActive: true,
      sortOrder: 2,
    },
  });

  const electronicsInd = await prisma.industry.create({
    data: {
      slug: 'electronics',
      nameZh: '电子电气',
      nameEn: 'Electronics',
      descZh: '电子电气行业',
      isActive: true,
      sortOrder: 3,
    },
  });

  const industries = [automotiveInd, aerospaceInd, electronicsInd];

  // Create Testing Standards
  console.log('📜 Creating testing standards...');
  const std1 = await prisma.testingStandard.create({
    data: {
      code: 'GB/T 228.1',
      nameZh: '金属材料拉伸试验',
      nameEn: 'Metallic materials - Tensile testing',
      organization: 'GB',
      isActive: true,
    },
  });

  const std2 = await prisma.testingStandard.create({
    data: {
      code: 'ASTM E8',
      nameZh: '金属材料拉伸试验标准',
      nameEn: 'Standard Test Methods for Tension Testing',
      organization: 'ASTM',
      isActive: true,
    },
  });

  const std3 = await prisma.testingStandard.create({
    data: {
      code: 'ISO 527',
      nameZh: '塑料拉伸性能测定',
      nameEn: 'Plastics - Determination of tensile properties',
      organization: 'ISO',
      isActive: true,
    },
  });

  const standards = [std1, std2, std3];

  // Create Testing Services (18 services)
  console.log('🔬 Creating testing services...');
  
  const service1 = await prisma.testingService.create({
    data: {
      slug: 'tensile-test',
      categoryId: mechanicalCat.id,
      nameZh: '拉伸试验',
      nameEn: 'Tensile Test',
      shortDescZh: '材料拉伸强度和延伸率测试',
      shortDescEn: 'Material tensile strength and elongation testing',
      fullDescZh: '通过拉伸试验机对材料进行拉伸测试，测定其抗拉强度、屈服强度、延伸率等力学性能指标。适用于金属、塑料、复合材料等多种材料。提供详细的应力-应变曲线和完整的测试报告。',
      fullDescEn: 'Tensile testing to determine mechanical properties including tensile strength, yield strength, and elongation.',
      pricingModel: 'FIXED',
      priceMin: 500,
      priceMax: 1500,
      turnaroundDays: 5,
      sampleRequirement: '样品尺寸：长度≥150mm，宽度20-50mm，厚度1-10mm。需提供3个以上平行样。',
      deliverables: '测试报告（中英文）、应力-应变曲线、原始数据记录',
      isActive: true,
      isHot: true,
      isFeatured: true,
      orderCount: 156,
      viewCount: 1203,
    },
  });

  const service2 = await prisma.testingService.create({
    data: {
      slug: 'hardness-test',
      categoryId: mechanicalCat.id,
      nameZh: '硬度测试',
      nameEn: 'Hardness Test',
      shortDescZh: '材料硬度测试（布氏、洛氏、维氏）',
      shortDescEn: 'Material hardness testing (Brinell, Rockwell, Vickers)',
      fullDescZh: '使用硬度计测定材料的硬度值，包括布氏硬度、洛氏硬度、维氏硬度等多种测试方法。',
      fullDescEn: 'Hardness testing using various methods including Brinell, Rockwell, and Vickers.',
      pricingModel: 'FIXED',
      priceMin: 300,
      priceMax: 800,
      turnaroundDays: 3,
      sampleRequirement: '样品需平整光滑，测试面积≥10mm²，厚度≥3mm',
      deliverables: '硬度测试报告、测试位置照片',
      isActive: true,
      isHot: true,
      orderCount: 203,
      viewCount: 1567,
    },
  });

  const service3 = await prisma.testingService.create({
    data: {
      slug: 'impact-test',
      categoryId: mechanicalCat.id,
      nameZh: '冲击试验',
      nameEn: 'Impact Test',
      shortDescZh: '材料冲击韧性测试（夏比、艾氏）',
      shortDescEn: 'Impact toughness testing (Charpy, Izod)',
      fullDescZh: '测定材料在冲击载荷作用下的抗冲击能力，包括常温和低温冲击试验。',
      fullDescEn: 'Determination of material impact resistance under impact loading conditions.',
      pricingModel: 'FIXED',
      priceMin: 400,
      priceMax: 1200,
      turnaroundDays: 4,
      sampleRequirement: '标准冲击试样（10×10×55mm），需提供3个以上',
      deliverables: '冲击试验报告、冲击吸收能量数据、断口照片',
      isActive: true,
      orderCount: 95,
      viewCount: 789,
    },
  });

  const service4 = await prisma.testingService.create({
    data: {
      slug: 'fatigue-test',
      categoryId: mechanicalCat.id,
      nameZh: '疲劳试验',
      nameEn: 'Fatigue Test',
      shortDescZh: '材料疲劳寿命和疲劳强度测试',
      shortDescEn: 'Material fatigue life and fatigue strength testing',
      fullDescZh: '通过循环加载测试材料的疲劳性能，评估其在交变应力作用下的使用寿命。',
      fullDescEn: 'Cyclic loading tests to evaluate material fatigue performance and service life.',
      pricingModel: 'QUOTE_ONLY',
      priceMin: 2000,
      priceMax: 8000,
      turnaroundDays: 15,
      sampleRequirement: '标准疲劳试样，需提供应力比、频率等试验参数',
      deliverables: '疲劳试验报告、S-N曲线、断口分析照片',
      isActive: true,
      isHot: true,
      orderCount: 45,
      viewCount: 654,
    },
  });

  const service5 = await prisma.testingService.create({
    data: {
      slug: 'compression-test',
      categoryId: mechanicalCat.id,
      nameZh: '压缩试验',
      nameEn: 'Compression Test',
      shortDescZh: '材料压缩强度和变形测试',
      shortDescEn: 'Material compression strength testing',
      fullDescZh: '测定材料在压缩载荷作用下的力学性能。',
      fullDescEn: 'Determination of material properties under compression loading.',
      pricingModel: 'FIXED',
      priceMin: 450,
      priceMax: 1300,
      turnaroundDays: 5,
      isActive: true,
      orderCount: 78,
      viewCount: 623,
    },
  });

  const service6 = await prisma.testingService.create({
    data: {
      slug: 'chemical-composition',
      categoryId: chemicalCat.id,
      nameZh: '化学成分分析',
      nameEn: 'Chemical Composition Analysis',
      shortDescZh: '材料化学成分定量分析',
      shortDescEn: 'Quantitative analysis of material chemical composition',
      fullDescZh: '采用光谱分析、化学分析等方法，准确测定材料中各元素的含量。',
      fullDescEn: 'Accurate determination of elemental composition using spectroscopy.',
      pricingModel: 'QUOTE_ONLY',
      priceMin: 800,
      priceMax: 3000,
      turnaroundDays: 7,
      isActive: true,
      isFeatured: true,
      orderCount: 89,
      viewCount: 876,
    },
  });

  const service7 = await prisma.testingService.create({
    data: {
      slug: 'spectroscopy',
      categoryId: chemicalCat.id,
      nameZh: '光谱分析',
      nameEn: 'Spectroscopy Analysis',
      shortDescZh: 'XRF、ICP等光谱分析技术',
      shortDescEn: 'XRF, ICP spectroscopy techniques',
      fullDescZh: '采用X射线荧光光谱(XRF)、电感耦合等离子体光谱(ICP)等先进技术。',
      fullDescEn: 'Advanced elemental analysis using XRF, ICP methods.',
      pricingModel: 'RANGE',
      priceMin: 600,
      priceMax: 2500,
      turnaroundDays: 6,
      isActive: true,
      orderCount: 112,
      viewCount: 945,
    },
  });

  const service8 = await prisma.testingService.create({
    data: {
      slug: 'ftir-analysis',
      categoryId: chemicalCat.id,
      nameZh: '红外光谱分析',
      nameEn: 'FTIR Analysis',
      shortDescZh: '傅里叶变换红外光谱分析',
      shortDescEn: 'Fourier Transform Infrared Spectroscopy',
      fullDescZh: '通过红外光谱分析鉴定有机物和高分子材料的化学结构。',
      fullDescEn: 'Chemical structure identification for organic materials.',
      pricingModel: 'FIXED',
      priceMin: 500,
      priceMax: 1500,
      turnaroundDays: 4,
      isActive: true,
      orderCount: 134,
      viewCount: 1098,
    },
  });

  const service9 = await prisma.testingService.create({
    data: {
      slug: 'corrosion-test',
      categoryId: environmentalCat.id,
      nameZh: '腐蚀试验',
      nameEn: 'Corrosion Test',
      shortDescZh: '材料耐腐蚀性能评估',
      shortDescEn: 'Material corrosion resistance evaluation',
      fullDescZh: '模拟各种腐蚀环境，评估材料的耐腐蚀性能，包括盐雾试验、浸泡试验等。',
      fullDescEn: 'Simulation of various corrosive environments.',
      pricingModel: 'RANGE',
      priceMin: 1500,
      priceMax: 5000,
      turnaroundDays: 20,
      isActive: true,
      isFeatured: true,
      orderCount: 67,
      viewCount: 543,
    },
  });

  const service10 = await prisma.testingService.create({
    data: {
      slug: 'salt-spray-test',
      categoryId: environmentalCat.id,
      nameZh: '盐雾试验',
      nameEn: 'Salt Spray Test',
      shortDescZh: '中性盐雾、酸性盐雾试验',
      shortDescEn: 'Neutral and acidic salt spray testing',
      fullDescZh: '按照标准进行中性盐雾(NSS)、酸性盐雾(AASS)等腐蚀试验。',
      fullDescEn: 'NSS and AASS corrosion testing.',
      pricingModel: 'FIXED',
      priceMin: 800,
      priceMax: 2000,
      turnaroundDays: 10,
      isActive: true,
      orderCount: 156,
      viewCount: 1234,
    },
  });

  const service11 = await prisma.testingService.create({
    data: {
      slug: 'thermal-shock',
      categoryId: environmentalCat.id,
      nameZh: '热冲击试验',
      nameEn: 'Thermal Shock Test',
      shortDescZh: '高低温快速转换试验',
      shortDescEn: 'Rapid temperature change testing',
      fullDescZh: '在高温和低温之间快速切换，评估抗热冲击性能。',
      fullDescEn: 'Rapid temperature cycling for thermal shock resistance.',
      pricingModel: 'RANGE',
      priceMin: 1200,
      priceMax: 3500,
      turnaroundDays: 8,
      isActive: true,
      orderCount: 52,
      viewCount: 487,
    },
  });

  const service12 = await prisma.testingService.create({
    data: {
      slug: 'humidity-test',
      categoryId: environmentalCat.id,
      nameZh: '湿热试验',
      nameEn: 'Humidity Test',
      shortDescZh: '恒定湿热、交变湿热试验',
      shortDescEn: 'Constant and cyclic humidity testing',
      fullDescZh: '模拟高温高湿环境，评估产品可靠性。',
      fullDescEn: 'High temperature and humidity simulation.',
      pricingModel: 'FIXED',
      priceMin: 1000,
      priceMax: 2800,
      turnaroundDays: 12,
      isActive: true,
      orderCount: 73,
      viewCount: 621,
    },
  });

  const service13 = await prisma.testingService.create({
    data: {
      slug: 'metallographic',
      categoryId: ndtCat.id,
      nameZh: '金相分析',
      nameEn: 'Metallographic Analysis',
      shortDescZh: '材料微观组织结构分析',
      shortDescEn: 'Material microstructure analysis',
      fullDescZh: '通过金相显微镜观察材料的微观组织结构，分析晶粒大小、相组成等。',
      fullDescEn: 'Microscopic examination of material microstructure.',
      pricingModel: 'FIXED',
      priceMin: 600,
      priceMax: 2000,
      turnaroundDays: 5,
      isActive: true,
      isFeatured: true,
      orderCount: 123,
      viewCount: 987,
    },
  });

  const service14 = await prisma.testingService.create({
    data: {
      slug: 'ultrasonic-test',
      categoryId: ndtCat.id,
      nameZh: '超声波检测',
      nameEn: 'Ultrasonic Testing',
      shortDescZh: '内部缺陷无损检测',
      shortDescEn: 'Internal defect detection',
      fullDescZh: '采用超声波技术检测材料和焊缝内部的裂纹、气孔、夹杂等缺陷。',
      fullDescEn: 'Detection of internal defects using ultrasonic technology.',
      pricingModel: 'RANGE',
      priceMin: 800,
      priceMax: 2500,
      turnaroundDays: 3,
      isActive: true,
      orderCount: 88,
      viewCount: 756,
    },
  });

  const service15 = await prisma.testingService.create({
    data: {
      slug: 'x-ray-inspection',
      categoryId: ndtCat.id,
      nameZh: 'X射线检测',
      nameEn: 'X-Ray Inspection',
      shortDescZh: '射线透照检测',
      shortDescEn: 'Radiographic inspection',
      fullDescZh: 'X射线透照检测焊缝、铸件等内部缺陷。',
      fullDescEn: 'X-ray radiography for internal defect detection.',
      pricingModel: 'QUOTE_ONLY',
      priceMin: 1200,
      priceMax: 4000,
      turnaroundDays: 5,
      isActive: true,
      orderCount: 61,
      viewCount: 534,
    },
  });

  const service16 = await prisma.testingService.create({
    data: {
      slug: 'magnetic-particle',
      categoryId: ndtCat.id,
      nameZh: '磁粉检测',
      nameEn: 'Magnetic Particle Testing',
      shortDescZh: '表面及近表面缺陷检测',
      shortDescEn: 'Surface and near-surface defect detection',
      fullDescZh: '利用磁粉检测技术发现铁磁性材料表面缺陷。',
      fullDescEn: 'Detection of surface cracks in ferromagnetic materials.',
      pricingModel: 'FIXED',
      priceMin: 400,
      priceMax: 1200,
      turnaroundDays: 2,
      isActive: true,
      orderCount: 94,
      viewCount: 812,
    },
  });

  const service17 = await prisma.testingService.create({
    data: {
      slug: 'sem-analysis',
      categoryId: ndtCat.id,
      nameZh: '扫描电镜分析',
      nameEn: 'SEM Analysis',
      shortDescZh: '微观形貌和成分分析（SEM/EDS）',
      shortDescEn: 'Microstructure and composition analysis',
      fullDescZh: '采用扫描电子显微镜(SEM)观察材料微观形貌。',
      fullDescEn: 'SEM observation with EDS microanalysis.',
      pricingModel: 'RANGE',
      priceMin: 1000,
      priceMax: 3500,
      turnaroundDays: 6,
      isActive: true,
      isFeatured: true,
      orderCount: 107,
      viewCount: 1156,
    },
  });

  const service18 = await prisma.testingService.create({
    data: {
      slug: 'rohs-testing',
      categoryId: chemicalCat.id,
      nameZh: 'RoHS检测',
      nameEn: 'RoHS Testing',
      shortDescZh: '有害物质限量检测',
      shortDescEn: 'Hazardous substance restriction testing',
      fullDescZh: '检测产品中铅、汞、镉、六价铬等有害物质含量。',
      fullDescEn: 'Testing for restricted substances compliance.',
      pricingModel: 'FIXED',
      priceMin: 1200,
      priceMax: 3000,
      turnaroundDays: 7,
      isActive: true,
      isHot: true,
      orderCount: 198,
      viewCount: 1876,
    },
  });

  const services = [service1, service2, service3, service4, service5, service6, service7, service8, service9, service10, service11, service12, service13, service14, service15, service16, service17, service18];

  // Link services to materials and industries
  console.log('🔗 Creating service relationships...');
  await prisma.serviceMaterial.createMany({
    data: [
      { serviceId: service1.id, materialId: metalMat.id },
      { serviceId: service1.id, materialId: polymerMat.id },
      { serviceId: service2.id, materialId: metalMat.id },
      { serviceId: service3.id, materialId: metalMat.id },
      { serviceId: service6.id, materialId: metalMat.id },
      { serviceId: service9.id, materialId: metalMat.id },
      { serviceId: service13.id, materialId: metalMat.id },
    ],
  });

  await prisma.serviceIndustry.createMany({
    data: [
      { serviceId: service1.id, industryId: automotiveInd.id },
      { serviceId: service1.id, industryId: aerospaceInd.id },
      { serviceId: service4.id, industryId: aerospaceInd.id },
      { serviceId: service6.id, industryId: automotiveInd.id },
      { serviceId: service9.id, industryId: automotiveInd.id },
      { serviceId: service18.id, industryId: electronicsInd.id },
    ],
  });

  await prisma.serviceStandard.createMany({
    data: [
      { serviceId: service1.id, standardId: std1.id },
      { serviceId: service1.id, standardId: std2.id },
      { serviceId: service6.id, standardId: std1.id },
    ],
  });

  // Create demo users
  console.log('👥 Creating demo users...');
  const passwordHash = await hashPassword('demo123456');
  
  const demoCustomer = await prisma.user.create({
    data: {
      email: 'customer@demo.com',
      passwordHash,
      name: '张伟',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      emailVerified: true,
      phone: '13800138001',
    },
  });

  const demoCustomer2 = await prisma.user.create({
    data: {
      email: 'user2@demo.com',
      passwordHash,
      name: '李娜',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      emailVerified: true,
      phone: '13800138002',
    },
  });

  const demoEnterpriseUser = await prisma.user.create({
    data: {
      email: 'enterprise@demo.com',
      passwordHash,
      name: '王企业',
      role: 'ENTERPRISE_MEMBER',
      status: 'ACTIVE',
      emailVerified: true,
      phone: '13800138003',
    },
  });

  const demoEnterpriseMember = await prisma.user.create({
    data: {
      email: 'member@demo.com',
      passwordHash,
      name: '赵团队',
      role: 'ENTERPRISE_MEMBER',
      status: 'ACTIVE',
      emailVerified: true,
      phone: '13800138004',
    },
  });

  const demoLabUser = await prisma.user.create({
    data: {
      email: 'lab@demo.com',
      passwordHash,
      name: '实验室用户',
      role: 'LAB_PARTNER',
      status: 'ACTIVE',
      emailVerified: true,
      phone: '13800138005',
    },
  });

  const demoTechnician = await prisma.user.create({
    data: {
      email: 'tech@demo.com',
      passwordHash,
      name: '技术员小刘',
      role: 'TECHNICIAN',
      status: 'ACTIVE',
      emailVerified: true,
      phone: '13800138006',
    },
  });

  const demoFinanceAdmin = await prisma.user.create({
    data: {
      email: 'finance@demo.com',
      passwordHash,
      name: '财务管理员',
      role: 'FINANCE_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      phone: '13800138007',
    },
  });

  const demoAdmin = await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      passwordHash,
      name: '系统管理员',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      phone: '13800138000',
    },
  });

  // Create wallets for users
  console.log('💰 Creating wallets...');
  const wallet1 = await prisma.wallet.create({ data: { userId: demoCustomer.id, balance: 5000 } });
  await prisma.wallet.create({ data: { userId: demoCustomer2.id, balance: 3200 } });
  const walletEnt = await prisma.wallet.create({ data: { userId: demoEnterpriseUser.id, balance: 15000 } });
  await prisma.wallet.create({ data: { userId: demoEnterpriseMember.id, balance: 500 } });
  await prisma.wallet.create({ data: { userId: demoLabUser.id, balance: 0 } });
  await prisma.wallet.create({ data: { userId: demoTechnician.id, balance: 0 } });
  await prisma.wallet.create({ data: { userId: demoFinanceAdmin.id, balance: 0 } });
  await prisma.wallet.create({ data: { userId: demoAdmin.id, balance: 100000 } });

  // Create demo company
  console.log('🏢 Creating demo company...');
  const demoCompany = await prisma.company.create({
    data: {
      name: '示范科技有限公司',
      registrationNo: '91110000XXXXXXXXXX',
      industry: 'automotive',
      size: '100-500人',
      address: '北京市海淀区中关村大街1号',
      contactPerson: '王企业',
      contactPhone: '010-88888888',
      contactEmail: 'enterprise@demo.com',
      status: 'VERIFIED',
      contractPricing: true,
      billingEnabled: true,
      approvalRequired: true,
    },
  });

  // Create company memberships
  await prisma.companyMembership.create({
    data: {
      userId: demoEnterpriseUser.id,
      companyId: demoCompany.id,
      role: 'owner',
    },
  });

  await prisma.companyMembership.create({
    data: {
      userId: demoEnterpriseMember.id,
      companyId: demoCompany.id,
      role: 'member',
    },
  });

  // Create company wallet
  await prisma.companyWallet.create({
    data: {
      companyId: demoCompany.id,
      balance: 50000,
      creditLimit: 100000,
    },
  });

  // Create addresses
  console.log('📍 Creating addresses...');
  const customerAddress = await prisma.address.create({
    data: {
      userId: demoCustomer.id,
      label: '公司',
      name: '张伟',
      phone: '13800138001',
      province: '北京市',
      city: '北京市',
      district: '朝阳区',
      street: '建国路88号SOHO现代城A座1201',
      postalCode: '100022',
      isDefault: true,
    },
  });

  const enterpriseAddress = await prisma.address.create({
    data: {
      userId: demoEnterpriseUser.id,
      label: '公司总部',
      name: '王企业',
      phone: '010-88888888',
      province: '北京市',
      city: '北京市',
      district: '海淀区',
      street: '中关村大街1号',
      postalCode: '100080',
      isDefault: true,
    },
  });

  // Create demo laboratory
  console.log('🏢 Creating demo laboratory...');
  const demoLab = await prisma.laboratory.create({
    data: {
      slug: 'demo-testing-lab',
      nameZh: '示范检测实验室',
      nameEn: 'Demo Testing Laboratory',
      shortDescZh: '专业的第三方检测机构',
      shortDescEn: 'Professional third-party testing institution',
      fullDescZh: '拥有完善的检测设备和专业的技术团队，提供全方位的检测服务。',
      fullDescEn: 'Equipped with advanced testing facilities and professional technical team.',
      city: '北京',
      province: '北京市',
      phone: '010-12345678',
      email: 'lab@demo.com',
      status: 'ACTIVE',
      rating: 4.8,
      completedOrders: 500,
      avgTurnaroundDays: 7,
    },
  });

  // Link lab to services
  await prisma.labService.createMany({
    data: services.map(s => ({ labId: demoLab.id, serviceId: s.id })),
  });

  // Link lab user
  await prisma.labUser.create({
    data: {
      userId: demoLabUser.id,
      labId: demoLab.id,
      role: 'admin',
    },
  });

  // Create demo orders
  console.log('📦 Creating demo orders...');
  
  // Order 1: Completed with report
  const order1 = await prisma.order.create({
    data: {
      orderNo: 'ORD-2024-001',
      userId: demoCustomer.id,
      addressId: customerAddress.id,
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      totalAmount: 1500,
      paidAmount: 1500,
      assignedLabId: demoLab.id,
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order1.id,
      serviceId: service1.id,
      quantity: 1,
      unitPrice: 1500,
      subtotal: 1500,
      notes: '钢材拉伸试验',
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order1.id,
      method: 'WALLET',
      amount: 1500,
      status: 'success',
      transactionId: 'TXN-2024-001',
      paidAt: new Date('2024-12-01'),
    },
  });

  await prisma.orderTimeline.createMany({
    data: [
      { orderId: order1.id, status: 'PAID', title: '订单已支付', createdAt: new Date('2024-12-01') },
      { orderId: order1.id, status: 'SAMPLE_RECEIVED', title: '样品已接收', createdAt: new Date('2024-12-02') },
      { orderId: order1.id, status: 'TESTING_COMPLETE', title: '测试完成', createdAt: new Date('2024-12-05') },
      { orderId: order1.id, status: 'REPORT_DELIVERED', title: '报告已交付', createdAt: new Date('2024-12-06') },
      { orderId: order1.id, status: 'COMPLETED', title: '订单完成', createdAt: new Date('2024-12-06') },
    ],
  });

  const sample1 = await prisma.sample.create({
    data: {
      sampleNo: 'SMP-2024-001',
      orderId: order1.id,
      name: '钢材样品-拉伸',
      description: 'Q235钢拉伸试样',
      materialType: '金属',
      quantity: '3件',
      condition: '良好',
      status: 'TESTING_COMPLETE',
      trackingNo: 'SF1234567890',
      courier: '顺丰速运',
      shippedAt: new Date('2024-12-01'),
      receivedAt: new Date('2024-12-02'),
      receivedBy: '实验室接样员',
    },
  });

  await prisma.sampleTimeline.createMany({
    data: [
      { sampleId: sample1.id, status: 'SHIPPED', title: '样品已发货', createdAt: new Date('2024-12-01') },
      { sampleId: sample1.id, status: 'RECEIVED', title: '样品已签收', createdAt: new Date('2024-12-02') },
      { sampleId: sample1.id, status: 'INSPECTION_PASSED', title: '样品检验合格', createdAt: new Date('2024-12-02') },
      { sampleId: sample1.id, status: 'TESTING_COMPLETE', title: '测试完成', createdAt: new Date('2024-12-05') },
    ],
  });

  await prisma.report.create({
    data: {
      reportNo: 'RPT-2024-001',
      orderId: order1.id,
      title: 'Q235钢材拉伸试验报告',
      summaryZh: '根据GB/T 228.1标准，对送检的Q235钢材进行了拉伸试验。结果表明：抗拉强度为445MPa，屈服强度为285MPa，延伸率为24%，各项指标均符合标准要求。',
      summaryEn: 'Tensile testing of Q235 steel per GB/T 228.1. Results: Tensile strength 445MPa, Yield strength 285MPa, Elongation 24%.',
      status: 'PUBLISHED',
      fileUrl: '/uploads/reports/report-001.pdf',
      issuedAt: new Date('2024-12-06'),
      downloadCount: 3,
      viewCount: 8,
    },
  });

  // Order 2: Testing in progress
  const order2 = await prisma.order.create({
    data: {
      orderNo: 'ORD-2024-002',
      userId: demoEnterpriseUser.id,
      addressId: enterpriseAddress.id,
      status: 'TESTING_IN_PROGRESS',
      paymentStatus: 'PAID',
      totalAmount: 3200,
      paidAmount: 3200,
      assignedLabId: demoLab.id,
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order2.id,
      serviceId: service6.id,
      quantity: 2,
      unitPrice: 1600,
      subtotal: 3200,
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order2.id,
      method: 'ENTERPRISE_BILLING',
      amount: 3200,
      status: 'success',
      paidAt: new Date('2024-12-10'),
    },
  });

  await prisma.orderTimeline.createMany({
    data: [
      { orderId: order2.id, status: 'PAID', title: '订单已支付', createdAt: new Date('2024-12-10') },
      { orderId: order2.id, status: 'SAMPLE_RECEIVED', title: '样品已接收', createdAt: new Date('2024-12-11') },
      { orderId: order2.id, status: 'TESTING_IN_PROGRESS', title: '测试进行中', createdAt: new Date('2024-12-12') },
    ],
  });

  await prisma.sample.create({
    data: {
      sampleNo: 'SMP-2024-002',
      orderId: order2.id,
      name: '不锈钢合金样品',
      description: '316L不锈钢成分分析',
      materialType: '金属',
      quantity: '2件',
      condition: '良好',
      status: 'TESTING',
      receivedAt: new Date('2024-12-11'),
      receivedBy: '实验室接样员',
    },
  });

  // Order 3: Pending payment
  const order3 = await prisma.order.create({
    data: {
      orderNo: 'ORD-2024-003',
      userId: demoCustomer2.id,
      status: 'PENDING_PAYMENT',
      paymentStatus: 'UNPAID',
      totalAmount: 800,
      paidAmount: 0,
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order3.id,
      serviceId: service2.id,
      quantity: 1,
      unitPrice: 800,
      subtotal: 800,
    },
  });

  // Order 4: Sample pending
  const order4 = await prisma.order.create({
    data: {
      orderNo: 'ORD-2024-004',
      userId: demoCustomer.id,
      addressId: customerAddress.id,
      status: 'SAMPLE_PENDING',
      paymentStatus: 'PAID',
      totalAmount: 2000,
      paidAmount: 2000,
      assignedLabId: demoLab.id,
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order4.id,
      serviceId: service13.id,
      quantity: 1,
      unitPrice: 2000,
      subtotal: 2000,
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order4.id,
      method: 'ALIPAY',
      amount: 2000,
      status: 'success',
      externalNo: 'ALIPAY-2024-001',
      paidAt: new Date('2024-12-14'),
    },
  });

  await prisma.orderTimeline.createMany({
    data: [
      { orderId: order4.id, status: 'PAID', title: '订单已支付', createdAt: new Date('2024-12-14') },
      { orderId: order4.id, status: 'SAMPLE_PENDING', title: '等待寄送样品', createdAt: new Date('2024-12-14') },
    ],
  });

  // Order 5: Report generating
  const order5 = await prisma.order.create({
    data: {
      orderNo: 'ORD-2024-005',
      userId: demoEnterpriseUser.id,
      addressId: enterpriseAddress.id,
      status: 'REPORT_GENERATING',
      paymentStatus: 'PAID',
      totalAmount: 3300,
      paidAmount: 3300,
      assignedLabId: demoLab.id,
    },
  });

  await prisma.orderItem.createMany({
    data: [
      {
        orderId: order5.id,
        serviceId: service1.id,
        quantity: 1,
        unitPrice: 1500,
        subtotal: 1500,
      },
      {
        orderId: order5.id,
        serviceId: service2.id,
        quantity: 2,
        unitPrice: 600,
        subtotal: 1200,
      },
      {
        orderId: order5.id,
        serviceId: service3.id,
        quantity: 1,
        unitPrice: 600,
        subtotal: 600,
      },
    ],
  });

  await prisma.payment.create({
    data: {
      orderId: order5.id,
      method: 'WALLET',
      amount: 3300,
      status: 'success',
      paidAt: new Date('2024-12-08'),
    },
  });

  await prisma.orderTimeline.createMany({
    data: [
      { orderId: order5.id, status: 'PAID', title: '订单已支付', createdAt: new Date('2024-12-08') },
      { orderId: order5.id, status: 'SAMPLE_RECEIVED', title: '样品已接收', createdAt: new Date('2024-12-09') },
      { orderId: order5.id, status: 'TESTING_COMPLETE', title: '测试完成', createdAt: new Date('2024-12-13') },
      { orderId: order5.id, status: 'REPORT_GENERATING', title: '报告生成中', createdAt: new Date('2024-12-15') },
    ],
  });

  await prisma.sample.create({
    data: {
      sampleNo: 'SMP-2024-005',
      orderId: order5.id,
      name: '铝合金综合测试样品',
      description: '6061铝合金力学性能测试',
      materialType: '金属',
      quantity: '5件',
      condition: '良好',
      status: 'TESTING_COMPLETE',
      receivedAt: new Date('2024-12-09'),
      receivedBy: '实验室接样员',
    },
  });

  await prisma.report.create({
    data: {
      reportNo: 'RPT-2024-005',
      orderId: order5.id,
      title: '铝合金力学性能测试报告',
      status: 'UNDER_REVIEW',
      summaryZh: '正在审核中...',
    },
  });

  // Create RFQ Requests
  console.log('📋 Creating RFQ requests...');
  const rfq1 = await prisma.rFQRequest.create({
    data: {
      requestNo: 'RFQ-2024-001',
      userId: demoCustomer.id,
      title: '钛合金疲劳性能测试',
      materialDesc: 'TC4钛合金，医疗器械用',
      productType: '医疗植入物',
      testingTarget: '疲劳寿命不低于10⁷次循环',
      issue: '需评估植入物在体内长期使用的疲劳性能',
      standardReq: 'ASTM F136, ISO 5832-3',
      quantity: '5件',
      deadline: new Date('2025-01-30'),
      budget: '10000-15000元',
      status: 'QUOTED',
      assignedLabId: demoLab.id,
    },
  });

  await prisma.rFQRequest.create({
    data: {
      requestNo: 'RFQ-2024-002',
      userId: demoEnterpriseUser.id,
      title: '新型复合材料全性能测试',
      materialDesc: '碳纤维增强树脂基复合材料',
      productType: '航空结构件',
      testingTarget: '力学性能、热性能、环境适应性全面评估',
      standardReq: 'HB 7403, ASTM D3039',
      quantity: '10件',
      deadline: new Date('2025-02-15'),
      budget: '30000-50000元',
      status: 'UNDER_REVIEW',
      assignedLabId: demoLab.id,
    },
  });

  await prisma.rFQRequest.create({
    data: {
      requestNo: 'RFQ-2024-003',
      userId: demoCustomer2.id,
      title: '产品失效分析',
      materialDesc: '失效的不锈钢螺栓',
      productType: '紧固件',
      testingTarget: '查明断裂原因',
      issue: '使用3个月后断裂，需查明是材料问题还是设计问题',
      quantity: '3件（失效件）',
      budget: '5000-8000元',
      status: 'SUBMITTED',
    },
  });

  // Create Quotation
  await prisma.quotation.create({
    data: {
      quotationNo: 'QUO-2024-001',
      rfqId: rfq1.id,
      userId: demoCustomer.id,
      title: '钛合金疲劳性能测试报价',
      items: [
        {
          name: '高周疲劳试验',
          quantity: 5,
          unitPrice: 2500,
          subtotal: 12500,
          turnaround: '20个工作日',
        },
      ],
      totalAmount: 12500,
      validUntil: new Date('2025-01-15'),
      status: 'SENT',
      notes: '包含S-N曲线和断口分析',
    },
  });

  // Create Referral System
  console.log('🎁 Creating referral system...');
  const referralCode1 = await prisma.referralCode.create({
    data: {
      userId: demoCustomer.id,
      code: 'DEMO2024',
    },
  });

  await prisma.referral.create({
    data: {
      referralCodeId: referralCode1.id,
      referredUserId: demoCustomer2.id,
      referrerUserId: demoCustomer.id,
      status: 'qualified',
    },
  });

  await prisma.referralConfig.create({
    data: {
      registrationReward: 50,
      commissionRate: 0.05,
      minWithdrawalAmount: 100,
      frozenDays: 30,
      maxTiers: 2,
      isActive: true,
    },
  });

  // Create Translations
  console.log('🌐 Creating translations...');
  await prisma.translation.createMany({
    data: [
      { key: 'common.submit', locale: 'zh-CN', value: '提交', category: 'common' },
      { key: 'common.submit', locale: 'en', value: 'Submit', category: 'common' },
      { key: 'common.cancel', locale: 'zh-CN', value: '取消', category: 'common' },
      { key: 'common.cancel', locale: 'en', value: 'Cancel', category: 'common' },
      { key: 'nav.services', locale: 'zh-CN', value: '检测服务', category: 'navigation' },
      { key: 'nav.services', locale: 'en', value: 'Testing Services', category: 'navigation' },
      { key: 'order.status.pending_payment', locale: 'zh-CN', value: '待支付', category: 'order' },
      { key: 'order.status.pending_payment', locale: 'en', value: 'Pending Payment', category: 'order' },
      { key: 'order.status.testing_in_progress', locale: 'zh-CN', value: '测试中', category: 'order' },
      { key: 'order.status.testing_in_progress', locale: 'en', value: 'Testing In Progress', category: 'order' },
    ],
  });

  // Create Notifications
  console.log('🔔 Creating notifications...');
  await prisma.notification.createMany({
    data: [
      {
        userId: demoCustomer.id,
        type: 'REPORT',
        titleZh: '检测报告已发布',
        titleEn: 'Test Report Published',
        contentZh: '您的订单 ORD-2024-001 的检测报告已发布，请查看。',
        contentEn: 'Test report for order ORD-2024-001 has been published.',
        link: '/dashboard/orders/ORD-2024-001',
        isRead: false,
      },
      {
        userId: demoEnterpriseUser.id,
        type: 'ORDER',
        titleZh: '订单状态更新',
        titleEn: 'Order Status Update',
        contentZh: '您的订单 ORD-2024-002 正在测试中。',
        contentEn: 'Your order ORD-2024-002 is now in testing.',
        link: '/enterprise/orders/ORD-2024-002',
        isRead: true,
      },
      {
        userId: demoCustomer.id,
        type: 'QUOTATION',
        titleZh: '新报价单',
        titleEn: 'New Quotation',
        contentZh: '您的询价 RFQ-2024-001 收到新报价。',
        contentEn: 'New quotation received for RFQ-2024-001.',
        link: '/dashboard/rfq/RFQ-2024-001',
        isRead: false,
      },
    ],
  });

  // Create Invoice Profile
  await prisma.invoiceProfile.create({
    data: {
      userId: demoEnterpriseUser.id,
      companyName: '示范科技有限公司',
      taxNumber: '91110000XXXXXXXXXX',
      bankName: '中国工商银行北京分行',
      bankAccount: '0200001234567890',
      address: '北京市海淀区中关村大街1号',
      phone: '010-88888888',
      isDefault: true,
    },
  });

  // Create Invoices
  await prisma.invoice.createMany({
    data: [
      {
        invoiceNo: 'INV-2024-001',
        orderId: order1.id,
        type: '普通发票',
        amount: 1500,
        status: 'issued',
        fileUrl: '/uploads/invoices/inv-001.pdf',
        issuedAt: new Date('2024-12-06'),
      },
      {
        invoiceNo: 'INV-2024-002',
        orderId: order2.id,
        type: '增值税专用发票',
        amount: 3200,
        status: 'pending',
      },
    ],
  });

  // Create Transactions
  await prisma.transaction.createMany({
    data: [
      {
        walletId: wallet1.id,
        type: 'RECHARGE',
        amount: 10000,
        balanceAfter: 10000,
        description: '钱包充值',
        createdAt: new Date('2024-11-20'),
      },
      {
        walletId: wallet1.id,
        type: 'PAYMENT',
        amount: -1500,
        balanceAfter: 8500,
        description: '订单支付: ORD-2024-001',
        referenceType: 'order',
        referenceId: order1.id,
        createdAt: new Date('2024-12-01'),
      },
      {
        walletId: wallet1.id,
        type: 'PAYMENT',
        amount: -2000,
        balanceAfter: 6500,
        description: '订单支付: ORD-2024-004',
        referenceType: 'order',
        referenceId: order4.id,
        createdAt: new Date('2024-12-14'),
      },
      {
        walletId: walletEnt.id,
        type: 'RECHARGE',
        amount: 20000,
        balanceAfter: 20000,
        description: '企业钱包充值',
        createdAt: new Date('2024-12-05'),
      },
      {
        walletId: walletEnt.id,
        type: 'PAYMENT',
        amount: -3200,
        balanceAfter: 16800,
        description: '订单支付: ORD-2024-002',
        referenceType: 'order',
        referenceId: order2.id,
        createdAt: new Date('2024-12-10'),
      },
    ],
  });

  // Create CMS Pages
  console.log('📄 Creating CMS content...');
  await prisma.cMSPage.createMany({
    data: [
      {
        slug: 'about-us',
        type: 'page',
        titleZh: '关于我们',
        titleEn: 'About Us',
        contentZh: '我们是一家专业的第三方检测服务平台，致力于为客户提供高质量的检测服务...',
        contentEn: 'We are a professional third-party testing service platform committed to providing high-quality testing services...',
        isPublished: true,
        publishedAt: new Date('2024-01-01'),
      },
      {
        slug: 'contact',
        type: 'page',
        titleZh: '联系我们',
        titleEn: 'Contact Us',
        contentZh: '电话：400-123-4567\n邮箱：info@lab-platform.com\n地址：北京市海淀区中关村大街100号',
        contentEn: 'Phone: 400-123-4567\nEmail: info@lab-platform.com\nAddress: 100 Zhongguancun Street, Haidian District, Beijing',
        isPublished: true,
        publishedAt: new Date('2024-01-01'),
      },
      {
        slug: 'banner-homepage',
        type: 'banner',
        titleZh: '专业检测服务平台',
        titleEn: 'Professional Testing Services',
        contentZh: '值得信赖的第三方检测平台',
        contentEn: 'Trusted Third-Party Testing Platform',
        isPublished: true,
        sortOrder: 1,
      },
    ],
  });

  // Create Equipment
  console.log('🔧 Creating equipment...');
  await prisma.equipment.createMany({
    data: [
      {
        slug: 'universal-testing-machine',
        labId: demoLab.id,
        nameZh: '万能材料试验机',
        nameEn: 'Universal Testing Machine',
        model: 'WDW-300E',
        manufacturer: '济南试金',
        descZh: '最大试验力300kN，用于拉伸、压缩、弯曲试验',
        status: 'AVAILABLE',
        bookable: true,
        hourlyRate: 500,
        dailyRate: 3000,
        isActive: true,
      },
      {
        slug: 'sem-microscope',
        labId: demoLab.id,
        nameZh: '扫描电子显微镜',
        nameEn: 'Scanning Electron Microscope',
        model: 'JSM-7800F',
        manufacturer: 'JEOL',
        descZh: '配备EDS能谱仪，最高放大倍数50万倍',
        status: 'IN_USE',
        bookable: true,
        hourlyRate: 800,
        dailyRate: 5000,
        isActive: true,
      },
      {
        slug: 'hardness-tester',
        labId: demoLab.id,
        nameZh: '硬度计',
        nameEn: 'Hardness Tester',
        model: 'HV-1000',
        manufacturer: '上海泰明',
        descZh: '维氏硬度计，适用于各类金属材料',
        status: 'AVAILABLE',
        bookable: false,
        isActive: true,
      },
    ],
  });

  // Create Audit Logs
  console.log('📝 Creating audit logs...');
  await prisma.auditLog.createMany({
    data: [
      {
        userId: demoAdmin.id,
        action: 'CREATE',
        entity: 'User',
        entityId: demoCustomer.id,
        details: { email: 'customer@demo.com' },
        ipAddress: '192.168.1.1',
        createdAt: new Date('2024-11-15'),
      },
      {
        userId: demoAdmin.id,
        action: 'UPDATE',
        entity: 'Company',
        entityId: demoCompany.id,
        details: { status: 'VERIFIED' },
        ipAddress: '192.168.1.1',
        createdAt: new Date('2024-11-20'),
      },
      {
        userId: demoFinanceAdmin.id,
        action: 'APPROVE',
        entity: 'Invoice',
        details: { invoiceNo: 'INV-2024-001', amount: 1500 },
        ipAddress: '192.168.1.2',
        createdAt: new Date('2024-12-06'),
      },
    ],
  });

  console.log('✅ Database seeding completed successfully!');
  console.log(`
📊 Summary:
  ✅ ${categories.length} service categories
  ✅ ${services.length} testing services
  ✅ ${materials.length} materials
  ✅ ${industries.length} industries
  ✅ ${standards.length} testing standards
  ✅ 8 demo users (various roles)
  ✅ 1 demo company with 2 members
  ✅ 1 demo laboratory
  ✅ 5 orders (various statuses)
  ✅ 3 samples
  ✅ 2 reports (1 published, 1 under review)
  ✅ 3 RFQ requests
  ✅ 1 quotation
  ✅ Referral system, translations, notifications
  ✅ Equipment, invoices, transactions, audit logs

🔑 Demo Credentials (Password: demo123456):
  👤 Customer: customer@demo.com
  👤 Customer 2: user2@demo.com
  🏢 Enterprise Owner: enterprise@demo.com
  🏢 Enterprise Member: member@demo.com
  🔬 Lab Partner: lab@demo.com
  🔧 Technician: tech@demo.com
  💰 Finance Admin: finance@demo.com
  👑 Super Admin: admin@demo.com
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
