import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  equipmentController,
  Equipment,
  EquipmentCreateInput,
  EquipmentUpdateInput,
} from '@/services/api/admin/equipment';

export const EQUIPMENT_KEY = ['admin', 'equipment'];

export function useEquipment(page: number, search: string, labId?: string) {
  return useQuery({
    queryKey: [...EQUIPMENT_KEY, page, search, labId],
    queryFn: () => equipmentController.list({ page, pageSize: 15, q: search, labId }),
  });
}

export function useCreateEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: EquipmentCreateInput) => equipmentController.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: EQUIPMENT_KEY }),
  });
}

export function useUpdateEquipment(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: EquipmentUpdateInput) => {
      if (!id) throw new Error('Equipment ID required');
      return equipmentController.update(id, payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: EQUIPMENT_KEY }),
  });
}

export function useToggleEquipmentBookable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, bookable }: { id: string; bookable: boolean }) =>
      equipmentController.toggle(id, { bookable }),
    onSuccess: () => qc.invalidateQueries({ queryKey: EQUIPMENT_KEY }),
  });
}

export function useDeleteEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => equipmentController.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: EQUIPMENT_KEY }),
  });
}

export function useUploadEquipmentMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      equipmentController.uploadMedia(id, formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: EQUIPMENT_KEY }),
  });
}

export function useDeleteEquipmentMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, mediaId }: { id: string; mediaId: string }) =>
      equipmentController.deleteMedia(id, mediaId),
    onSuccess: () => qc.invalidateQueries({ queryKey: EQUIPMENT_KEY }),
  });
}
