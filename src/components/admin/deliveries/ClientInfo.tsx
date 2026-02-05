import { useState, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClients, Client } from '@/hooks/useClients';
import { useCouriers } from '@/hooks/useCouriers';
import { getCurrentWeekDates } from '@/hooks/useDeliveries';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Package, UserCheck, Users, DollarSign, CreditCard, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import BusquedaCliente from './BusquedaCliente';

const paymentMethods = [
  { value: 'cash', label: 'Efectivo', icon: DollarSign, color: 'text-cash' },
  { value: 'transfer_to_courier', label: 'Transferencia a JS', icon: CreditCard, color: 'text-transfer-courier' },
  { value: 'transfer_to_client', label: 'Transferencia Directa', icon: ArrowLeftRight, color: 'text-transfer-client' },
] as const;

interface ClientInfoProps {
  onSuccess?: () => void;
}

export function ClientInfo({ onSuccess }: ClientInfoProps) {
  const { data: clients, isLoading: loadingClients } = useClients();
  const { data: couriers, isLoading: loadingCouriers } = useCouriers();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [serviceValue, setServiceValue] = useState<number>(0)

  
  const [formData, setFormData] = useState({
    client_id: '',
    client_name: '',
    client_company: '',
    client_phone: '',
    client_address: '',
  });

  const handleSelectedClient = (cliente: Client) => {
    setFormData({
      ...formData,
      client_id: cliente.id,
      client_name: cliente.name,
      client_address: cliente.address,
      client_company: cliente.company,
      client_phone: cliente.phone
    })
  }

  /*
  const createDelivery = useMutation({
    mutationFn: async (data: {
      client_id: string;
      client_name: string;
      client_company: string;
      client_phone: string;
      client_address: string;
    }) => {
      if (!user) throw new Error('No user logged in');
      
      const { weekStart, weekEnd } = getCurrentWeekDates();
      
      // Create delivery with pending status - courier will complete it
     
      const { data: delivery, error } = await supabase
        .from('deliveries')
        .insert({
          courier_id: data.courier_id,
          client_id: data.client_id,
          recipient_name: data.recipient_name || null,
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
  */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_name || !formData.client_id || !formData.client_phone) return;
    
    /**
     * await createDelivery.mutateAsync({
      client_id: formData.client_id,
      client_name: formData.client_name,
    client_company: '',
    client_phone: '',
    client_address: '',
      
    });
     */
    
    
    // Reset form
    setFormData({ client_id: '',
    client_name: '',
    client_company: '',
    client_phone: '',
    client_address: '',
  });
    onSuccess?.();
  };

  return (
    <Card className="glass-card animate-slide-up max-w-xl h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Datos del Cliente
        </CardTitle>
        <CardDescription>
          Asigna el cliente asociado al pedido, aqui podras crear un nuevo cliente si el cliente no ha sido creado antes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <BusquedaCliente onClientSelect={handleSelectedClient} />

          {/* Client selection 
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
          */}

          {/* Client name */}
          <div className="space-y-2">
            <Label htmlFor="recipient_name">Nombre *</Label>
            <Input
              id="recipient_name"
              type="text"
              placeholder="Nombre del destinatario"
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
            />
          </div>

          {/* Company name */}
          <div className="space-y-2">
            <Label htmlFor="recipient_name">Empresa *</Label>
            <Input
              id="recipient_name"
              type="text"
              placeholder="Empresa del cliente"
              value={formData.client_company}
              onChange={(e) => setFormData({ ...formData, client_company: e.target.value })}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="recipient_name">Telefono *</Label>
            <Input
              id="recipient_name"
              type="text"
              placeholder="Telefono del cliente"
              value={formData.client_phone}
              onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
            />
          </div>

          {/* PickUp Location */}
          <div className="space-y-2">
            <Label htmlFor="recipient_name">Direccion de Recogida *</Label>
            <Input
              id="recipient_name"
              type="text"
              placeholder="Direccion del cliente"
              value={formData.client_address}
              onChange={(e) => setFormData({ ...formData, client_address: e.target.value })}
            />
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
                value={serviceValue}
                onChange={(e) => setServiceValue(Number(e.target.value))}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">70% mensajero / 30% empresa</p>
          </div>

        </form>
      </CardContent>
    </Card>
  );
}
