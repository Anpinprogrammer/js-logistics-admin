import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContextTest';
import api from '@/services/api';
import { toast } from 'sonner';

type DeliveryFinalStatus = 'completed' | 'not_delivered_collected' | 'not_delivered_no_collection';

interface AdminCorrectDeliveryData {
  deliveryId: string;
  courierId: string;
  final_status: DeliveryFinalStatus;
  received_amount: number;
  payment_method: 'cash' | 'transfer_to_courier' | 'transfer_to_client';
  notes?: string;
  receipt_photo_url?: string;
}

/**
 * Corrects an already-completed (or terminal-status) delivery.
 *
 * Financial reversal logic:
 *   old_effect = old_received_amount - service_value - loan
 *   new_effect = new_received_amount - service_value - loan
 *   new_balance = current_balance - old_effect + new_effect
 *
 * The backend PUT already calls actualizarDailySummary when the delivery
 * was/is completed, so daily_summaries stay in sync automatically.
 *
 * Company money movements are NOT created here — the original movement
 * already exists. Any cash/account discrepancies must be handled manually.
 */
export function useAdminCorrectDelivery() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: AdminCorrectDeliveryData) => {
      if (!user) throw new Error('No user logged in');

      // 1. Fetch the delivery as-is (no status guard — corrections work on any terminal state)
      const { data: oldDeliveryResponse } = await api.get(`/deliveries/${data.deliveryId}`);
      const oldDelivery = oldDeliveryResponse.data;

      const serviceValue = Number(oldDelivery.service_value || 0);
      const loan = Number(oldDelivery.loan || 0);

      // 2. Reverse old client-balance effect
      const oldHadCollection =
        oldDelivery.status === 'completed' || oldDelivery.status === 'not_delivered_collected';
      const oldReceivedAmount = oldHadCollection ? Number(oldDelivery.received_amount || 0) : 0;
      const oldEffect = oldReceivedAmount - serviceValue - loan;

      // 3. Calculate new client-balance effect
      const newHasCollection =
        data.final_status === 'completed' || data.final_status === 'not_delivered_collected';
      const newReceivedAmount = newHasCollection ? data.received_amount : 0;
      const newEffect = newReceivedAmount - serviceValue - loan;

      // 4. Fetch current client balance and apply net delta
      const { data: clientResponse } = await api.get(`/clients/${oldDelivery.client_id}`);
      const currentClient = clientResponse.data;
      const newClientBalance = Number(currentClient.balance || 0) - oldEffect + newEffect;
      await api.put(`/clients/${oldDelivery.client_id}`, { balance: newClientBalance });

      // 5. Update the delivery — backend will re-run actualizarDailySummary
      const payload = {
        status: data.final_status,
        received_amount: newHasCollection ? data.received_amount : 0,
        payment_method: data.payment_method,
        notes: data.notes ?? null,
        receipt_photo_url: data.receipt_photo_url ?? null,
        reason: `Corrección por administrador (${user.id.substring(0, 8)})`,
      };
      const { data: updatedResponse } = await api.put(`/deliveries/${data.deliveryId}`, payload);

      return updatedResponse.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['audit-log'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-with-debt'] });
      queryClient.invalidateQueries({ queryKey: ['daily-settlements'] });
      toast.success('Entrega corregida exitosamente');
    },
    onError: (error: Error) => {
      toast.error('Error al corregir entrega: ' + error.message);
    },
  });
}
