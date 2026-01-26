import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Delivery } from './useDeliveries';

interface RegisterDeliveryData {
  amount: number;
  payment_method: 'cash' | 'transfer_to_courier' | 'transfer_to_client';
  notes?: string;
  receipt_photo_url?: string;
}

export function useRegisterDelivery() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      deliveryId, 
      data 
    }: { 
      deliveryId: string; 
      data: RegisterDeliveryData;
    }) => {
      if (!user) throw new Error('No user logged in');
      
      // First get the old values for audit
      const { data: oldDelivery, error: fetchError } = await supabase
        .from('deliveries')
        .select('*')
        .eq('id', deliveryId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Verify it's the courier's own pending delivery
      if (oldDelivery.courier_id !== user.id) {
        throw new Error('No tienes permiso para registrar esta entrega');
      }
      if (oldDelivery.status !== 'pending') {
        throw new Error('Esta entrega ya fue registrada');
      }
      
      // Update the delivery with registration data
      const updates: Partial<Delivery> = {
        amount: data.amount,
        payment_method: data.payment_method,
        status: 'completed',
        delivery_date: new Date().toISOString().split('T')[0],
        ...(data.notes && { notes: data.notes }),
        ...(data.receipt_photo_url && { receipt_photo_url: data.receipt_photo_url }),
      };
      
      const { data: newDelivery, error: updateError } = await supabase
        .from('deliveries')
        .update(updates)
        .eq('id', deliveryId)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      // Create audit log
      const { error: auditError } = await supabase
        .from('delivery_audit_log')
        .insert([{
          delivery_id: deliveryId,
          action: 'registered',
          changed_by: user.id,
          old_values: JSON.parse(JSON.stringify(oldDelivery)),
          new_values: JSON.parse(JSON.stringify(newDelivery)),
          reason: 'Entrega registrada por mensajero',
        }]);
      
      if (auditError) {
        console.error('Audit log error:', auditError);
        // Don't throw - the delivery was updated successfully
      }
      
      return newDelivery;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['audit-log'] });
      toast.success('¡Entrega registrada exitosamente!');
    },
    onError: (error) => {
      toast.error('Error al registrar entrega: ' + error.message);
    },
  });
}
