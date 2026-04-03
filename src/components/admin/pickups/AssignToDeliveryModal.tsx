import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Truck, DollarSign, CreditCard, ArrowLeftRight, FileText } from 'lucide-react';
import { Pickup } from '@/hooks/usePickups';
import { useCouriers } from '@/hooks/useCouriers';
import { useAuth } from '@/contexts/AuthContextTest';
import { useQueryClient } from '@tanstack/react-query';
import { getCurrentWeekDates } from '@/hooks/useDeliveries';
import { getTodayDate } from '@/utils';
import api from '@/services/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

const paymentMethods = [
  { value: 'cash', label: 'Efectivo', icon: DollarSign },
  { value: 'transfer_to_courier', label: 'Trans. a JS', icon: CreditCard },
  { value: 'transfer_to_client', label: 'Trans. Directa', icon: ArrowLeftRight },
] as const;

interface AssignToDeliveryModalProps {
  pickup: Pickup | null;
  isOpen: boolean;
  onClose: () => void;
}

const AssignToDeliveryModal = ({ pickup, isOpen, onClose }: AssignToDeliveryModalProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: couriers, isLoading: loadingCouriers } = useCouriers();

  const [courierId, setCourierId] = useState('');
  const [totalToCollect, setTotalToCollect] = useState('');
  const [serviceValue, setServiceValue] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer_to_courier' | 'transfer_to_client'>('cash');
  const [notes, setNotes] = useState('');
  const [alerta, setAlerta] = useState('');
  const [isPending, setIsPending] = useState(false);

  const handleTotalChange = (value: string) => {
    setTotalToCollect(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      setServiceValue((num * 0.7).toFixed(0));
    } else {
      setServiceValue('');
    }
  };

  const resetForm = () => {
    setCourierId('');
    setTotalToCollect('');
    setServiceValue('');
    setPaymentMethod('cash');
    setNotes('');
    setAlerta('');
  };

  const handleAssign = async () => {
    if (!pickup || !user) return;

    if (!courierId) {
      setAlerta('Selecciona un mensajero para la entrega.');
      return;
    }
    if (!totalToCollect || parseFloat(totalToCollect) < 0) {
      setAlerta('Ingresa el valor a cobrar (puede ser 0 si no hay cobro).');
      return;
    }
    if (!paymentMethod) {
      setAlerta('Selecciona una forma de pago.');
      return;
    }

    setAlerta('');
    setIsPending(true);

    try {
      const { weekStart, weekEnd } = getCurrentWeekDates();
      const totalNum = parseFloat(totalToCollect) || 0;
      const serviceNum = parseFloat(serviceValue) || 0;

      await api.post('/deliveries', {
        client_id: pickup.client_id,
        courier_id: courierId,
        created_by: user.id,
        recipient_name: pickup.contact_name || null,
        notes: notes || pickup.notes || null,
        week_start: weekStart,
        week_end: weekEnd,
        delivery_date: getTodayDate(),
        status: 'pending',
        service_value: serviceNum,
        total_to_collect: totalNum,
        amount: totalNum,
        payment_method: paymentMethod,
      });

      queryClient.invalidateQueries({ queryKey: ['deliveries'] });

      Swal.fire({
        title: 'Éxito',
        text: 'Domicilio creado exitosamente desde la recogida',
        icon: 'success',
        confirmButtonColor: 'hsl(var(--primary))',
      });

      resetForm();
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error al crear el domicilio: ' + message);
    } finally {
      setIsPending(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen || !pickup) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-lg p-6 md:p-8 overflow-y-auto max-h-[90vh] border border-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div className="flex items-center gap-3">
            <Truck className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold text-foreground">Asignar a Domicilio</h2>
              <p className="text-xs text-muted-foreground">Crear entrega desde esta recogida</p>
            </div>
          </div>
          <button
            className="text-muted-foreground hover:text-foreground transition p-2 hover:bg-muted rounded-lg"
            onClick={handleClose}
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pickup summary */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-5">
          <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Paquete de</p>
          <p className="font-semibold text-foreground">
            {pickup.client?.company || pickup.client?.name || '—'}
          </p>
          {pickup.client?.company && (
            <p className="text-xs text-muted-foreground">{pickup.client.name}</p>
          )}
          {pickup.address && (
            <p className="text-xs text-muted-foreground mt-1">Origen: {pickup.address}</p>
          )}
        </div>

        <div className="space-y-4">
          {/* Courier */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-muted-foreground" />
              Mensajero para la Entrega *
            </Label>
            <Select value={courierId} onValueChange={setCourierId}>
              <SelectTrigger>
                <SelectValue placeholder={loadingCouriers ? 'Cargando...' : 'Selecciona un mensajero'} />
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

          {/* Total to collect */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              Valor a Cobrar *
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                min="0"
                className="pl-9"
                value={totalToCollect}
                onChange={(e) => handleTotalChange(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Service value */}
          {serviceValue && (
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Valor del Servicio (70% auto-calculado)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="0"
                  className="pl-9 bg-muted/50"
                  value={serviceValue}
                  onChange={(e) => setServiceValue(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Payment method */}
          <div className="space-y-2">
            <Label>Forma de Pago *</Label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setPaymentMethod(m.value)}
                  className={cn(
                    'p-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1',
                    paymentMethod === m.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
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
            <Label className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Notas para la Entrega
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instrucciones para el mensajero..."
              rows={2}
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
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleAssign} disabled={isPending}>
            {isPending ? 'Creando domicilio...' : 'Crear Domicilio'}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AssignToDeliveryModal;
