import { Client } from '@/hooks/useClients';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import BusquedaCliente from './BusquedaCliente';

interface ClientInfoProps {
  clientFormData: {
    clientId: string;
    clientName: string;
    clientCompany: string;
    clientPhone: string;
    clientAddress: string;
    recipientName: string;
    notes: string;
  };
  setClientFormData: React.Dispatch<React.SetStateAction<{
    clientId: string;
    clientName: string;
    clientCompany: string;
    clientPhone: string;
    clientAddress: string;
    recipientName: string;
    notes: string;
}>>
}

export function ClientInfo({ clientFormData, setClientFormData }: ClientInfoProps) {

  const handleClientSelect = (client: Client) => {
    setClientFormData({
      clientId: client.id,
      clientName: client.name,
      clientCompany: client.company || '',
      clientPhone: client.phone || '',
      clientAddress: client.address || '',
      recipientName: '',
      notes: ''
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

          {/* Recipient name */}
          <div className="space-y-2">
            <Label htmlFor="recipient_name">Nombre de quien recibe</Label>
            <Input
              id="recipient_name"
              type="text"
              placeholder="Nombre del destinatario"
              value={clientFormData.recipientName}
              onChange={(e) => setClientFormData({ ...clientFormData, recipientName: e.target.value })}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Instrucciones (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Instrucciones para el mensajero..."
              value={clientFormData.notes}
              onChange={(e) => setClientFormData({ ...clientFormData, notes: e.target.value })}
              rows={3}
            />
          </div>

        </form>
      </CardContent>
    </Card>
  );
}
