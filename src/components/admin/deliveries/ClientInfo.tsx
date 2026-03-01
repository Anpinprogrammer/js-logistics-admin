import { useState, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClients, Client } from '@/hooks/useClients';
import { useCouriers } from '@/hooks/useCouriers';
import { getCurrentWeekDates } from '@/hooks/useDeliveries';
//import { useAuth } from '@/contexts/AuthContext';
import { useCouriersTest } from '@/hooks/useCouriers';
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
import { Badge } from '@/components/ui/badge';

interface AddedService {
  serviceId: string
  name: string
  subAccount?: string
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
deliveryFormData?: {
    courierId: string;
    recipientName: string;
    totalToCollect: string;
    inAdvancedPayment: boolean;
    paymentMethod: string;
    notes: string;
  };
  setDeliveryFormData?: React.Dispatch<React.SetStateAction<{
    courierId: string;
    recipientName: string;
    totalToCollect: string;
    inAdvancedPayment?: boolean;
    paymentMethod: string;
    notes: string;
  }>>;
}

export function ClientInfo({ onSuccess, clientFormData, setClientFormData, deliveryFormData, setDeliveryFormData }: ClientInfoProps) {

  const { data: couriers, isLoading: loadingCouriers } = useCouriersTest();


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

          {/* Client and company name */}
          <div className="space-y-2">
            <Label>Nombre o Empresa *</Label>
            <p className="px-3 py-2 text-sm rounded-md border bg-muted text-muted-foreground min-h-9 flex items-center">
              {clientFormData?.clientName ? 
              clientFormData.clientCompany ? clientFormData.clientName + ' / ' + clientFormData.clientCompany : clientFormData.clientName 
              : 'Nombre y Empresa del Cliente'}
            </p>
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

          {/* Courier selection 
          <div className="space-y-2">
            <Label htmlFor="courier" className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-primary" />
                Mensajero *
            </Label>
            <Select
              value={deliveryFormData.courierId}
              onValueChange={(value) => setDeliveryFormData({ ...deliveryFormData, courierId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingCouriers ? "Cargando..." : (couriers?.length === 0 ? "No hay mensajeros" : "Selecciona un mensajero")} />
              </SelectTrigger>
              <SelectContent className="z-[200]">
                {loadingCouriers ? (
                  <div className="p-2 text-center text-muted-foreground">Cargando...</div>
                ) : couriers?.length === 0 ? (
                  <div className="p-2 text-center text-muted-foreground">No hay mensajeros disponibles</div>
                ) : (
                  couriers?.map((courier) => (
                    <SelectItem key={courier.user_id} value={courier.user_id}>
                      {courier.full_name}
                    </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
          </div>
          */}

          {/* Recipient name */}
          <div className="space-y-2">
            <Label htmlFor="recipient_name">Nombre de quien recibe</Label>
            <Input
              id="recipient_name"
              type="text"
              placeholder="Nombre del destinatario"
              value={deliveryFormData.recipientName}
              onChange={(e) => setDeliveryFormData({ ...deliveryFormData, recipientName: e.target.value })}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Instrucciones (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Instrucciones para el mensajero..."
              value={deliveryFormData.notes}
              onChange={(e) => setDeliveryFormData({ ...deliveryFormData, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Service Value (manual) 
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
            */}

          {/**Servicios adicionales 
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

                  {service.subAccount && (
                    <Badge
                      className={`${service.subAccount === 'Efectivo' ? 'bg-green-300' 
                        : service.subAccount === 'Bancolombia' ? 'bg-orange-300' 
                        : 'bg-purple-300'} hover:bg-none`}
                    >
                      <p className={
                        `${service.subAccount === 'Efectivo' ? 'text-green-700' 
                        : service.subAccount === 'Bancolombia' ? 'text-orange-400' 
                        : 'text-purple-600'} text-sm`
                      } >
                        {service.subAccount}
                      </p>
                    </Badge>
                    
                  )

                  }


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
          */}


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
