import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClients } from '@/hooks/useClients';
import { useCouriers } from '@/hooks/useCouriers';
import { getCurrentWeekDates } from '@/hooks/useDeliveries';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Package, UserCheck, Users, DollarSign, CreditCard, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const paymentMethods = [
  { value: 'cash', label: 'Efectivo', icon: DollarSign, color: 'text-cash' },
  { value: 'transfer_to_courier', label: 'Transferencia al Mensajero', icon: CreditCard, color: 'text-transfer-courier' },
  { value: 'transfer_to_client', label: 'Transferencia Directa', icon: ArrowLeftRight, color: 'text-transfer-client' },
] as const;

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
    service_value: '',
    total_to_collect: '',
    payment_method: '' as 'cash' | 'transfer_to_courier' | 'transfer_to_client' | '',
    notes: '',
  });

  const createDelivery = useMutation({
    mutationFn: async (data: {
      courier_id: string;
      client_id: string;
      service_value: number;
      total_to_collect: number;
      payment_method: 'cash' | 'transfer_to_courier' | 'transfer_to_client';
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
          service_value: data.service_value,
          total_to_collect: data.total_to_collect,
          amount: data.total_to_collect, // Keep for backward compatibility
          payment_method: data.payment_method,
        })
        .select()
        .single();
      
      if (error) throw error;
      return delivery;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast.success('Pedido creado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al crear pedido: ' + error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courier_id || !formData.client_id || !formData.payment_method) return;
    
    await createDelivery.mutateAsync({
      courier_id: formData.courier_id,
      client_id: formData.client_id,
      service_value: parseFloat(formData.service_value) || 0,
      total_to_collect: parseFloat(formData.total_to_collect) || 0,
      payment_method: formData.payment_method,
      notes: formData.notes || undefined,
    });
    
    // Reset form
    setFormData({ courier_id: '', client_id: '', service_value: '', total_to_collect: '', payment_method: '', notes: '' });
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
          Asigna un pedido a un mensajero con todos los valores definidos. El mensajero registrará el valor recibido.
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

          {/* Service Value */}
          <div className="space-y-2">
            <Label htmlFor="service_value" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Valor del Servicio *
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="service_value"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="pl-9"
                value={formData.service_value}
                onChange={(e) => setFormData({ ...formData, service_value: e.target.value })}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">70% mensajero / 30% empresa</p>
          </div>

          {/* Total to Collect */}
          <div className="space-y-2">
            <Label htmlFor="total_to_collect">Valor Total a Cobrar *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="total_to_collect"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="pl-9"
                value={formData.total_to_collect}
                onChange={(e) => setFormData({ ...formData, total_to_collect: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Payment method */}
          <div className="space-y-3">
            <Label>Forma de Pago *</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, payment_method: method.value })}
                  className={cn(
                    "p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2",
                    formData.payment_method === method.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <method.icon className={cn("w-5 h-5", method.color)} />
                  <span className="text-xs font-medium text-center">{method.label}</span>
                </button>
              ))}
            </div>
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
            disabled={createDelivery.isPending || !formData.courier_id || !formData.client_id || !formData.payment_method}
          >
            {createDelivery.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Crear Pedido
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
