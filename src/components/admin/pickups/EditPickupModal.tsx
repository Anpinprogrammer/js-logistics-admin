import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Package, User, Phone, MapPin, FileText, Calendar, Truck } from 'lucide-react';
import { Pickup, useUpdatePickup } from '@/hooks/usePickups';
import { useCouriers } from '@/hooks/useCouriers';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface EditPickupModalProps {
  pickup: Pickup | null;
  isOpen: boolean;
  onClose: () => void;
}

const EditPickupModal = ({ pickup, isOpen, onClose }: EditPickupModalProps) => {
  const updatePickup = useUpdatePickup();
  const { data: couriers, isLoading: loadingCouriers } = useCouriers();

  const [courierId, setCourierId] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (pickup) {
      setCourierId(pickup.courier_id || '');
      setContactName(pickup.contact_name || '');
      setContactPhone(pickup.contact_phone || '');
      setAddress(pickup.address || '');
      setPickupDate(pickup.pickup_date);
      setNotes(pickup.notes || '');
    }
  }, [pickup]);

  const handleSave = async () => {
    if (!pickup) return;

    try {
      await updatePickup.mutateAsync({
        id: pickup.id,
        updates: {
          courier_id: courierId || null,
          contact_name: contactName || null,
          contact_phone: contactPhone || null,
          address: address || null,
          pickup_date: pickupDate,
          notes: notes || null,
        },
      });
      onClose();
    } catch {
      // Error handled by mutation
    }
  };

  if (!isOpen || !pickup) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-xl p-6 md:p-8 overflow-y-auto max-h-[90vh] border border-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold text-foreground">Editar Recogida</h2>
              <p className="text-xs text-muted-foreground font-mono">{pickup.id.substring(0, 8).toUpperCase()}</p>
            </div>
          </div>
          <button
            className="text-muted-foreground hover:text-foreground transition p-2 hover:bg-muted rounded-lg"
            onClick={onClose}
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Client info (read-only) */}
        <div className="bg-muted/50 rounded-xl p-3 mb-5 text-sm">
          <p className="text-muted-foreground text-xs uppercase font-semibold mb-1">Empresa / Cliente</p>
          <p className="font-medium text-foreground">{pickup.client?.company || pickup.client?.name || '—'}</p>
          {pickup.client?.company && <p className="text-muted-foreground text-xs">{pickup.client.name}</p>}
        </div>

        <div className="space-y-4">
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

          {/* Pickup Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Fecha de Recogida
            </Label>
            <Input
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Notas
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instrucciones adicionales..."
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-4 mt-6 justify-end">
          <Button variant="outline" onClick={onClose} disabled={updatePickup.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updatePickup.isPending}>
            {updatePickup.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default EditPickupModal;
