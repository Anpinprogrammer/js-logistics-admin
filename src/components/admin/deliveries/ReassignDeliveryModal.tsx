import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, RefreshCw, Calendar, UserCheck } from 'lucide-react';
import { Delivery, useReassignDelivery } from '@/hooks/useDeliveries';
import { useCouriersTest } from '@/hooks/useCouriers';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import Swal from 'sweetalert2';

interface ReassignDeliveryModalProps {
  delivery: Delivery | null;
  isOpen: boolean;
  onClose: () => void;
}

const ReassignDeliveryModal = ({ delivery, isOpen, onClose }: ReassignDeliveryModalProps) => {
  const { data: couriers, isLoading: loadingCouriers } = useCouriersTest();
  const reassign = useReassignDelivery();

  const [courierId, setCourierId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (delivery) {
      setCourierId(delivery.courier_id);
      setDeliveryDate(new Date().toISOString().split('T')[0]);
      setNotes(delivery.notes || '');
    }
  }, [delivery]);

  const handleReassign = async () => {
    if (!delivery) return;
    if (!courierId) {
      Swal.fire({ title: 'Error', text: 'Selecciona un mensajero.', icon: 'warning', confirmButtonColor: 'hsl(var(--primary))' });
      return;
    }
    if (!deliveryDate) {
      Swal.fire({ title: 'Error', text: 'Selecciona una fecha.', icon: 'warning', confirmButtonColor: 'hsl(var(--primary))' });
      return;
    }

    try {
      await reassign.mutateAsync({
        id: delivery.id,
        courierId,
        deliveryDate,
        notes: notes || undefined,
      });
      onClose();
    } catch {
      // Error handled by mutation
    }
  };

  if (!isOpen || !delivery) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-md p-6 md:p-8 overflow-y-auto max-h-[90vh] border border-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold text-foreground">Reasignar Pedido</h2>
              <p className="text-xs text-muted-foreground font-mono">{delivery.id.substring(0, 8).toUpperCase()}</p>
            </div>
          </div>
          <button className="text-muted-foreground hover:text-foreground transition p-2 hover:bg-muted rounded-lg" onClick={onClose} type="button">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Info */}
          <div className="bg-muted/50 rounded-xl p-3 text-sm">
            <p className="text-muted-foreground">Cliente: <span className="font-medium text-foreground">{delivery.client?.name || '—'}</span></p>
            <p className="text-muted-foreground">Valor: <span className="font-medium text-foreground">${Number(delivery.total_to_collect).toLocaleString('es-CO')}</span></p>
          </div>

          {/* New courier */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary" />
              Nuevo Mensajero *
            </Label>
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

          {/* New date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Nueva Fecha de Entrega *
            </Label>
            <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Instrucciones adicionales..." rows={2} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-4 mt-6 justify-end">
          <Button variant="outline" onClick={onClose} disabled={reassign.isPending}>Cancelar</Button>
          <Button onClick={handleReassign} disabled={reassign.isPending}>
            {reassign.isPending ? 'Reasignando...' : 'Reasignar Pedido'}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ReassignDeliveryModal;
