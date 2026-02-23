import { useState, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClients, Client } from '@/hooks/useClients';
import { useCouriers } from '@/hooks/useCouriers';
import { getCurrentWeekDates } from '@/hooks/useDeliveries';
//import { useAuth } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContextTest';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@radix-ui/react-dialog';
import ServiceDialog from './ServiceDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Package, UserCheck, Users, DollarSign, CreditCard, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import BusquedaCliente from './BusquedaCliente';
import { ServiceFormModal } from '../options/ServiceFormModal';

interface AddedService {
  serviceId: string
  name: string
  amount: string
}

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

  const [services, setServices] = useState<AddedService[]>([])
  const [openServiceModal, setOpenServiceModal] = useState(false)
  const [regularService, setRegularService] = useState('')
  const [addedService, setAddedService] = useState(0)

  useEffect(() => {
    const totalServices = () => {
      const suma = services.reduce((total, service) => total + Number(service.amount), 0)
      const sumatoriaTotal = suma + Number(regularService)
      setClientFormData({...clientFormData, serviceValue: sumatoriaTotal.toString()})
    }
    totalServices()
  }, [services, regularService])

  const handleTotalServices = () => {

  }

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
                  value={regularService}
                  onChange={(e) => setRegularService(e.target.value)}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">Valor neto que cobra la empresa por el domicilio. El 70% se paga al mensajero.</p>
            </div>

          {/**Servicios adicionales */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Servicios adicionales</Label>

              <button
                type="button"
                onClick={() => setOpenServiceModal(true)}
                className="text-sm text-primary font-medium hover:underline"
              >
                + Agregar servicio
              </button>
            </div>

            {services.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No hay adicionales agregados
              </p>
            )}

            <div className="space-y-2">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${service.amount.toLocaleString()}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                    setServices(services.filter((_, i) => i !== index))
                    }
                    className="text-sm text-red-500 hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>


        </form>
      </CardContent>
      {/**Create new service dialog */}
      <Dialog open={openServiceModal} onOpenChange={setOpenServiceModal} >
        <ServiceDialog 
          setDialogOpen={setOpenServiceModal}
          services={services}
          setServices={setServices}
        />
      </Dialog>
    </Card>
  );
}
