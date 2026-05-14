import { BaseAdminController, AdminListQuery } from './base';

export interface Equipment {
  id: string;
  slug: string;
  nameZh: string;
  nameEn?: string | null;
  model?: string | null;
  manufacturer?: string | null;
  labId?: string | null;
  descZh?: string | null;
  descEn?: string | null;
  specifications?: Record<string, any> | null;
  certifications?: Record<string, any> | null;
  images?: string[] | null;
  videoUrl?: string | null;
  usageInstructions?: string | null;
  lastCalibratedAt?: string | null;
  nextCalibrationDue?: string | null;
  calibrationCertificateUrl?: string | null;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'UNAVAILABLE';
  bookable: boolean;
  quantity?: number | null;
  hourlyRate?: number | null;
  dailyRate?: number | null;
  isActive?: boolean;
  media?: { id: string; url: string; caption?: string | null; sortOrder: number }[];
  services?: { id: string; serviceId: string; service?: { id: string; nameZh: string; status: string } }[];
  createdAt: string;
  updatedAt: string;
  lab?: {
    id: string;
    nameZh: string;
  } | null;
}

export interface EquipmentCreateInput {
  slug?: string;
  nameZh: string;
  nameEn?: string;
  model?: string;
  manufacturer?: string;
  labId?: string;
  descZh?: string;
  descEn?: string;
  specifications?: Record<string, any> | null;
  certifications?: Record<string, any> | null;
  images?: string[] | null;
  videoUrl?: string;
  usageInstructions?: string;
  lastCalibratedAt?: string;
  nextCalibrationDue?: string;
  calibrationCertificateUrl?: string;
  status?: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'UNAVAILABLE';
  bookable?: boolean;
  quantity?: number;
  hourlyRate?: number;
  dailyRate?: number;
  isActive?: boolean;
  serviceIds?: string[];
}

export interface EquipmentUpdateInput extends Partial<EquipmentCreateInput> {}

class EquipmentController extends BaseAdminController<Equipment, EquipmentCreateInput, EquipmentUpdateInput> {
  constructor() {
    super('/api/admin/equipment');
  }

  async list(params: AdminListQuery & { labId?: string } = {}) {
    return super.list(params);
  }

  async uploadMedia(id: string, formData: FormData) {
    return this.postCustom<{ id: string; url: string }>(`${id}/media`, formData);
  }

  async deleteMedia(id: string, mediaId: string) {
    return this.deleteCustom<{ deleted: boolean }>(`${id}/media?mediaId=${mediaId}`);
  }
}

export const equipmentController = new EquipmentController();
