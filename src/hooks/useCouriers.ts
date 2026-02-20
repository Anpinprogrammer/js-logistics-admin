import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import api from '@/services/api';
//import { useAuth } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContextTest';

export interface Courier {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
}

export function useCouriers() {
  const { isAdmin } = useAuth();
  
  return useQuery({
    queryKey: ['couriers'],
    queryFn: async () => {
      // First get all courier roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'courier');
      
      if (rolesError) throw rolesError;
      
      if (!roles || roles.length === 0) return [];
      
      // Then get profiles for those users
      const userIds = roles.map(r => r.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, phone')
        .in('user_id', userIds);
      
      if (profilesError) throw profilesError;
      
      return (profiles || []).map(profile => ({
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name || 'Sin nombre',
        phone: profile.phone,
      })) as Courier[];
    },
    enabled: isAdmin,
  });
}

export function useCouriersTest() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['couriers', user?.id], // 👈 ESTO es la clave
    queryFn: async (): Promise<Courier[]> => {
      const { data } = await api.get<{ data: Courier[] }>('/couriers', {
        params: { role: 'courier' },
      });

      return data.data;
    },
    enabled: !!user,
  });
}

export function useCourierStats(courierId: string, weekStart: string, weekEnd: string) {
  return useQuery({
    queryKey: ['courier-stats', courierId, weekStart, weekEnd],
    queryFn: async () => {
      const { data: deliveries, error } = await supabase
        .from('deliveries')
        .select('*')
        .eq('courier_id', courierId)
        .eq('status', 'completed')
        .gte('week_start', weekStart)
        .lte('week_end', weekEnd);
      
      if (error) throw error;
      
      const stats = {
        totalDeliveries: deliveries.length,
        totalCash: 0,
        totalTransfersCourier: 0,
        totalTransfersClient: 0,
      };
      
      deliveries.forEach(d => {
        const amount = Number(d.amount);
        switch (d.payment_method) {
          case 'cash':
            stats.totalCash += amount;
            break;
          case 'transfer_to_courier':
            stats.totalTransfersCourier += amount;
            break;
          case 'transfer_to_client':
            stats.totalTransfersClient += amount;
            break;
        }
      });
      
      return stats;
    },
    enabled: !!courierId && !!weekStart && !!weekEnd,
  });
}
