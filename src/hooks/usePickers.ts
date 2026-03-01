import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContextTest';

export interface Picker {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
}

export function usePickers() {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ['pickers'],
    queryFn: async (): Promise<Picker[]> => {
      const { data } = await api.get<{ data: Picker[] }>('/pickers');
      return data.data;
    },
    enabled: !!user && isAdmin,
  });
}
