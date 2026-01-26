import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentWeekDates } from '@/hooks/useDeliveries';
import { toast } from 'sonner';

interface RegisterDeliveryData {
  deliveryId: string;
  courierId: string;
  total_to_collect: number;
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

      // Calculate difference for automatic advance
      const difference = data.total_to_collect - data.received_amount;

      // Update the delivery
      const { data: newDelivery, error: updateError } = await supabase
        .from('deliveries')
        .update({
          total_to_collect: data.total_to_collect,
          received_amount: data.received_amount,
          amount: data.total_to_collect, // Keep backward compatibility
          payment_method: data.payment_method,
          notes: data.notes || null,
          receipt_photo_url: data.receipt_photo_url || null,
          status: 'completed',
          delivery_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', data.deliveryId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Create audit log
      const { error: auditError } = await supabase
        .from('delivery_audit_log')
        .insert([{
          delivery_id: data.deliveryId,
          action: 'registered',
          changed_by: user.id,
          old_values: JSON.parse(JSON.stringify(oldDelivery)),
          new_values: JSON.parse(JSON.stringify(newDelivery)),
          reason: 'Entrega registrada por mensajero',
        }]);

      if (auditError) {
        console.error('Error creating audit log:', auditError);
      }

      // If there's a difference, create automatic salary advance
      if (difference > 0) {
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

        return { delivery: newDelivery, advance: difference };
      }

      return { delivery: newDelivery, advance: 0 };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['audit-log'] });
      queryClient.invalidateQueries({ queryKey: ['salary-advances'] });
      
      if (result.advance > 0) {
        toast.success(`Entrega registrada. Se registró adelanto de $${result.advance.toFixed(2)}`);
      } else {
        toast.success('¡Entrega registrada exitosamente!');
      }
    },
    onError: (error) => {
      toast.error('Error al registrar: ' + error.message);
    },
  });
}
