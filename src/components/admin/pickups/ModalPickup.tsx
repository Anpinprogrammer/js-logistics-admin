import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Package, User, Phone, MapPin, FileText, Calendar, Truck } from 'lucide-react';
import { useCreatePickup } from '@/hooks/usePickups';
import { useCouriers } from '@/hooks/useCouriers';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import BusquedaCliente from '../deliveries/BusquedaCliente';
import { Client } from '@/hooks/useClientsTest';
import Swal from 'sweetalert2';

interface ModalPickupProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalPickup = ({ isOpen, onClose }: ModalPickupProps) => {
  const createPickup = useCreatePickup();
  const { data: couriers, isLoading: loadingCouriers } = useCouriers();

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [courierId, setCourierId] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pickupDate, setPickupDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [alerta, setAlerta] = useState('');

  const resetForm = () => {
    setSelectedClient(null);
    setCourierId('');
    setContactName('');
    setContactPhone('');
    setAddress('');
    setPickupDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setAlerta('');
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    if (client.phone) setContactPhone(client.phone);
    if (client.address) setAddress(client.address);
    setAlerta('');
  };

  const handleSave = async () => {
    if (!selectedClient) {
      setAlerta('Selecciona una empresa o cliente.');
      return;
    }
    if (!pickupDate) {
      setAlerta('Selecciona una fecha de recogida.');
      return;
    }
    setAlerta('');

    try {
      await createPickup.mutateAsync({
        client_id: selectedClient.id,
        courier_id: courierId || undefined,
        contact_name: contactName || undefined,
        contact_phone: contactPhone || undefined,
        address: address || undefined,
        notes: notes || undefined,
        pickup_date: pickupDate,
      });
      Swal.fire({
        title: 'Éxito',
        text: 'Recogida registrada exitosamente',
        icon: 'success',
        confirmButtonColor: 'hsl(var(--primary))',
      });
      resetForm();
      onClose();
    } catch {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo registrar la recogida',
        icon: 'error',
        confirmButtonColor: 'hsl(var(--primary))',
      });
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-2xl p-6 md:p-8 overflow-y-auto max-h-[90vh] border border-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Registrar Nueva Recogida</h2>
          </div>
          <button
            className="text-muted-foreground hover:text-foreground transition p-2 hover:bg-muted rounded-lg"
            onClick={() => { onClose(); resetForm(); }}
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Company / Client */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              Empresa / Cliente *
            </Label>
            <BusquedaCliente onClientSelect={handleClientSelect} />
            {selectedClient && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm">
                <p className="font-semibold text-foreground">{selectedClient.company || selectedClient.name}</p>
                {selectedClient.company && (
                  <p className="text-muted-foreground text-xs">{selectedClient.name}</p>
                )}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Contact Name */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Nombre de Contacto
              </Label>
              <Input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Persona a contactar..."
              />
            </div>

            {/* Contact Phone */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                Teléfono de Contacto
              </Label>
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Número de contacto..."
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              Dirección de Recogida
            </Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Dirección donde se recoge..."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Courier */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-muted-foreground" />
                Mensajero Asignado
              </Label>
              <Select value={courierId} onValueChange={setCourierId}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingCouriers ? 'Cargando...' : 'Sin asignar'} />
                </SelectTrigger>
                <SelectContent className="z-[200]">
                  {couriers?.map((c) => (
                    <SelectItem key={c.user_id} value={c.user_id}>
                      {c.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pickup Date */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Fecha de Recogida *
              </Label>
              <Input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Notas / Instrucciones
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instrucciones adicionales para la recogida..."
              rows={3}
            />
          </div>
        </div>

        {/* Alert */}
        {alerta && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-center text-destructive font-medium text-sm">{alerta}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-4 mt-6 justify-end">
          <Button
            variant="outline"
            onClick={() => { onClose(); resetForm(); }}
            disabled={createPickup.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={createPickup.isPending}>
            {createPickup.isPending ? 'Registrando...' : 'Registrar Recogida'}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ModalPickup;
