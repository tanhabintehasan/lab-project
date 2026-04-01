export type UserRole =
  | 'VISITOR'
  | 'CUSTOMER'
  | 'ENTERPRISE_MEMBER'
  | 'LAB_PARTNER'
  | 'TECHNICIAN'
  | 'FINANCE_ADMIN'
  | 'SUPER_ADMIN';

export type OrderStatus =
  | 'PENDING_PAYMENT' | 'PAID' | 'SAMPLE_PENDING' | 'SAMPLE_SHIPPED'
  | 'SAMPLE_RECEIVED' | 'SAMPLE_INSPECTED' | 'TESTING_IN_PROGRESS'
  | 'TESTING_COMPLETE' | 'REPORT_GENERATING' | 'REPORT_APPROVED'
  | 'REPORT_DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'REFUNDING' | 'REFUNDED';

export type SampleStatus =
  | 'PENDING_SUBMISSION' | 'SHIPPED' | 'RECEIVED' | 'INSPECTING'
  | 'INSPECTION_PASSED' | 'INSPECTION_FAILED' | 'TESTING'
  | 'TESTING_COMPLETE' | 'STORED' | 'RETURNED' | 'DISPOSED';

export type RFQStatus =
  | 'SUBMITTED' | 'UNDER_REVIEW' | 'INFO_REQUESTED' | 'QUOTING'
  | 'QUOTED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'CONVERTED';

export type ReportStatus = 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';

export type PricingModel = 'FIXED' | 'RANGE' | 'QUOTE_ONLY' | 'TIERED';

export type PaymentMethod = 'WALLET' | 'WECHAT_PAY' | 'ALIPAY' | 'BANK_TRANSFER' | 'ENTERPRISE_BILLING';

export interface ServiceItem {
  id: string;
  slug: string;
  nameZh: string;
  nameEn?: string;
  shortDescZh?: string;
  shortDescEn?: string;
  categoryId: string;
  pricingModel: PricingModel;
  priceMin?: number;
  priceMax?: number;
  turnaroundDays?: number;
  isActive: boolean;
  isFeatured: boolean;
  isHot: boolean;
}

export interface OrderSummary {
  id: string;
  orderNo: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  itemCount: number;
}

export interface SampleSummary {
  id: string;
  sampleNo: string;
  name: string;
  status: SampleStatus;
  orderId: string;
}

export interface ReportSummary {
  id: string;
  reportNo: string;
  title: string;
  status: ReportStatus;
  orderId: string;
  issuedAt?: string;
}

export interface WalletInfo {
  balance: number;
  frozenAmount: number;
  currency: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  titleZh: string;
  titleEn?: string;
  contentZh: string;
  contentEn?: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
