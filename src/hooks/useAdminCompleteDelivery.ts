import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import api from '@/services/api';
//import { useAuth } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContextTest';
import { getCurrentWeekDates } from '@/hooks/useDeliveries';
import { getTodayDate } from '@/utils';
import { toast } from 'sonner';

type DeliveryFinalStatus = 'completed' | 'not_delivered_collected' | 'not_delivered_no_collection';

interface AdminCompleteDeliveryData {
  deliveryId: string;
  courierId: string;
  final_status: DeliveryFinalStatus;
  received_amount: number;
  payment_method: 'cash' | 'transfer_to_courier' | 'transfer_to_client';
  subAccount: string;
  notes?: string;
  receipt_photo_url?: string;
}

export function useAdminCompleteDelivery() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: AdminCompleteDeliveryData) => {
      if (!user) throw new Error('No user logged in');

      const { data: oldDeliveryResponse } = await api.get(`/deliveries/${data.deliveryId}`)
      const oldDelivery = oldDeliveryResponse.data

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

      

      if (data.final_status === 'not_delivered_collected') {
        const { data: currentClientResponse } = await api.get(`/clients/${oldDelivery.client_id}`) 
        const currentClient = currentClientResponse.data

        if (currentClient) {
          const newBalance = Number(currentClient.balance || 0) + serviceValue;
          await api.put(`/clients/${oldDelivery.client_id}`, { balance: newBalance })
          clientDebtAdded = serviceValue;
        }
      }

      if (
        data.payment_method === 'transfer_to_client' &&
        (data.final_status === 'completed' || data.final_status === 'not_delivered_collected')
      ) {
        const { data: currentClientResponse } = await api.get(`/clients/${oldDelivery.client_id}`)
        const currentClient = currentClientResponse.data


        if (currentClient) {
          console.log('Balance previo: ', currentClient.balance)
          const newBalance = Number(currentClient.balance || 0) + serviceValue;
          console.log('Balance nuevo: ', newBalance)
          await api.put(`/clients/${oldDelivery.client_id}`, { balance: newBalance })
          clientDebtAdded += serviceValue;
        }
      }

      const statusLabels: Record<DeliveryFinalStatus, string> = {
        completed: 'Entregado',
        not_delivered_collected: 'No entregado (con cobro) - Ida Perdida',
        not_delivered_no_collection: 'No entregado (sin cobro)',
      };

      /** Audit Log (Se espera trabajar en esta feature en futuras presentaciones)
       * await supabase.from('delivery_audit_log').insert([{
        delivery_id: data.deliveryId,
        action: 'registered',
        changed_by: user.id,
        old_values: JSON.parse(JSON.stringify(oldDelivery)),
        new_values: JSON.parse(JSON.stringify(newDelivery)),
        reason: `Entrega registrada por administrador: ${statusLabels[data.final_status]}`,
      }]);
       */
      

      if (isCompleted && difference > 0) {
        const { weekStart, weekEnd } = getCurrentWeekDates();
        await api.post('/salary-advances', {
          courier_id: data.courierId,
          amount: difference,
          reason: `Faltante automático - Entrega ${data.deliveryId.substring(0, 8)}`,
          created_by: user.id,
          week_start: weekStart,
          week_end: weekEnd,
        })

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

      if (result.clientDebtAdded < 0) {
        message += ` • Deuda cliente: +$${Math.abs(Number(result.clientDebtAdded)).toFixed(2)}`;
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
