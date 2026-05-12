import {
  Award,
  Users,
  FlaskConical,
  Lightbulb,
  GraduationCap,
  Building2,
  Landmark,
} from 'lucide-react';

export const defaultServiceCategories = [
  { id: 'default-cat-1', name: '前沿测试', icon: '🔬', slug: 'frontier-testing', bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-100' },
  { id: 'default-cat-2', name: '化学成分测试', icon: '🧪', slug: 'chemical-composition', bgColor: 'bg-cyan-50', textColor: 'text-cyan-700', borderColor: 'border-cyan-100' },
  { id: 'default-cat-3', name: '电化学测试', icon: '⚡', slug: 'electrochemical', bgColor: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-100' },
  { id: 'default-cat-4', name: '环境测试', icon: '🌿', slug: 'environmental', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', borderColor: 'border-emerald-100' },
  { id: 'default-cat-5', name: '生物测试', icon: '🧬', slug: 'biological', bgColor: 'bg-purple-50', textColor: 'text-purple-700', borderColor: 'border-purple-100' },
  { id: 'default-cat-6', name: '材料微观分析', icon: '🔍', slug: 'microscopic-analysis', bgColor: 'bg-indigo-50', textColor: 'text-indigo-700', borderColor: 'border-indigo-100' },
  { id: 'default-cat-7', name: '专利服务', icon: '📄', slug: 'patent-services', bgColor: 'bg-rose-50', textColor: 'text-rose-700', borderColor: 'border-rose-100' },
  { id: 'default-cat-8', name: '论文服务', icon: '📝', slug: 'paper-services', bgColor: 'bg-orange-50', textColor: 'text-orange-700', borderColor: 'border-orange-100' },
  { id: 'default-cat-9', name: '可靠性测试', icon: '🛡️', slug: 'reliability-testing', bgColor: 'bg-teal-50', textColor: 'text-teal-700', borderColor: 'border-teal-100' },
  { id: 'default-cat-10', name: '标准认证', icon: '✅', slug: 'standard-certification', bgColor: 'bg-sky-50', textColor: 'text-sky-700', borderColor: 'border-sky-100' },
];

export const defaultAdvantages = [
  {
    id: 'default-adv-1',
    title: '权威认证',
    icon: Award,
    color: 'text-blue-700',
    bg: 'bg-gradient-to-br from-blue-50 to-blue-100/50',
    border: 'border-blue-100',
    items: ['CNAS实验室认可', 'CMA资质认定', 'HTE高新技术企业认证', 'ISO9001质量管理认证'],
  },
  {
    id: 'default-adv-2',
    title: '先进平台',
    icon: Users,
    color: 'text-emerald-700',
    bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50',
    border: 'border-emerald-100',
    items: ['全球顶级专家团队', '提供一对一全流程定制服务', '客户复购及推荐率＞87%', '测试服务满意度超93.2%'],
  },
  {
    id: 'default-adv-3',
    title: '专业服务',
    icon: FlaskConical,
    color: 'text-amber-700',
    bg: 'bg-gradient-to-br from-amber-50 to-amber-100/50',
    border: 'border-amber-100',
    items: ['先测试后付费', '免费上门取样 / 异地邮寄到付', '专属技术顾问', '数据真实可溯源'],
  },
  {
    id: 'default-adv-4',
    title: '创新赋能',
    icon: Lightbulb,
    color: 'text-purple-700',
    bg: 'bg-gradient-to-br from-purple-50 to-purple-100/50',
    border: 'border-purple-100',
    items: ['累计服务创新项目10000+', '支持300+高校科研团队', '平台技术迭代周期<30天', '研发检测一体化解决方案'],
  },
];

export const defaultStatsBanner = [
  { id: 'default-stat-1', value: '4000+', label: '合作单位' },
  { id: 'default-stat-2', value: '220w+', label: '样品测试' },
  { id: 'default-stat-3', value: '84w+', label: '服务客户' },
  { id: 'default-stat-4', value: '4.1天', label: '平均测试周期' },
];

export const defaultWhyChooseStats = [
  { id: 'default-why-1', value: '3000+', label: '合作实验室', sub: '覆盖全国重点城市' },
  { id: 'default-why-2', value: '4.2', label: '平均测试周期', sub: '天' },
  { id: 'default-why-3', value: '158W+', label: '累计测试样品', sub: '覆盖全学科领域' },
  { id: 'default-why-4', value: '700+', label: '专业检测设备', sub: '高端进口仪器' },
  { id: 'default-why-5', value: '76W+', label: '服务科研人员', sub: '好评率超98%' },
];

export const defaultOfficeCities = [
  { id: 'default-city-1', name: '北京' },
  { id: 'default-city-2', name: '上海' },
  { id: 'default-city-3', name: '广州' },
  { id: 'default-city-4', name: '深圳' },
  { id: 'default-city-5', name: '杭州' },
  { id: 'default-city-6', name: '南京' },
  { id: 'default-city-7', name: '武汉' },
  { id: 'default-city-8', name: '成都' },
  { id: 'default-city-9', name: '西安' },
  { id: 'default-city-10', name: '天津' },
];

export const defaultLabs = [
  { id: 'default-lab-1', name: '先进电池研发实验室', location: '南京', specialties: '电池测试，性能分析', imageBg: 'bg-gradient-to-br from-blue-100 to-blue-50', image: '/uploads/settings/lab1.jpg' },
  { id: 'default-lab-2', name: '能源材料表征实验室', location: '上海', specialties: '材料表征，化学分析', imageBg: 'bg-gradient-to-br from-emerald-100 to-emerald-50', image: '/uploads/settings/lab2.jpg' },
  { id: 'default-lab-3', name: '清洁能源转化实验室', location: '镇江', specialties: '材料表征，化学分析', imageBg: 'bg-gradient-to-br from-amber-100 to-amber-50', image: '/uploads/settings/lab3.jpg' },
  { id: 'default-lab-4', name: '智能检测装备实验室', location: '苏州', specialties: '无损检测，可靠性分析', imageBg: 'bg-gradient-to-br from-purple-100 to-purple-50', image: '/uploads/settings/lab4.png' },
];

export const defaultPartners = [
  {
    id: 'default-part-1',
    title: '高校合作',
    sub: '重点优先',
    icon: GraduationCap,
    iconBg: 'bg-blue-50',
    iconColor: 'text-[#0066B3]',
    items: ['重点实验室共享服务', '科研课题测试支撑', '高校仪器开放合作'],
  },
  {
    id: 'default-part-2',
    title: '企业合作',
    sub: '产业创新协同',
    icon: Building2,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    items: ['研发测试与中试验证', '供应链质量评价', '批量委托与年度协议'],
  },
  {
    id: 'default-part-3',
    title: '检测与支撑单位',
    sub: '协同服务网络',
    icon: Landmark,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    items: ['第三方检测机构', '行业技术中心', '公共实验平台'],
  },
];

export const defaultEquipment = [
  { id: 'default-equip-1', title: '表征设备', description: '高端分析设备', image: '/uploads/settings/equip-1.png' },
  { id: 'default-equip-2', title: '电化学设备', description: '电池测试系统', image: '/uploads/settings/equip-2.png' },
  { id: 'default-equip-3', title: '环境设备', description: '可靠性测试设备', image: '/uploads/settings/equip-3.png' },
];
