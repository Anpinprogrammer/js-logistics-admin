import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import api from '@/services/api';
//import { useAuth } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContextTest';
import { getCurrentWeekDates } from '@/hooks/useDeliveries';
import { getTodayDate } from '@/utils';
import { toast } from 'sonner';

type DeliveryFinalStatus = 'completed' | 'not_delivered_collected' | 'not_delivered_no_collection';

interface RegisterDeliveryData {
  deliveryId: string;
  courierId: string;
  final_status: DeliveryFinalStatus;
  received_amount: number;
  payment_method: 'cash' | 'transfer_to_courier' | 'transfer_to_client';
  subAccount: string;
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
      const { data: oldDeliveryResponse } = await api.get(`/deliveries/${data.deliveryId}`)
      const oldDelivery = oldDeliveryResponse.data
      
      if (oldDelivery.status !== 'pending') {
        throw new Error('Esta entrega ya fue registrada');
      }
      
      // Verify it's the courier's own pending delivery
      if (oldDelivery.courier_id !== user.id) {
        throw new Error('No tienes permiso para registrar esta entrega');
      }
      if (oldDelivery.status !== 'pending') {
        throw new Error('Esta entrega ya fue registrada');
      }

      const totalToCollect = Number(oldDelivery.total_to_collect) || 0;
            const serviceValue = Number(oldDelivery.service_value) || 0;
            const hasCollection = data.final_status === 'completed' || data.final_status === 'not_delivered_collected';
            const isCompleted = data.final_status === 'completed';
            const difference = isCompleted ? totalToCollect - data.received_amount : 0;
      
            const payload = {
              received_amount: hasCollection ? data.received_amount : 0,
              payment_method: data.payment_method,
              notes: data.notes || null,
              receipt_photo_url: data.receipt_photo_url || null,
              status: data.final_status,
              lost_trips: data.final_status === 'not_delivered_collected' ? Number(oldDelivery.lost_trips || 0 ) + 1 : oldDelivery.lost_trips,
              delivery_date: getTodayDate(),
            }
      
            const { data: newDeliveryResponse } = await api.put(`/deliveries/${data.deliveryId}`, payload)
      
            const newDelivery = newDeliveryResponse.data
      
            // Administrar ingresos a las cuentas de JS
            if(data.payment_method === 'transfer_to_courier') {
              try {
                if(data.subAccount){
                  const { data: companyMovementResponse } = await api.post('/daily-settlements/company/money-assignment', {
                    account: data.subAccount,
                    type: 'income',
                    amount: data.received_amount,
                    notes: `Transferencia recibida del pedido ${newDelivery.id.substring(0, 8).toUpperCase()}`
                  })
                }
              } catch (error) {
                toast.error('Error: ' + error.message);
              }
            }
      
            // Handle client balance updates
            let clientDebtAdded = 0;
      
            const { data: currentClientResponse } = await api.get(`/clients/${oldDelivery.client_id}`)
            const currentClient = currentClientResponse.data
      
            if(data.final_status === 'completed' || data.final_status === 'not_delivered_collected') {
              if(currentClient){
                const newBalance = data.received_amount - newDelivery.service_value - newDelivery.loan + Number(currentClient.balance || 0) 
                if(newBalance < 0){
                  clientDebtAdded = Number(newBalance)
                }
                await api.put(`/clients/${oldDelivery.client_id}`, { balance: newBalance })
              }
            }
      
            /**
             * 
             
      
            if(data.final_status === 'not_delivered_collected'){
      
              if(currentClient){
                const newBalance = data.received_amount - newDelivery.service_value + Number(currentClient.balance || 0)
                if(newBalance < 0){
                  clientDebtAdded = Number(newBalance)
                }
                await api.put(`/clients/${oldDelivery.client_id}`, { balance: newBalance })
              }
            }
              */
      
            return { delivery: newDelivery, advance: 0, status: data.final_status, clientDebtAdded };

            /**
             * 
             

      // Use the total_to_collect from the original delivery (set by admin)
      const totalToCollect = oldDelivery.total_to_collect || 0;
      const serviceValue = oldDelivery.service_value || 0;

      // Only "completed" involves actual collection by the courier
      const hasCollection = data.final_status === 'completed';

      // For IDA PERDIDA: NO advance is created - the CLIENT is charged instead
      // Only create advance for COMPLETED deliveries where received < total
      const isCompleted = data.final_status === 'completed';
      const difference = isCompleted ? totalToCollect - data.received_amount : 0;

      // Update the delivery with the final status
      const { data: newDelivery, error: updateError } = await supabase
        .from('deliveries')
        .update({
          received_amount: hasCollection ? data.received_amount : 0,
          payment_method: data.payment_method,
          notes: data.notes || null,
          receipt_photo_url: data.receipt_photo_url || null,
          status: data.final_status as any,
          delivery_date: getTodayDate(),
        })
        .eq('id', data.deliveryId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Handle client balance updates based on status and payment method
      let clientDebtAdded = 0;
      
      // For "not_delivered_collected" (ida perdida): charge the SERVICE VALUE to client
      // This is what the client owes because the trip was made but delivery failed
      if (data.final_status === 'not_delivered_collected') {
        const { data: currentClient } = await supabase
          .from('clients')
          .select('balance')
          .eq('id', oldDelivery.client_id)
          .single();
        
        if (currentClient) {
          // Client owes the SERVICE VALUE (not total_to_collect)
          const newBalance = Number(currentClient.balance || 0) + serviceValue;
          await supabase
            .from('clients')
            .update({ balance: newBalance })
            .eq('id', oldDelivery.client_id);
          clientDebtAdded = serviceValue;
        }
      }
      
      // For "transfer_to_client" payment method on completed deliveries, client owes the SERVICE VALUE
      if (data.payment_method === 'transfer_to_client' && data.final_status === 'completed') {
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

      // Only create automatic salary advance for COMPLETED deliveries with shortfall
      // IDA PERDIDA does NOT create advances - the client is charged instead
      if (isCompleted && difference > 0) {
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
      */
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
