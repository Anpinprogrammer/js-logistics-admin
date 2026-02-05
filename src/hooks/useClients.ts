import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Client {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  balance: number;
  company: string | null;
  identification_number: string | null;
  created_at: string;
  updated_at: string;
}

export function useClients() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Client[];
    },
    enabled: !!user,
  });
}

export function useClientsWithDebt() {
  const { user, isAdmin } = useAuth();
  
  return useQuery({
    queryKey: ['clients-with-debt'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .gt('balance', 0)
        .order('balance', { ascending: false });
      
      if (error) throw error;
      return data as Client[];
    },
    enabled: !!user && isAdmin,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'balance'>) => {
      const { data: client, error } = await supabase
        .from('clients')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente creado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al crear cliente: ' + error.message);
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Client> }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-with-debt'] });
      toast.success('Cliente actualizado');
    },
    onError: (error) => {
      toast.error('Error al actualizar: ' + error.message);
    },
  });
}
