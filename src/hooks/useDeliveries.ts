import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Delivery {
  id: string;
  courier_id: string;
  client_id: string;
  amount: number;
  service_value: number;
  total_to_collect: number;
  received_amount: number | null;
  recipient_name: string | null;
  payment_method: 'cash' | 'transfer_to_courier' | 'transfer_to_client';
  status: 'pending' | 'completed' | 'cancelled' | 'not_delivered_collected' | 'not_delivered_no_collection';
  receipt_photo_url: string | null;
  notes: string | null;
  delivery_date: string;
  week_start: string;
  week_end: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  client?: {
    id: string;
    name: string;
    phone: string | null;
  };
  courier?: {
    full_name: string;
  };
}

export interface CreateDeliveryData {
  client_id: string;
  recipient_name?: string;
  service_value: number;
  total_to_collect: number;
  payment_method: 'cash' | 'transfer_to_courier' | 'transfer_to_client';
  notes?: string;
  receipt_photo_url?: string;
}

export interface AuditLogEntry {
  id: string;
  delivery_id: string | null;
  action: string;
  changed_by: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  reason: string | null;
  created_at: string;
  admin_name?: string;
}

// Get the current week dates (Saturday to Friday)
export function getCurrentWeekDates() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  // Calculate days to last Saturday (if today is Saturday, use today)
  const daysToLastSaturday = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - daysToLastSaturday);
  weekStart.setHours(0, 0, 0, 0);
  
  // Friday is 6 days after Saturday
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  return {
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: weekEnd.toISOString().split('T')[0],
  };
}

export function useDeliveries(courierId?: string) {
  const { user, isAdmin } = useAuth();
  
  return useQuery({
    queryKey: ['deliveries', courierId || user?.id],
    queryFn: async () => {
      let query = supabase
        .from('deliveries')
        .select(`
          *,
          client:clients(id, name, phone)
        `)
        .order('created_at', { ascending: false });
      
      // If not admin, only fetch own deliveries
      if (!isAdmin && user) {
        query = query.eq('courier_id', user.id);
      } else if (courierId) {
        query = query.eq('courier_id', courierId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;

      // Fetch courier names separately
      const courierIds = [...new Set((data || []).map(d => d.courier_id))];
      let courierMap = new Map<string, string>();
      if (courierIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', courierIds);
        courierMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      }

      return (data || []).map(d => ({
        ...d,
        courier: { full_name: courierMap.get(d.courier_id) || 'Sin nombre' },
      })) as Delivery[];
    },
    enabled: !!user,
  });
}

export function useCreateDelivery() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: CreateDeliveryData) => {
      if (!user) throw new Error('No user logged in');
      
      const { weekStart, weekEnd } = getCurrentWeekDates();
      
      const { data: delivery, error } = await supabase
        .from('deliveries')
        .insert({
          client_id: data.client_id,
          courier_id: user.id,
          created_by: user.id,
          recipient_name: data.recipient_name || null,
          service_value: data.service_value,
          total_to_collect: data.total_to_collect,
          amount: data.total_to_collect, // Keep for backward compatibility
          payment_method: data.payment_method,
          notes: data.notes || null,
          receipt_photo_url: data.receipt_photo_url || null,
          week_start: weekStart,
          week_end: weekEnd,
          delivery_date: new Date().toISOString().split('T')[0],
          status: 'completed', // Couriers create completed deliveries
        })
        .select()
        .single();
      
      if (error) throw error;
      return delivery;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast.success('Entrega registrada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al registrar entrega: ' + error.message);
    },
  });
}

export function useUpdateDelivery() {
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      updates, 
      reason,
      autoAdvance,
    }: { 
      id: string; 
      updates: Partial<Delivery>; 
      reason: string;
      autoAdvance?: { amount: number; courierId: string };
    }) => {
      if (!user) throw new Error('No user logged in');
      
      // First get the old values for audit
      const { data: oldDelivery, error: fetchError } = await supabase
        .from('deliveries')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // If courier is updating, restrict which fields can be changed
      let allowedUpdates = updates;
      if (!isAdmin) {
        // Couriers can only update: total_to_collect, received_amount, notes, receipt_photo_url, payment_method
        allowedUpdates = {
          total_to_collect: updates.total_to_collect,
          received_amount: updates.received_amount,
          notes: updates.notes,
          receipt_photo_url: updates.receipt_photo_url,
          payment_method: updates.payment_method,
          amount: updates.total_to_collect, // Keep amount in sync
        };
        // Remove undefined values
        Object.keys(allowedUpdates).forEach(key => {
          if (allowedUpdates[key as keyof typeof allowedUpdates] === undefined) {
            delete allowedUpdates[key as keyof typeof allowedUpdates];
          }
        });
      } else {
        // Admin can update service_value too, keep amount in sync with total_to_collect
        if (updates.total_to_collect !== undefined) {
          allowedUpdates.amount = updates.total_to_collect;
        }
      }
      
      // Update the delivery
      const { data: newDelivery, error: updateError } = await supabase
        .from('deliveries')
        .update(allowedUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      // Create audit log
      const { error: auditError } = await supabase
        .from('delivery_audit_log')
        .insert([{
          delivery_id: id,
          action: 'updated',
          changed_by: user.id,
          old_values: JSON.parse(JSON.stringify(oldDelivery)),
          new_values: JSON.parse(JSON.stringify(newDelivery)),
          reason,
        }]);
      
      if (auditError) throw auditError;
      
      // If there's an automatic salary advance to register
      if (autoAdvance && autoAdvance.amount > 0) {
        const { weekStart, weekEnd } = getCurrentWeekDates();
        const { error: advanceError } = await supabase
          .from('salary_advances')
          .insert({
            courier_id: autoAdvance.courierId,
            amount: autoAdvance.amount,
            reason: `Faltante automático - Entrega ${id.substring(0, 8)}`,
            created_by: user.id,
            week_start: weekStart,
            week_end: weekEnd,
          });
        
        if (advanceError) {
          console.error('Error creating automatic advance:', advanceError);
        }
      }
      
      return newDelivery;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['audit-log'] });
      queryClient.invalidateQueries({ queryKey: ['salary-advances'] });
      if (variables.autoAdvance && variables.autoAdvance.amount > 0) {
        toast.success(`Entrega actualizada. Se registró adelanto de $${variables.autoAdvance.amount.toFixed(2)}`);
      } else {
        toast.success('Entrega actualizada exitosamente');
      }
    },
    onError: (error) => {
      toast.error('Error al actualizar: ' + error.message);
    },
  });
}

export function useCancelDelivery() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      if (!user) throw new Error('No user logged in');
      
      // Get old values
      const { data: oldDelivery, error: fetchError } = await supabase
        .from('deliveries')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Cancel the delivery
      const { data: newDelivery, error: updateError } = await supabase
        .from('deliveries')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      // Create audit log
      const { error: auditError } = await supabase
        .from('delivery_audit_log')
        .insert([{
          delivery_id: id,
          action: 'cancelled',
          changed_by: user.id,
          old_values: JSON.parse(JSON.stringify(oldDelivery)),
          new_values: JSON.parse(JSON.stringify(newDelivery)),
          reason,
        }]);
      
      if (auditError) throw auditError;
      
      return newDelivery;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['audit-log'] });
      toast.success('Entrega anulada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al anular: ' + error.message);
    },
  });
}

export function useAuditLog(deliveryId?: string) {
  const { isAdmin } = useAuth();
  
  return useQuery({
    queryKey: ['audit-log', deliveryId],
    queryFn: async () => {
      let query = supabase
        .from('delivery_audit_log')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (deliveryId) {
        query = query.eq('delivery_id', deliveryId);
      }
      
      const { data: logs, error } = await query;
      
      if (error) throw error;
      
      // Fetch admin names separately
      const adminIds = [...new Set(logs.map(l => l.changed_by))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', adminIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      
      return logs.map(log => ({
        ...log,
        old_values: log.old_values as Record<string, unknown> | null,
        new_values: log.new_values as Record<string, unknown> | null,
        admin_name: profileMap.get(log.changed_by) || 'Admin',
      })) as AuditLogEntry[];
    },
    enabled: isAdmin,
  });
}
