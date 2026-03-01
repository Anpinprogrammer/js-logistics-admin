import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextTest';
import { toast } from 'sonner';

export interface Pickup {
  id: string;
  client_id: string;
  courier_id: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  address: string | null;
  notes: string | null;
  status: 'pending_pickup' | 'picked_up';
  pickup_date: string;
  picked_up_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  client?: {
    id: string;
    name: string;
    phone: string | null;
    company: string | null;
  };
  courier?: {
    full_name: string;
  };
}

export function usePickups() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pickups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pickups')
        .select(`
          *,
          client:clients(id, name, phone, company)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch courier names separately
      const courierIds = [...new Set((data || []).filter(p => p.courier_id).map(p => p.courier_id as string))];
      let courierMap = new Map<string, string>();
      if (courierIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', courierIds);
        courierMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      }

      return (data || []).map(p => ({
        ...p,
        courier: p.courier_id ? { full_name: courierMap.get(p.courier_id) || 'Sin nombre' } : undefined,
      })) as Pickup[];
    },
    enabled: !!user,
  });
}

export function useCreatePickup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      client_id: string;
      courier_id?: string;
      contact_name?: string;
      contact_phone?: string;
      address?: string;
      notes?: string;
      pickup_date: string;
    }) => {
      if (!user) throw new Error('No user logged in');

      const { data: pickup, error } = await supabase
        .from('pickups')
        .insert({
          client_id: data.client_id,
          courier_id: data.courier_id || null,
          contact_name: data.contact_name || null,
          contact_phone: data.contact_phone || null,
          address: data.address || null,
          notes: data.notes || null,
          pickup_date: data.pickup_date,
          status: 'pending_pickup',
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return pickup;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickups'] });
      toast.success('Recogida registrada exitosamente');
    },
    onError: (error: Error) => {
      toast.error('Error al registrar recogida: ' + error.message);
    },
  });
}

export function useMarkPickedUp() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      if (!user) throw new Error('No user logged in');

      const updates: Record<string, unknown> = {
        status: 'picked_up',
        picked_up_at: new Date().toISOString(),
      };
      if (notes !== undefined && notes.trim()) {
        updates.notes = notes;
      }

      const { data, error } = await supabase
        .from('pickups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickups'] });
      toast.success('Paquete marcado como recogido');
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar: ' + error.message);
    },
  });
}

export function useUpdatePickup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Omit<Pickup, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'client' | 'courier'>> }) => {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('pickups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickups'] });
      toast.success('Recogida actualizada exitosamente');
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar: ' + error.message);
    },
  });
}

export function useDeletePickup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('pickups')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickups'] });
      toast.success('Recogida eliminada exitosamente');
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar: ' + error.message);
    },
  });
}
