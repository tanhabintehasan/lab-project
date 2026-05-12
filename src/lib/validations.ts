import { z } from 'zod';

// ─── Auth ────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
});

export const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(8, '密码至少8位'),
  name: z.string().min(1, '请输入姓名').max(100),
  phone: z.string().max(20).optional(),
  companyName: z.string().max(200).optional(),
  locale: z.literal('zh-CN').default('zh-CN'),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8, '新密码至少8位'),
});

export const requestResetSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

// ─── Profile ─────────────────────────────────────────────────
export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  locale: z.literal('zh-CN').optional(),
});

export const preferencesSchema = z.object({
  locale: z.literal('zh-CN').optional(),
});

// ─── Address ─────────────────────────────────────────────────
export const addressSchema = z.object({
  label: z.string().max(50).optional(),
  name: z.string().min(1).max(100),
  phone: z.string().min(1).max(20),
  province: z.string().min(1).max(50),
  city: z.string().min(1).max(50),
  district: z.string().min(1).max(50),
  street: z.string().min(1).max(200),
  postalCode: z.string().max(20).optional(),
  isDefault: z.boolean().optional(),
});

// ─── Invoice Profile ─────────────────────────────────────────
export const invoiceProfileSchema = z.object({
  companyName: z.string().min(1).max(200),
  taxNumber: z.string().min(1).max(50),
  bankName: z.string().max(100).optional(),
  bankAccount: z.string().max(50).optional(),
  address: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
  isDefault: z.boolean().optional(),
});

// ─── Contact ─────────────────────────────────────────────────
export const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  subject: z.string().max(100).optional(),
  message: z.string().min(1).max(5000),
});

// ─── Wallet ──────────────────────────────────────────────────
export const rechargeSchema = z.object({
  amount: z.number().positive().max(1_000_000),
  idempotencyKey: z.string().min(1).max(100).optional(),
});

// ─── Quotation ───────────────────────────────────────────────
export const quotationActionSchema = z.object({
  action: z.enum(['accept', 'reject']),
});

// ─── Order update ────────────────────────────────────────────
const validOrderStatuses = [
  'PENDING_PAYMENT', 'PAID', 'SAMPLE_PENDING', 'SAMPLE_SHIPPED',
  'SAMPLE_RECEIVED', 'SAMPLE_INSPECTED', 'TESTING_IN_PROGRESS',
  'TESTING_COMPLETE', 'REPORT_GENERATING', 'REPORT_APPROVED',
  'REPORT_DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDING', 'REFUNDED',
] as const;

export const orderUpdateSchema = z.object({
  status: z.enum(validOrderStatuses).optional(),
  assignedLabId: z.string().cuid().optional(),
}).refine(d => d.status || d.assignedLabId, { message: 'Must provide status or assignedLabId' });

// Allowed transitions per role
export const ORDER_TRANSITIONS: Record<string, Record<string, string[]>> = {
  SUPER_ADMIN: {
    '*': validOrderStatuses as unknown as string[],
  },
  FINANCE_ADMIN: {
    PENDING_PAYMENT: ['PAID', 'CANCELLED'],
    REFUNDING: ['REFUNDED'],
  },
  LAB_PARTNER: {
    PAID: ['SAMPLE_PENDING'],
    SAMPLE_RECEIVED: ['SAMPLE_INSPECTED', 'TESTING_IN_PROGRESS'],
    SAMPLE_INSPECTED: ['TESTING_IN_PROGRESS'],
    TESTING_IN_PROGRESS: ['TESTING_COMPLETE'],
    TESTING_COMPLETE: ['REPORT_GENERATING'],
    REPORT_GENERATING: ['REPORT_APPROVED'],
  },
  CUSTOMER: {
    PENDING_PAYMENT: ['CANCELLED'],
    REPORT_DELIVERED: ['COMPLETED'],
  },
};

export function isValidTransition(role: string, currentStatus: string, newStatus: string): boolean {
  const roleTransitions = ORDER_TRANSITIONS[role];
  if (!roleTransitions) return false;
  // Wildcard for SUPER_ADMIN
  if (roleTransitions['*']) return true;
  const allowed = roleTransitions[currentStatus];
  return !!allowed && allowed.includes(newStatus);
}

// ─── Admin ───────────────────────────────────────────────────
export const adminUserUpdateSchema = z.object({
  role: z.enum(['VISITOR', 'CUSTOMER', 'ENTERPRISE_MEMBER', 'LAB_PARTNER', 'TECHNICIAN', 'FINANCE_ADMIN', 'SUPER_ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION']).optional(),
}).refine(d => d.role || d.status, { message: 'Must provide role or status' });

export const serviceCustomFieldSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1).max(200),
  fieldType: z.enum(['TEXT', 'NUMBER', 'SELECT', 'TEXTAREA']).default('TEXT'),
  options: z.string().max(2000).optional(),
  isRequired: z.boolean().default(false),
  placeholder: z.string().max(500).optional(),
  sortOrder: z.number().int().default(0),
});

export const adminServiceCreateSchema = z.object({
  slug: z.string().max(200).optional(),
  categoryId: z.string().min(1),
  nameZh: z.string().min(1).max(200),
  nameEn: z.string().max(200).optional(),
  shortDescZh: z.string().max(500).optional(),
  shortDescEn: z.string().max(500).optional(),
  fullDescZh: z.string().max(10000).optional(),
  pricingModel: z.enum(['FIXED', 'RANGE', 'QUOTE_ONLY', 'TIERED']).optional(),
  priceMin: z.number().positive().optional(),
  priceMax: z.number().positive().optional(),
  turnaroundDays: z.number().int().positive().optional(),
  sampleRequirement: z.string().max(5000).optional(),
  sampleCount: z.string().max(200).optional(),
  sampleSize: z.string().max(200).optional(),
  sampleWeight: z.string().max(200).optional(),
  sampleCondition: z.string().max(500).optional(),
  samplePreservation: z.string().max(500).optional(),
  samplePreparation: z.string().max(1000).optional(),
  isFeatured: z.boolean().optional(),
  isHot: z.boolean().optional(),
  customFields: z.array(serviceCustomFieldSchema).optional(),
});

export const adminLabCreateSchema = z.object({
  slug: z.string().max(200).optional(),
  nameZh: z.string().min(1).max(200),
  nameEn: z.string().max(200).optional(),
  shortDescZh: z.string().max(500).optional(),
  fullDescZh: z.string().max(10000).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE']).optional(),
});

export const adminLabStatusSchema = z.object({
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE']),
});

export const adminEquipmentCreateSchema = z.object({
  slug: z.string().max(200).optional(),
  nameZh: z.string().min(1).max(200),
  nameEn: z.string().max(200).optional(),
  model: z.string().max(200).optional(),
  manufacturer: z.string().max(200).optional(),
  labId: z.string().cuid().optional(),
  descZh: z.string().max(5000).optional(),
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'UNAVAILABLE']).optional(),
  bookable: z.boolean().optional(),
  quantity: z.number().int().min(1).default(1),
  hourlyRate: z.number().nonnegative().optional(),
  dailyRate: z.number().nonnegative().optional(),
});

export const cmsPageSchema = z.object({
  slug: z.string().max(200).optional(),
  type: z.string().max(50).optional(),
  titleZh: z.string().min(1).max(200),
  titleEn: z.string().max(200).optional().nullable(),
  contentZh: z.string().max(50000).optional().nullable(),
  contentEn: z.string().max(50000).optional().nullable(),
  excerpt: z.string().max(5000).optional().nullable(),
  coverImage: z.string().max(500).optional().nullable(),
  isPublished: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

// ─── Referral Withdrawal ─────────────────────────────────────
export const withdrawalSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(['bank_transfer', 'alipay', 'wechat']).optional(),
  accountInfo: z.record(z.string()).optional(),
});

// ─── Lab Portal ──────────────────────────────────────────────
export const labOrderUpdateSchema = z.object({
  status: z.enum(validOrderStatuses),
});

export const labSampleUpdateSchema = z.object({
  status: z.enum([
    'PENDING_SUBMISSION', 'SHIPPED', 'RECEIVED', 'INSPECTING',
    'INSPECTION_PASSED', 'INSPECTION_FAILED', 'TESTING',
    'TESTING_COMPLETE', 'STORED', 'RETURNED', 'DISPOSED',
  ]),
});

export const labReportCreateSchema = z.object({
  orderId: z.string().cuid(),
  title: z.string().min(1).max(200),
  summaryZh: z.string().max(10000).optional(),
  summaryEn: z.string().max(10000).optional(),
  fileUrl: z.string().url().optional(),
});

// Site Setting
export const siteSettingSchema = z.object({
  siteName: z.string().max(200).optional().nullable(),
  siteNameEn: z.string().max(200).optional().nullable(),
  logoUrl: z.string().max(500).optional().nullable(),
  logoUploadUrl: z.string().max(500).optional().nullable(),
  brandColor: z.string().max(50).optional().nullable(),
  faviconUrl: z.string().max(500).optional().nullable(),
  supportEmail: z.union([z.string().email(), z.literal('')]).optional().nullable(),
  supportPhone: z.string().max(50).optional().nullable(),
  whatsapp: z.string().max(50).optional().nullable(),
  wechat: z.string().max(50).optional().nullable(),
  addressZh: z.string().max(500).optional().nullable(),
  addressEn: z.string().max(500).optional().nullable(),
  facebookUrl: z.string().max(500).optional().nullable(),
  linkedinUrl: z.string().max(500).optional().nullable(),
  youtubeUrl: z.string().max(500).optional().nullable(),
  footerTextZh: z.string().max(5000).optional().nullable(),
  footerTextEn: z.string().max(5000).optional().nullable(),
  seoTitleZh: z.string().max(200).optional().nullable(),
  seoTitleEn: z.string().max(200).optional().nullable(),
  seoDescriptionZh: z.string().max(500).optional().nullable(),
  seoDescriptionEn: z.string().max(500).optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
});

// CMS Section
export const cmsSectionSchema = z.object({
  pageId: z.string().min(1),
  sectionKey: z.string().min(1).max(100),
  name: z.string().max(200).optional().nullable(),
  titleZh: z.string().max(500).optional().nullable(),
  titleEn: z.string().max(500).optional().nullable(),
  subtitleZh: z.string().max(500).optional().nullable(),
  subtitleEn: z.string().max(500).optional().nullable(),
  descriptionZh: z.string().max(10000).optional().nullable(),
  descriptionEn: z.string().max(10000).optional().nullable(),
  badgeZh: z.string().max(200).optional().nullable(),
  badgeEn: z.string().max(200).optional().nullable(),
  imageUrl: z.string().max(500).optional().nullable(),
  imageAltZh: z.string().max(200).optional().nullable(),
  imageAltEn: z.string().max(200).optional().nullable(),
  layoutType: z.string().max(50).optional().nullable(),
  styleVariant: z.string().max(50).optional().nullable(),
  isEnabled: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  metadata: z.record(z.any()).optional().nullable(),
});

// CMS Section Item
export const cmsSectionItemSchema = z.object({
  sectionId: z.string().min(1),
  titleZh: z.string().max(500).optional().nullable(),
  titleEn: z.string().max(500).optional().nullable(),
  subtitleZh: z.string().max(500).optional().nullable(),
  subtitleEn: z.string().max(500).optional().nullable(),
  descriptionZh: z.string().max(10000).optional().nullable(),
  descriptionEn: z.string().max(10000).optional().nullable(),
  imageUrl: z.string().max(500).optional().nullable(),
  imageAltZh: z.string().max(200).optional().nullable(),
  imageAltEn: z.string().max(200).optional().nullable(),
  linkUrl: z.string().max(500).optional().nullable(),
  linkLabelZh: z.string().max(200).optional().nullable(),
  linkLabelEn: z.string().max(200).optional().nullable(),
  icon: z.string().max(100).optional().nullable(),
  badgeZh: z.string().max(200).optional().nullable(),
  badgeEn: z.string().max(200).optional().nullable(),
  value: z.string().max(200).optional().nullable(),
  sortOrder: z.number().int().optional(),
  isEnabled: z.boolean().optional(),
  metadata: z.record(z.any()).optional().nullable(),
});

// CMS Section Item Point
export const cmsSectionItemPointSchema = z.object({
  itemId: z.string().min(1),
  textZh: z.string().min(1).max(500),
  textEn: z.string().max(500).optional().nullable(),
  sortOrder: z.number().int().optional(),
  isEnabled: z.boolean().optional(),
});
