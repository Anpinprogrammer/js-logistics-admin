import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentWeekDates } from '@/hooks/useDeliveries';
import { toast } from 'sonner';

type DeliveryFinalStatus = 'completed' | 'not_delivered_collected' | 'not_delivered_no_collection';

interface AdminCompleteDeliveryData {
  deliveryId: string;
  courierId: string;
  final_status: DeliveryFinalStatus;
  received_amount: number;
  payment_method: 'cash' | 'transfer_to_courier' | 'transfer_to_client';
  notes?: string;
  receipt_photo_url?: string;
}

export function useAdminCompleteDelivery() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: AdminCompleteDeliveryData) => {
      if (!user) throw new Error('No user logged in');

      const { data: oldDelivery, error: fetchError } = await supabase
        .from('deliveries')
        .select('*')
        .eq('id', data.deliveryId)
        .single();

      if (fetchError) throw fetchError;

      if (oldDelivery.status !== 'pending') {
        throw new Error('Esta entrega ya fue registrada');
      }

      const totalToCollect = oldDelivery.total_to_collect || 0;
      const serviceValue = oldDelivery.service_value || 0;
      const hasCollection = data.final_status === 'completed' || data.final_status === 'not_delivered_collected';
      const isCompleted = data.final_status === 'completed';
      const difference = isCompleted ? totalToCollect - data.received_amount : 0;

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

      // Handle client balance updates
      let clientDebtAdded = 0;

      if (data.final_status === 'not_delivered_collected') {
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
          clientDebtAdded = serviceValue;
        }
      }

      if (
        data.payment_method === 'transfer_to_client' &&
        (data.final_status === 'completed' || data.final_status === 'not_delivered_collected')
      ) {
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

      const statusLabels: Record<DeliveryFinalStatus, string> = {
        completed: 'Entregado',
        not_delivered_collected: 'No entregado (con cobro) - Ida Perdida',
        not_delivered_no_collection: 'No entregado (sin cobro)',
      };

      await supabase.from('delivery_audit_log').insert([{
        delivery_id: data.deliveryId,
        action: 'registered',
        changed_by: user.id,
        old_values: JSON.parse(JSON.stringify(oldDelivery)),
        new_values: JSON.parse(JSON.stringify(newDelivery)),
        reason: `Entrega registrada por administrador: ${statusLabels[data.final_status]}`,
      }]);

      if (isCompleted && difference > 0) {
        const { weekStart, weekEnd } = getCurrentWeekDates();
        await supabase.from('salary_advances').insert({
          courier_id: data.courierId,
          amount: difference,
          reason: `Faltante automático - Entrega ${data.deliveryId.substring(0, 8)}`,
          created_by: user.id,
          week_start: weekStart,
          week_end: weekEnd,
        });

        return { delivery: newDelivery, advance: difference, status: data.final_status, clientDebtAdded };
      }

      return { delivery: newDelivery, advance: 0, status: data.final_status, clientDebtAdded };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['audit-log'] });
      queryClient.invalidateQueries({ queryKey: ['salary-advances'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-with-debt'] });

      const statusMessages: Record<string, string> = {
        completed: '¡Entrega registrada exitosamente!',
        not_delivered_collected: 'Ida perdida registrada (cobro agregado a deuda del cliente)',
        not_delivered_no_collection: 'Registro guardado (sin cobro ni pago)',
      };

      let message = statusMessages[result.status] || 'Registro guardado';

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
