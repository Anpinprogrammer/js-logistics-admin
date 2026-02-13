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


interface ClientInfoProps {
  onSuccess?: () => void;
  clientFormData: {
    clientId: string,
    clientName: string,
    clientCompany: string,
    clientPhone: string,
    clientAddress: string,
    serviceValue: string
  };
  setClientFormData: React.Dispatch<React.SetStateAction<{
    clientId: string;
    clientName: string;
    clientCompany: string;
    clientPhone: string;
    clientAddress: string;
    serviceValue: string;
}>>
}

export function ClientInfo({ onSuccess, clientFormData, setClientFormData }: ClientInfoProps) {
  const { data: clients, isLoading: loadingClients } = useClients();
  const { data: couriers, isLoading: loadingCouriers } = useCouriers();
  const { user } = useAuth();
  const queryClient = useQueryClient();


  const handleClientSelect = (client: Client) => {
    setClientFormData({
      clientId: client.id,
      clientName: client.name,
      clientCompany: client.company || '',
      clientPhone: client.phone || '',
      clientAddress: client.address || '',
      serviceValue: ''
    })
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
        <form className="space-y-6">
          
          <BusquedaCliente onClientSelect={handleClientSelect} />

          {/* Client name */}
          <div className="space-y-2">
            <Label htmlFor="clientName">Nombre *</Label>
            <Input
              id="clientName"
              type="text"
              placeholder="Nombre del Cliente"
              value={clientFormData.clientName}
              onChange={(e) => setClientFormData({ ...clientFormData, clientName: e.target.value })}
            />
          </div>

          {/* Company name */}
          <div className="space-y-2">
            <Label htmlFor="clientCompany">Empresa *</Label>
            <Input
              id="clientCompany"
              type="text"
              placeholder="Empresa del cliente"
              value={clientFormData.clientCompany}
              onChange={(e) => setClientFormData({ ...clientFormData, clientCompany: e.target.value })}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="clientPhone">Telefono *</Label>
            <Input
              id="clientPhone"
              type="text"
              placeholder="Telefono del cliente"
              value={clientFormData.clientPhone}
              onChange={(e) => setClientFormData({ ...clientFormData, clientPhone: e.target.value })}
            />
          </div>

          {/* PickUp Location */}
          <div className="space-y-2">
            <Label htmlFor="clientAddress">Direccion de Recogida *</Label>
            <Input
              id="clientAddress"
              type="text"
              placeholder="Direccion del cliente"
              value={clientFormData.clientAddress}
              onChange={(e) => setClientFormData({ ...clientFormData, clientAddress: e.target.value })}
            />
          </div>

          {/* Service Value (manual) */}
            <div className="space-y-2">
              <Label htmlFor='serviceValue' >Valor del Servicio *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id='serviceValue'
                  type="number"
                  min="0"
                  placeholder="0"
                  className="pl-9"
                  value={clientFormData.serviceValue}
                  onChange={(e) => setClientFormData({ ...clientFormData, serviceValue: e.target.value })}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">Valor neto que cobra la empresa por el domicilio. El 70% se paga al mensajero.</p>
            </div>

        </form>
      </CardContent>
    </Card>
  );
}
