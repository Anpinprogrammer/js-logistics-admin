import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContextTest';
import { toast } from 'sonner';

export interface Admin {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  created_at: string;
}

export function useAdmins() {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ['admins'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Admin[] }>('/admins');
      return data.data;
    },
    enabled: !!user && isAdmin,
  });
}

export function useCreateAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      email: string;
      password: string;
      full_name: string;
      phone?: string;
    }) => {
      const { data } = await api.post<{ data: Admin }>('/admins', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      toast.success('Administrador creado exitosamente');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Error al crear administrador';
      toast.error(message);
    },
  });
}

export function useUpdateAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      full_name,
      phone,
      password,
    }: {
      id: string;
      full_name: string;
      phone?: string;
      password?: string;
    }) => {
      const { data } = await api.put<{ data: Admin }>(`/admins/${id}`, {
        full_name,
        phone: phone || null,
        password: password || undefined,
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      toast.success('Administrador actualizado exitosamente');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Error al actualizar administrador';
      toast.error(message);
    },
  });
}

export function useDeleteAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admins/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      toast.success('Administrador eliminado exitosamente');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Error al eliminar administrador';
      toast.error(message);
    },
  });
}
