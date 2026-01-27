import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentWeekDates } from '@/hooks/useDeliveries';
import { toast } from 'sonner';

type DeliveryFinalStatus = 'completed' | 'not_delivered_collected' | 'not_delivered_no_collection';

interface RegisterDeliveryData {
  deliveryId: string;
  courierId: string;
  final_status: DeliveryFinalStatus;
  received_amount: number;
  payment_method: 'cash' | 'transfer_to_courier' | 'transfer_to_client';
  notes?: string;
  receipt_photo_url?: string;
}

export function useRegisterDelivery() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: RegisterDeliveryData) => {
      if (!user) throw new Error('No user logged in');

      // Get old values for audit
      const { data: oldDelivery, error: fetchError } = await supabase
        .from('deliveries')
        .select('*')
        .eq('id', data.deliveryId)
        .single();

      if (fetchError) throw fetchError;

      // Verify it's the courier's own pending delivery
      if (oldDelivery.courier_id !== user.id) {
        throw new Error('No tienes permiso para registrar esta entrega');
      }
      if (oldDelivery.status !== 'pending') {
        throw new Error('Esta entrega ya fue registrada');
      }

      // Use the total_to_collect from the original delivery (set by admin)
      const totalToCollect = oldDelivery.total_to_collect || 0;
      const serviceValue = oldDelivery.service_value || 0;

      // Determine if this status involves collection/service
      const hasCollection = data.final_status === 'completed' || data.final_status === 'not_delivered_collected';
      const isValidService = hasCollection; // Both completed and ida perdida count as valid service

      // Calculate difference for automatic advance (only for statuses with collection)
      const difference = hasCollection ? totalToCollect - data.received_amount : 0;

      // Update the delivery with the final status
      const { data: newDelivery, error: updateError } = await supabase
        .from('deliveries')
        .update({
          received_amount: hasCollection ? data.received_amount : 0,
          payment_method: data.payment_method,
          notes: data.notes || null,
          receipt_photo_url: data.receipt_photo_url || null,
          status: data.final_status as any,
          delivery_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', data.deliveryId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Handle client balance updates based on status and payment method
      let clientDebtAdded = 0;
      
      // For "not_delivered_collected" (ida perdida), add total_to_collect to client debt
      if (data.final_status === 'not_delivered_collected') {
        const { data: currentClient } = await supabase
          .from('clients')
          .select('balance')
          .eq('id', oldDelivery.client_id)
          .single();
        
        if (currentClient) {
          const newBalance = Number(currentClient.balance || 0) + totalToCollect;
          await supabase
            .from('clients')
            .update({ balance: newBalance })
            .eq('id', oldDelivery.client_id);
          clientDebtAdded = totalToCollect;
        }
      }
      
      // For "transfer_to_client" payment method, client owes the SERVICE VALUE (not total_to_collect)
      if (data.payment_method === 'transfer_to_client' && 
          (data.final_status === 'completed' || data.final_status === 'not_delivered_collected')) {
        const { data: currentClient } = await supabase
          .from('clients')
          .select('balance')
          .eq('id', oldDelivery.client_id)
          .single();
        
        if (currentClient) {
          const newBalance = Number(currentClient.balance || 0) + serviceValue;
          await supabase
            .from('clients')
            .update({ balance: newBalance })
            .eq('id', oldDelivery.client_id);
          clientDebtAdded += serviceValue;
        }
      }

      // Create audit log with status description
      const statusLabels: Record<DeliveryFinalStatus, string> = {
        completed: 'Entregado',
        not_delivered_collected: 'No entregado (con cobro) - Ida Perdida',
        not_delivered_no_collection: 'No entregado (sin cobro)',
      };
      
      const { error: auditError } = await supabase
        .from('delivery_audit_log')
        .insert([{
          delivery_id: data.deliveryId,
          action: 'registered',
          changed_by: user.id,
          old_values: JSON.parse(JSON.stringify(oldDelivery)),
          new_values: JSON.parse(JSON.stringify(newDelivery)),
          reason: `Entrega registrada por mensajero: ${statusLabels[data.final_status]}`,
        }]);

      if (auditError) {
        console.error('Error creating audit log:', auditError);
      }

      // If there's a difference and the status involves collection, create automatic salary advance
      if (hasCollection && difference > 0) {
        const { weekStart, weekEnd } = getCurrentWeekDates();
        const { error: advanceError } = await supabase
          .from('salary_advances')
          .insert({
            courier_id: data.courierId,
            amount: difference,
            reason: `Faltante automático - Entrega ${data.deliveryId.substring(0, 8)}`,
            created_by: user.id,
            week_start: weekStart,
            week_end: weekEnd,
          });

        if (advanceError) {
          console.error('Error creating automatic advance:', advanceError);
        }

        return { 
          delivery: newDelivery, 
          advance: difference, 
          status: data.final_status,
          clientDebtAdded,
        };
      }

      return { 
        delivery: newDelivery, 
        advance: 0, 
        status: data.final_status,
        clientDebtAdded,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['audit-log'] });
      queryClient.invalidateQueries({ queryKey: ['salary-advances'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-with-debt'] });
      
      const statusMessages: Record<DeliveryFinalStatus, string> = {
        completed: '¡Entrega registrada exitosamente!',
        not_delivered_collected: 'Ida perdida registrada (cobro agregado a deuda del cliente)',
        not_delivered_no_collection: 'Registro guardado (sin cobro ni pago)',
      };
      
      let message = statusMessages[result.status];
      
      if (result.clientDebtAdded > 0) {
        message += ` • Deuda cliente: +$${result.clientDebtAdded.toFixed(2)}`;
      }
      
      if (result.advance > 0) {
        message += ` • Adelanto: $${result.advance.toFixed(2)}`;
      }
      
      toast.success(message);
    },
    onError: (error) => {
      toast.error('Error al registrar: ' + error.message);
    },
  });
}
