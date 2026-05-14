import { BaseAdminController, AdminListQuery } from './base';

export interface CustomField {
  id?: string;
  label: string;
  fieldType: 'TEXT' | 'NUMBER' | 'SELECT' | 'TEXTAREA';
  options?: string | null;
  isRequired: boolean;
  placeholder?: string | null;
  sortOrder: number;
}

export interface ServiceMedia {
  id: string;
  url: string;
  caption?: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface ServiceLab {
  id: string;
  labId: string;
  isActive: boolean;
  lab: {
    id: string;
    nameZh: string;
    slug: string;
  };
}

export interface ServiceCategoryBrief {
  id: string;
  name: { zh: string; en?: string | null };
  slug: string;
}

export interface Service {
  id: string;
  slug: string;
  nameZh: string;
  nameEn?: string | null;
  shortDescZh?: string | null;
  shortDescEn?: string | null;
  fullDescZh?: string | null;
  fullDescEn?: string | null;
  pricingModel: 'FIXED' | 'RANGE' | 'QUOTE_ONLY' | 'TIERED';
  priceMin?: number | null;
  priceMax?: number | null;
  basePrice?: number | null;
  discountPrice?: number | null;
  currency: string;
  turnaroundDays?: number | null;
  turnaroundDesc?: string | null;
  turnaroundTime?: string | null;
  sampleRequirement?: string | null;
  sampleCount?: string | null;
  sampleSize?: string | null;
  sampleWeight?: string | null;
  sampleCondition?: string | null;
  samplePreservation?: string | null;
  samplePreparation?: string | null;
  deliverables?: string | null;
  sortOrder: number;
  status: 'DRAFT' | 'PUBLISHED';
  isActive: boolean;
  isFeatured: boolean;
  isHot: boolean;
  viewCount: number;
  orderCount: number;
  seoTitleZh?: string | null;
  seoTitleEn?: string | null;
  seoDescZh?: string | null;
  seoDescEn?: string | null;
  categoryId: string;
  category?: ServiceCategoryBrief | null;
  customFields?: CustomField[];
  media?: ServiceMedia[];
  labServices?: ServiceLab[];
  createdAt: string;
  updatedAt: string;
}

export interface ServiceCreateInput {
  slug?: string;
  categoryId: string;
  nameZh: string;
  nameEn?: string | null;
  shortDescZh?: string | null;
  shortDescEn?: string | null;
  fullDescZh?: string | null;
  fullDescEn?: string | null;
  pricingModel?: 'FIXED' | 'RANGE' | 'QUOTE_ONLY' | 'TIERED';
  priceMin?: number | null;
  priceMax?: number | null;
  basePrice?: number | null;
  discountPrice?: number | null;
  turnaroundDays?: number | null;
  turnaroundTime?: string | null;
  sampleRequirement?: string | null;
  sampleCount?: string | null;
  sampleSize?: string | null;
  sampleWeight?: string | null;
  sampleCondition?: string | null;
  samplePreservation?: string | null;
  samplePreparation?: string | null;
  deliverables?: string | null;
  sortOrder?: number;
  status?: 'DRAFT' | 'PUBLISHED';
  isFeatured?: boolean;
  isHot?: boolean;
  isActive?: boolean;
  seoTitleZh?: string | null;
  seoTitleEn?: string | null;
  seoDescZh?: string | null;
  seoDescEn?: string | null;
  customFields?: Omit<CustomField, 'id'>[];
  labIds?: string[];
}

export interface ServiceUpdateInput extends Partial<ServiceCreateInput> {}

class ServiceController extends BaseAdminController<
  Service,
  ServiceCreateInput,
  ServiceUpdateInput
> {
  constructor() {
    super('/api/admin/services');
  }

  /**
   * List services with optional category filter.
   */
  async list(params: AdminListQuery & { categoryId?: string } = {}) {
    return super.list(params);
  }

  /**
   * Bulk reorder services.
   */
  async reorder(items: { id: string; sortOrder: number }[]) {
    return this.patchCustom<{ updated: number }>('reorder', { items });
  }

  /**
   * Upload media for a service.
   */
  async uploadMedia(serviceId: string, formData: FormData) {
    return this.postCustom<any>(`${serviceId}/media`, formData);
  }

  /**
   * Delete a service media item.
   */
  async deleteMedia(serviceId: string, mediaId: string) {
    return this.deleteCustom<any>(`${serviceId}/media?mediaId=${mediaId}`);
  }
}

export const serviceController = new ServiceController();
