import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContextTest';
import { toast } from 'sonner';

// ========================================
// TIPOS
// ========================================
export interface Client {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  balance: number;
  company: string | null;
  identification_number: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientResponse {
    data: Client[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    error: any;
}

export interface AllClientsResponse {
  allClients: ClientResponse
}

// ========================================
// QUERIES (GET)
// ========================================

/**
 * Obtener todos los clientes
 * GET /api/clients
 */
export function useClients(page: number = 1, limit: number = 9, search: string = '') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['clients', page, limit, search],
    queryFn: async () => {
      const response = await api.get<ClientResponse>('/clients', { params: { page, limit, ...(search ? { search } : {}) } });
      return response.data;
    },
    enabled: !!user,
  });
}

//Clients in favor
export function useClientsInFavor(page: number = 1, limit: number = 9, search: string = '') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['clientsInFavor', page, limit, search],
    queryFn: async () => {
      const response = await api.get<ClientResponse>('/clients/in-favor', { params: { page, limit, ...(search ? { search } : {}) } });
      return response.data;
    },
    enabled: !!user,
    staleTime: 0,
  });
}

//Clients with debt
export function useClientsWithdebt(page: number = 1, limit: number = 9, search: string = '') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['clientsWithDebt', page, limit, search],
    queryFn: async () => {
      const response = await api.get<ClientResponse>('/clients/with-debt', { params: { page, limit, ...(search ? { search } : {}) } });
      return response.data;
    },
    enabled: !!user,
    staleTime: 0,
  });
}

/*
* Obtener los clientes y sus daily summaries 
*/
export function useClientDailySummary(page = 1, limit = 10, date?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['daily-summary', page, date],
    queryFn: async () => {
      const response = await api.get('/clients/summary/daily', {
        params: { page, limit, date }
      })
      console.log(response)
      return response.data
    }
  })

}

/**
 * Obtener clientes con deuda (balance > 0)
 * GET /api/clients/with-debt
 */
export function useClientsWithDebt() {
  const { user, isAdmin } = useAuth();
  
  return useQuery({
    queryKey: ['clients-with-debt'],
    queryFn: async () => {
      const { data } = await api.get<ClientResponse>('/clients/with-debt');
      console.log(data)
      return data.data ;
    },
    enabled: !!user && isAdmin, // Solo ejecuta si es admin
  });
}

/**
 * Obtener un cliente específico por ID
 * GET /api/clients/:id
 */
export function useClient(id: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['clients', id],
    queryFn: async () => {
      const { data } = await api.get<Client>(`/clients/${id}`);
      return data;
    },
    enabled: !!user && !!id,
  });
}

// ========================================
// MUTATIONS (CREATE, UPDATE, DELETE)
// ========================================

/**
 * Crear un nuevo cliente
 * POST /api/clients
 */
export function useCreateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'balance'>) => {
      const { data } = await api.post('/clients', clientData);
      return data.data;
    },
    onSuccess: () => {
      // Invalidar queries para refrescar los datos
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente creado exitosamente');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Error al crear cliente';
      toast.error(errorMessage);
      console.error('Error al crear cliente:', error);
    },
  });
}

/**
 * Actualizar un cliente existente
 * PUT /api/clients/:id  o  PATCH /api/clients/:id
 */
export function useUpdateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Client> }) => {
      // Usa PUT si tu backend espera el objeto completo
      // o PATCH si acepta actualizaciones parciales
      const { data } = await api.put<Client>(`/clients/${id}`, updates);
      return data;
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-with-debt'] });
      queryClient.invalidateQueries({ queryKey: ['clients', data.id] });
      toast.success('Cliente actualizado exitosamente');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Error al actualizar cliente';
      toast.error(errorMessage);
      console.error('Error al actualizar cliente:', error);
    },
  });
}

/**
 * Eliminar un cliente
 * DELETE /api/clients/:id
 */
export function useDeleteClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-with-debt'] });
      toast.success('Cliente eliminado exitosamente');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Error al eliminar cliente';
      toast.error(errorMessage);
      console.error('Error al eliminar cliente:', error);
    },
  });
}

/**
 * Actualizar el balance de un cliente
 * PATCH /api/clients/:id/balance
 */
export function useUpdateClientBalance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, balance }: { id: string; balance: number }) => {
      const { data } = await api.patch<Client>(`/clients/${id}/balance`, { balance });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-with-debt'] });
      toast.success('Balance actualizado');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Error al actualizar balance';
      toast.error(errorMessage);
      console.error('Error al actualizar balance:', error);
    },
  });
}