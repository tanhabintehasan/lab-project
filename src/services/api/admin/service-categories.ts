import { BaseAdminController, AdminListQuery } from './base';

export interface LocalizedRequired {
  zh: string;
  en?: string | null;
}

export interface LocalizedOptional {
  zh?: string | null;
  en?: string | null;
}

export interface ServiceCategory {
  id: string;
  slug: string;
  name: LocalizedRequired;
  description?: LocalizedOptional | null;
  icon?: string | null;
  image?: string | null;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
  seoTitle?: LocalizedOptional | null;
  seoDescription?: LocalizedOptional | null;
  createdAt: string;
  updatedAt: string;
  parent?: {
    id: string;
    name: LocalizedRequired;
    slug: string;
  } | null;
  _count?: {
    services: number;
    children: number;
  };
}

export interface ServiceCategoryCreateInput {
  name: LocalizedRequired;
  description?: LocalizedOptional | null;
  slug: string;
  icon?: string | null;
  image?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  seoTitle?: LocalizedOptional | null;
  seoDescription?: LocalizedOptional | null;
}

export interface ServiceCategoryUpdateInput extends Partial<ServiceCategoryCreateInput> {}

class ServiceCategoryController extends BaseAdminController<
  ServiceCategory,
  ServiceCategoryCreateInput,
  ServiceCategoryUpdateInput
> {
  constructor() {
    super('/api/admin/service-categories');
  }

  /**
   * List categories with optional parent filter.
   */
  async list(params: AdminListQuery & { parentId?: string } = {}) {
    return super.list(params);
  }

  /**
   * Bulk reorder categories.
   */
  async reorder(items: { id: string; sortOrder: number }[]) {
    return this.patchCustom<{ updated: number }>('reorder', { items });
  }
}

export const serviceCategoryController = new ServiceCategoryController();
