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
  locale: z.enum(['zh-CN', 'en']).default('zh-CN'),
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
  locale: z.enum(['zh-CN', 'en']).optional(),
});

export const preferencesSchema = z.object({
  locale: z.enum(['zh-CN', 'en']).optional(),
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

export const adminServiceCreateSchema = z.object({
  slug: z.string().max(200).optional(),
  categoryId: z.string().cuid().optional(),
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
  isFeatured: z.boolean().optional(),
  isHot: z.boolean().optional(),
});

export const adminLabCreateSchema = z.object({
  slug: z.string().max(200).optional(),
  nameZh: z.string().min(1).max(200),
  nameEn: z.string().max(200).optional(),
  shortDescZh: z.string().max(500).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
});

export const adminLabStatusSchema = z.object({
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE']),
});

export const cmsPageSchema = z.object({
  slug: z.string().max(200).optional(),
  type: z.string().max(50).optional(),
  titleZh: z.string().min(1).max(200),
  titleEn: z.string().max(200).optional(),
  contentZh: z.string().max(50000).optional(),
  contentEn: z.string().max(50000).optional(),
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
