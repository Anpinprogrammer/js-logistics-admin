import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Package, DollarSign, CreditCard, ArrowLeftRight } from 'lucide-react';
import { Delivery, useUpdateDelivery } from '@/hooks/useDeliveries';
import { useCouriers } from '@/hooks/useCouriers';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Swal from 'sweetalert2';

const paymentMethods = [
  { value: 'cash', label: 'Efectivo', icon: DollarSign },
  { value: 'transfer_to_courier', label: 'Trans. a JS', icon: CreditCard },
  { value: 'transfer_to_client', label: 'Trans. Directa', icon: ArrowLeftRight },
] as const;

interface EditDeliveryModalProps {
  delivery: Delivery | null;
  isOpen: boolean;
  onClose: () => void;
}

const EditDeliveryModal = ({ delivery, isOpen, onClose }: EditDeliveryModalProps) => {
  const { data: couriers, isLoading: loadingCouriers } = useCouriers();
  const updateDelivery = useUpdateDelivery();

  const [courierId, setCourierId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [totalToCollect, setTotalToCollect] = useState('');
  const [serviceValue, setServiceValue] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (delivery) {
      setCourierId(delivery.courier_id);
      setRecipientName(delivery.recipient_name || '');
      setTotalToCollect(String(delivery.total_to_collect));
      setServiceValue(String(delivery.service_value));
      setPaymentMethod(delivery.payment_method);
      setNotes(delivery.notes || '');
      setReason('');
    }
  }, [delivery]);

  useEffect(() => {
    const total = parseFloat(totalToCollect);
    if (!isNaN(total) && total > 0) {
      setServiceValue((total * 0.7).toFixed(0));
    }
  }, [totalToCollect]);

  const handleSave = async () => {
    if (!delivery) return;
    if (!reason.trim()) {
      Swal.fire({ title: 'Error', text: 'Debes ingresar un motivo del cambio.', icon: 'warning', confirmButtonColor: 'hsl(var(--primary))' });
      return;
    }

    try {
      await updateDelivery.mutateAsync({
        id: delivery.id,
        updates: {
          courier_id: courierId,
          recipient_name: recipientName || null,
          total_to_collect: parseFloat(totalToCollect) || 0,
          service_value: parseFloat(serviceValue) || 0,
          payment_method: paymentMethod as Delivery['payment_method'],
          notes: notes || null,
        },
        reason,
      });
      onClose();
    } catch {
      // Error handled by mutation
    }
  };

  if (!isOpen || !delivery) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-xl p-6 md:p-8 overflow-y-auto max-h-[90vh] border border-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Editar Pedido</h2>
          </div>
          <button className="text-muted-foreground hover:text-foreground transition p-2 hover:bg-muted rounded-lg" onClick={onClose} type="button">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Courier */}
          <div className="space-y-2">
            <Label>Mensajero</Label>
            <Select value={courierId} onValueChange={setCourierId}>
              <SelectTrigger>
                <SelectValue placeholder={loadingCouriers ? 'Cargando...' : 'Selecciona un mensajero'} />
              </SelectTrigger>
              <SelectContent className="z-[200]">
                {couriers?.map((c) => (
                  <SelectItem key={c.user_id} value={c.user_id}>{c.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recipient */}
          <div className="space-y-2">
            <Label>Nombre de quien recibe</Label>
            <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Destinatario" />
          </div>

          {/* Total to collect */}
          <div className="space-y-2">
            <Label>Valor Total a Cobrar</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="number" min="0" className="pl-9" value={totalToCollect} onChange={(e) => setTotalToCollect(e.target.value)} />
            </div>
          </div>

          {/* Service value */}
          <div className="space-y-2">
            <Label>Valor del Servicio (70%)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="number" min="0" className="pl-9 bg-muted/50" value={serviceValue} onChange={(e) => setServiceValue(e.target.value)} />
            </div>
          </div>

          {/* Payment method */}
          <div className="space-y-2">
            <Label>Forma de Pago</Label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setPaymentMethod(m.value)}
                  className={cn(
                    'p-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1',
                    paymentMethod === m.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  )}
                >
                  <m.icon className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-medium text-center leading-tight">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Instrucciones..." rows={2} />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label className="text-destructive">Motivo del cambio *</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="¿Por qué se edita este pedido?" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-4 mt-6 justify-end">
          <Button variant="outline" onClick={onClose} disabled={updateDelivery.isPending}>Cancelar</Button>
          <Button onClick={handleSave} disabled={updateDelivery.isPending}>
            {updateDelivery.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default EditDeliveryModal;
