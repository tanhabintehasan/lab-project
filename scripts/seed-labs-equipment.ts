import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding labs and equipment...');

  const labsData = [
    {
      slug: 'advanced-battery-rd-lab-nanjing',
      nameZh: '先进电池研发实验室',
      nameEn: 'Advanced Battery R&D Laboratory',
      shortDescZh: '电池测试，性能分析',
      fullDescZh: '专注于锂离子电池、固态电池等新型电池材料的研发与性能测试，配备先进的充放电测试系统和电化学分析设备。',
      city: '南京',
      province: '江苏省',
      address: '南京市江宁区科学园天元中路100号',
      phone: '025-12345678',
      email: 'nanjing.lab@demo.com',
      status: 'ACTIVE' as const,
    },
    {
      slug: 'energy-materials-char-lab-shanghai',
      nameZh: '能源材料表征实验室',
      nameEn: 'Energy Materials Characterization Laboratory',
      shortDescZh: '材料表征，化学分析',
      fullDescZh: '提供能源材料的多尺度表征服务，包括微观结构、成分分析、晶体结构及表面特性测试。',
      city: '上海',
      province: '上海市',
      address: '上海市浦东新区张江高科技园区科苑路200号',
      phone: '021-87654321',
      email: 'shanghai.lab@demo.com',
      status: 'ACTIVE' as const,
    },
    {
      slug: 'clean-energy-conversion-lab-zhenjiang',
      nameZh: '清洁能源转化实验室',
      nameEn: 'Clean Energy Conversion Laboratory',
      shortDescZh: '材料表征，化学分析',
      fullDescZh: '致力于太阳能、氢能等清洁能源转化技术的研究与测试，拥有完善的光电化学测试平台。',
      city: '镇江',
      province: '江苏省',
      address: '镇江市京口区学府路300号',
      phone: '0511-11223344',
      email: 'zhenjiang.lab@demo.com',
      status: 'ACTIVE' as const,
    },
    {
      slug: 'intelligent-testing-equipment-lab-suzhou',
      nameZh: '智能检测装备实验室',
      nameEn: 'Intelligent Testing Equipment Laboratory',
      shortDescZh: '无损检测，可靠性分析',
      fullDescZh: '专注于智能检测装备与无损检测技术研发，提供材料力学性能、疲劳寿命及可靠性评估服务。',
      city: '苏州',
      province: '江苏省',
      address: '苏州市工业园区星湖街400号',
      phone: '0512-55667788',
      email: 'suzhou.lab@demo.com',
      status: 'ACTIVE' as const,
    },
  ];

  const createdLabs: Array<{ id: string; slug: string; nameZh: string }> = [];

  for (const lab of labsData) {
    const existing = await prisma.laboratory.findUnique({ where: { slug: lab.slug } });
    if (existing) {
      console.log(`  ⏭️  Lab already exists: ${lab.nameZh}`);
      createdLabs.push(existing);
    } else {
      const created = await prisma.laboratory.create({ data: lab });
      console.log(`  ✅ Created lab: ${created.nameZh}`);
      createdLabs.push(created);
    }
  }

  const equipmentData: Array<{
    slug: string;
    nameZh: string;
    nameEn?: string;
    model?: string;
    manufacturer?: string;
    descZh?: string;
    status: 'AVAILABLE';
    bookable: boolean;
    quantity: number;
    hourlyRate?: number;
    dailyRate?: number;
    labSlug: string;
  }> = [
    // Nanjing lab equipment
    {
      slug: 'battery-cycler-ct4008',
      nameZh: '电池充放电测试系统',
      nameEn: 'Battery Charge/Discharge Test System',
      model: 'CT-4008',
      manufacturer: '新威尔',
      descZh: '高精度电池充放电测试系统，支持多通道并行测试，适用于各类锂电池性能评估。',
      status: 'AVAILABLE',
      bookable: true,
      quantity: 2,
      hourlyRate: 150,
      labSlug: 'advanced-battery-rd-lab-nanjing',
    },
    {
      slug: 'electrochemical-workstation-chi660e',
      nameZh: '电化学工作站',
      nameEn: 'Electrochemical Workstation',
      model: 'CHI660E',
      manufacturer: '辰华',
      descZh: '多功能电化学分析仪器，支持循环伏安、交流阻抗、恒电位/电流等多种测试模式。',
      status: 'AVAILABLE',
      bookable: true,
      quantity: 1,
      hourlyRate: 200,
      labSlug: 'advanced-battery-rd-lab-nanjing',
    },
    // Shanghai lab equipment
    {
      slug: 'scanning-electron-microscope-sem3000',
      nameZh: '扫描电子显微镜',
      nameEn: 'Scanning Electron Microscope',
      model: 'SEM-3000',
      manufacturer: '日立',
      descZh: '高分辨率扫描电子显微镜，配备能谱仪(EDS)，可进行微观形貌观察和元素成分分析。',
      status: 'AVAILABLE',
      bookable: true,
      quantity: 1,
      hourlyRate: 500,
      labSlug: 'energy-materials-char-lab-shanghai',
    },
    {
      slug: 'xrd-diffractometer-xrd6000',
      nameZh: 'X射线衍射仪',
      nameEn: 'X-Ray Diffractometer',
      model: 'XRD-6000',
      manufacturer: '岛津',
      descZh: '用于晶体结构分析和物相鉴定的高精度X射线衍射仪。',
      status: 'AVAILABLE',
      bookable: true,
      quantity: 1,
      hourlyRate: 400,
      labSlug: 'energy-materials-char-lab-shanghai',
    },
    // Zhenjiang lab equipment
    {
      slug: 'solar-simulator-ss50a',
      nameZh: '太阳能模拟器',
      nameEn: 'Solar Simulator',
      model: 'SS-50A',
      manufacturer: 'AAA',
      descZh: '标准太阳光模拟器，用于太阳能电池和光电催化材料的性能测试。',
      status: 'AVAILABLE',
      bookable: true,
      quantity: 2,
      hourlyRate: 180,
      labSlug: 'clean-energy-conversion-lab-zhenjiang',
    },
    {
      slug: 'eis-analyzer-eis100',
      nameZh: '电化学阻抗谱仪',
      nameEn: 'Electrochemical Impedance Spectrometer',
      model: 'EIS-100',
      manufacturer: '输力强',
      descZh: '高精度电化学阻抗测试系统，适用于燃料电池、电解槽等器件的阻抗分析。',
      status: 'AVAILABLE',
      bookable: true,
      quantity: 1,
      hourlyRate: 220,
      labSlug: 'clean-energy-conversion-lab-zhenjiang',
    },
    // Suzhou lab equipment
    {
      slug: 'universal-testing-machine-utm1000',
      nameZh: '万能材料试验机',
      nameEn: 'Universal Testing Machine',
      model: 'UTM-1000',
      manufacturer: '英斯特朗',
      descZh: '高精度万能材料试验机，可进行拉伸、压缩、弯曲等多种力学性能测试。',
      status: 'AVAILABLE',
      bookable: true,
      quantity: 3,
      hourlyRate: 120,
      labSlug: 'intelligent-testing-equipment-lab-suzhou',
    },
    {
      slug: 'fatigue-testing-machine-ft200',
      nameZh: '疲劳试验机',
      nameEn: 'Fatigue Testing Machine',
      model: 'FT-200',
      manufacturer: 'MTS',
      descZh: '电液伺服疲劳试验机，用于材料和构件的疲劳寿命与断裂韧性测试。',
      status: 'AVAILABLE',
      bookable: true,
      quantity: 1,
      hourlyRate: 250,
      labSlug: 'intelligent-testing-equipment-lab-suzhou',
    },
    // Additional Nanjing lab equipment
    {
      slug: 'battery-thermal-analyzer-bta200',
      nameZh: '电池热分析仪',
      nameEn: 'Battery Thermal Analyzer',
      model: 'BTA-200',
      manufacturer: '耐驰',
      descZh: '差示扫描量热仪，用于分析电池材料的热稳定性和安全性。',
      status: 'AVAILABLE',
      bookable: true,
      quantity: 1,
      hourlyRate: 280,
      labSlug: 'advanced-battery-rd-lab-nanjing',
    },
    {
      slug: 'galvanostat-pgstat302n',
      nameZh: '恒电位仪',
      nameEn: 'Potentiostat/Galvanostat',
      model: 'PGSTAT302N',
      manufacturer: '万通',
      descZh: '高性能恒电位仪，支持多种电化学测试方法。',
      status: 'AVAILABLE',
      bookable: true,
      quantity: 2,
      hourlyRate: 180,
      labSlug: 'advanced-battery-rd-lab-nanjing',
    },
    // Additional Shanghai lab equipment
    {
      slug: 'transmission-electron-microscope-tem200',
      nameZh: '透射电子显微镜',
      nameEn: 'Transmission Electron Microscope',
      model: 'TEM-200',
      manufacturer: 'FEI',
      descZh: '高分辨透射电镜，用于纳米材料结构和晶体缺陷分析。',
      status: 'AVAILABLE',
      bookable: true,
      quantity: 1,
      hourlyRate: 600,
      labSlug: 'energy-materials-char-lab-shanghai',
    },
    {
      slug: 'raman-spectrometer-labram',
      nameZh: '拉曼光谱仪',
      nameEn: 'Raman Spectrometer',
      model: 'LabRAM HR',
      manufacturer: 'HORIBA',
      descZh: '高分辨拉曼光谱仪，用于材料分子结构和应力分析。',
      status: 'AVAILABLE',
      bookable: true,
      quantity: 1,
      hourlyRate: 350,
      labSlug: 'energy-materials-char-lab-shanghai',
    },
    {
      slug: 'bet-surface-analyzer-tristar',
      nameZh: '比表面积分析仪',
      nameEn: 'BET Surface Area Analyzer',
      model: 'TriStar II',
      manufacturer: '麦克',
      descZh: '全自动比表面积和孔隙度分析仪，适用于多孔材料表征。',
      status: 'AVAILABLE',
      bookable: true,
      quantity: 1,
      hourlyRate: 200,
      labSlug: 'energy-materials-char-lab-shanghai',
    },
    // Additional Zhenjiang lab equipment
    {
      slug: 'photoelectrochemical-pec3000',
      nameZh: '光电化学测试系统',
      nameEn: 'Photoelectrochemical Test System',
      model: 'PEC-3000',
      manufacturer: '普林斯通',
      descZh: '光电催化性能测试系统，用于光解水、CO2还原等反应评估。',
      status: 'AVAILABLE',
      bookable: true,
      quantity: 1,
      hourlyRate: 240,
      labSlug: 'clean-energy-conversion-lab-zhenjiang',
    },
    {
      slug: 'fuel-cell-test-station-fcts500',
      nameZh: '燃料电池测试台',
      nameEn: 'Fuel Cell Test Station',
      model: 'FCTS-500',
      manufacturer: '绿动',
      descZh: '质子交换膜燃料电池性能测试与寿命评估系统。',
      status: 'AVAILABLE',
      bookable: true,
      quantity: 1,
      hourlyRate: 300,
      labSlug: 'clean-energy-conversion-lab-zhenjiang',
    },
    // Additional Suzhou lab equipment
    {
      slug: 'hardness-tester-hv1000',
      nameZh: '显微硬度计',
      nameEn: 'Micro Vickers Hardness Tester',
      model: 'HV-1000',
      manufacturer: '时代',
      descZh: '显微维氏硬度计，适用于小尺寸样品和镀层硬度测试。',
      status: 'AVAILABLE',
      bookable: true,
      quantity: 2,
      hourlyRate: 80,
      labSlug: 'intelligent-testing-equipment-lab-suzhou',
    },
    {
      slug: 'impact-tester-jb300b',
      nameZh: '冲击试验机',
      nameEn: 'Impact Testing Machine',
      model: 'JB-300B',
      manufacturer: '三思纵横',
      descZh: '摆锤式冲击试验机，用于金属材料冲击韧性测试。',
      status: 'AVAILABLE',
      bookable: true,
      quantity: 1,
      hourlyRate: 100,
      labSlug: 'intelligent-testing-equipment-lab-suzhou',
    },
    {
      slug: 'ultrasonic-flaw-detector-udm300',
      nameZh: '超声波探伤仪',
      nameEn: 'Ultrasonic Flaw Detector',
      model: 'UDM-300',
      manufacturer: '奥林巴斯',
      descZh: '数字式超声波探伤仪，用于焊缝和铸件内部缺陷检测。',
      status: 'AVAILABLE',
      bookable: true,
      quantity: 2,
      hourlyRate: 150,
      labSlug: 'intelligent-testing-equipment-lab-suzhou',
    },
  ];

  // Link new labs to some existing services if possible
  const services = await prisma.testingService.findMany({ select: { id: true }, take: 10 });

  for (const eq of equipmentData) {
    const lab = createdLabs.find((l) => l.slug === eq.labSlug);
    if (!lab) {
      console.log(`  ⚠️  Lab not found for equipment: ${eq.nameZh}`);
      continue;
    }

    const existing = await prisma.equipment.findUnique({ where: { slug: eq.slug } });
    if (existing) {
      console.log(`  ⏭️  Equipment already exists: ${eq.nameZh}`);
      continue;
    }

    const { labSlug, ...data } = eq;
    const created = await prisma.equipment.create({
      data: {
        ...data,
        labId: lab.id,
      },
    });
    console.log(`  ✅ Created equipment: ${created.nameZh} (Lab: ${lab.nameZh})`);
  }

  // Link labs to services
  for (const lab of createdLabs) {
    const existingLinks = await prisma.labService.count({ where: { labId: lab.id } });
    if (existingLinks === 0 && services.length > 0) {
      await prisma.labService.createMany({
        data: services.map((s) => ({ labId: lab.id, serviceId: s.id })),
        skipDuplicates: true,
      });
      console.log(`  🔗 Linked ${services.length} services to ${lab.nameZh}`);
    }
  }

  console.log('🎉 Labs and equipment seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
