import { useQuery } from '@tanstack/react-query';

interface LabAssociation {
  hasLab: boolean;
  labId: string | null;
  role: string | null;
}

export function useLabAssociation() {
  return useQuery({
    queryKey: ['auth', 'lab'],
    queryFn: async (): Promise<LabAssociation> => {
      const res = await fetch('/api/auth/lab', { credentials: 'include', cache: 'no-store' });
      if (!res.ok) {
        return { hasLab: false, labId: null, role: null };
      }
      const data = await res.json();
      if (data?.success && data.data) {
        return data.data as LabAssociation;
      }
      return { hasLab: false, labId: null, role: null };
    },
    staleTime: 5 * 60 * 1000,
  });
}
