import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClients } from '@/hooks/useClients';
import { useCouriers } from '@/hooks/useCouriers';
import { getCurrentWeekDates } from '@/hooks/useDeliveries';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Package, UserCheck, Users } from 'lucide-react';
import { toast } from 'sonner';

interface AdminNewDeliveryFormProps {
  onSuccess?: () => void;
}

export function AdminNewDeliveryForm({ onSuccess }: AdminNewDeliveryFormProps) {
  const { data: clients, isLoading: loadingClients } = useClients();
  const { data: couriers, isLoading: loadingCouriers } = useCouriers();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    courier_id: '',
    client_id: '',
    notes: '',
  });

  const createDelivery = useMutation({
    mutationFn: async (data: {
      courier_id: string;
      client_id: string;
      notes?: string;
    }) => {
      if (!user) throw new Error('No user logged in');
      
      const { weekStart, weekEnd } = getCurrentWeekDates();
      
      // Create delivery with pending status - courier will complete it
      const { data: delivery, error } = await supabase
        .from('deliveries')
        .insert({
          courier_id: data.courier_id,
          client_id: data.client_id,
          notes: data.notes || null,
          created_by: user.id,
          week_start: weekStart,
          week_end: weekEnd,
          delivery_date: new Date().toISOString().split('T')[0],
          status: 'pending',
          amount: 0, // Will be set by courier when registering
          payment_method: 'cash', // Default, will be updated by courier
        })
        .select()
        .single();
      
      if (error) throw error;
      return delivery;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast.success('Pedido asignado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al crear pedido: ' + error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courier_id || !formData.client_id) return;
    
    await createDelivery.mutateAsync({
      courier_id: formData.courier_id,
      client_id: formData.client_id,
      notes: formData.notes || undefined,
    });
    
    // Reset form
    setFormData({ courier_id: '', client_id: '', notes: '' });
    onSuccess?.();
  };

  return (
    <Card className="glass-card animate-slide-up max-w-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          Crear Pedido
        </CardTitle>
        <CardDescription>
          Asigna un pedido a un mensajero. El mensajero registrará los detalles de la entrega (monto, forma de pago, foto).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Courier selection */}
          <div className="space-y-2">
            <Label htmlFor="courier" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary" />
              Mensajero *
            </Label>
            <Select
              value={formData.courier_id}
              onValueChange={(value) => setFormData({ ...formData, courier_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingCouriers ? "Cargando..." : "Selecciona un mensajero"} />
              </SelectTrigger>
              <SelectContent>
                {couriers?.map((courier) => (
                  <SelectItem key={courier.user_id} value={courier.user_id}>
                    {courier.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Client selection */}
          <div className="space-y-2">
            <Label htmlFor="client" className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              Cliente *
            </Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => setFormData({ ...formData, client_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingClients ? "Cargando..." : "Selecciona un cliente"} />
              </SelectTrigger>
              <SelectContent>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Instrucciones (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Instrucciones para el mensajero..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Submit button */}
          <Button 
            type="submit" 
            className="w-full gradient-primary text-primary-foreground"
            disabled={createDelivery.isPending || !formData.courier_id || !formData.client_id}
          >
            {createDelivery.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Asignar Pedido
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
