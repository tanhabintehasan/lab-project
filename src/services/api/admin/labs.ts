import { BaseAdminController, AdminListQuery } from './base';

export interface Laboratory {
  id: string;
  slug: string;
  nameZh: string;
  nameEn?: string | null;
  shortDescZh?: string | null;
  shortDescEn?: string | null;
  fullDescZh?: string | null;
  fullDescEn?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  logo?: string | null;
  coverImage?: string | null;
  certifications?: Record<string, any> | null;
  specialties?: Record<string, any> | null;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  vendorCode?: string | null;
  commissionRate?: number | null;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
  vendorTier?: 'PREMIUM' | 'STANDARD' | 'BASIC' | null;
  billingEmail?: string | null;
  billingAddress?: string | null;
  taxId?: string | null;
  businessLicense?: string | null;
  primaryContactName?: string | null;
  primaryContactPhone?: string | null;
  isVerified?: boolean;
  rating?: number | null;
  completedOrders?: number;
  avgTurnaroundDays?: number | null;
  media?: { id: string; url: string; caption?: string | null; sortOrder: number }[];
  _count?: { services: number; equipment: number; users: number };
  createdAt: string;
  updatedAt: string;
}

export interface LabCreateInput {
  slug?: string;
  nameZh: string;
  nameEn?: string;
  shortDescZh?: string;
  shortDescEn?: string;
  fullDescZh?: string;
  fullDescEn?: string;
  address?: string;
  city?: string;
  province?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  coverImage?: string;
  certifications?: Record<string, any> | null;
  specialties?: Record<string, any> | null;
  status?: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  vendorCode?: string;
  commissionRate?: number;
  contractStartDate?: string;
  contractEndDate?: string;
  vendorTier?: 'PREMIUM' | 'STANDARD' | 'BASIC';
  billingEmail?: string;
  billingAddress?: string;
  taxId?: string;
  businessLicense?: string;
  primaryContactName?: string;
  primaryContactPhone?: string;
}

export interface LabUpdateInput extends Partial<LabCreateInput> {}

class LabController extends BaseAdminController<Laboratory, LabCreateInput, LabUpdateInput> {
  constructor() {
    super('/api/admin/labs');
  }

  async uploadMedia(id: string, formData: FormData) {
    return this.postCustom<{ id: string; url: string }>(`${id}/media`, formData);
  }

  async deleteMedia(id: string, mediaId: string) {
    return this.deleteCustom<{ deleted: boolean }>(`${id}/media?mediaId=${mediaId}`);
  }
}

export const labController = new LabController();
