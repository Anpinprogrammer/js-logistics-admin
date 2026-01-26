import { useState, useEffect } from 'react';
import { Delivery } from '@/hooks/useDeliveries';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertTriangle, DollarSign } from 'lucide-react';

interface EditDeliveryDialogProps {
  delivery: Delivery | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: Partial<Delivery>, reason: string, autoAdvance?: { amount: number; courierId: string }) => Promise<void>;
  loading: boolean;
}

export function EditDeliveryDialog({ delivery, open, onOpenChange, onSave, loading }: EditDeliveryDialogProps) {
  const { isAdmin } = useAuth();
  const [serviceValue, setServiceValue] = useState('');
  const [totalToCollect, setTotalToCollect] = useState('');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer_to_courier' | 'transfer_to_client'>('cash');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (delivery) {
      setServiceValue(String(delivery.service_value || 0));
      setTotalToCollect(String(delivery.total_to_collect || delivery.amount || 0));
      setReceivedAmount(String(delivery.received_amount || ''));
      setPaymentMethod(delivery.payment_method);
      setNotes(delivery.notes || '');
      setReason('');
    }
  }, [delivery]);

  // Calculate difference for warning
  const totalToCollectNum = parseFloat(totalToCollect) || 0;
  const receivedAmountNum = parseFloat(receivedAmount) || 0;
  const difference = totalToCollectNum - receivedAmountNum;
  const hasDifference = totalToCollect && receivedAmount && difference > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    
    const updates: Partial<Delivery> = {
      total_to_collect: parseFloat(totalToCollect),
      received_amount: parseFloat(receivedAmount) || null,
      payment_method: paymentMethod,
      notes: notes || null,
    };

    // Admin can also update service_value
    if (isAdmin) {
      updates.service_value = parseFloat(serviceValue);
    }
    
    // Check if there's a difference to register as advance
    let autoAdvance: { amount: number; courierId: string } | undefined;
    if (hasDifference && delivery) {
      autoAdvance = {
        amount: difference,
        courierId: delivery.courier_id,
      };
    }
    
    await onSave(updates, reason, autoAdvance);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Entrega</DialogTitle>
            <DialogDescription>
              Modifica los datos de la entrega. Se registrará en el historial de auditoría.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Service Value - Only Admin */}
            <div className="space-y-2">
              <Label htmlFor="edit-service-value" className="flex items-center gap-2">
                Valor del Servicio
                {!isAdmin && <span className="text-xs text-muted-foreground">(solo lectura)</span>}
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="edit-service-value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={serviceValue}
                  onChange={(e) => setServiceValue(e.target.value)}
                  className={`pl-9 ${!isAdmin ? 'bg-muted cursor-not-allowed' : ''}`}
                  disabled={!isAdmin}
                  readOnly={!isAdmin}
                />
              </div>
              {!isAdmin && (
                <p className="text-xs text-muted-foreground">Solo el administrador puede modificar este campo</p>
              )}
            </div>

            {/* Total to Collect */}
            <div className="space-y-2">
              <Label htmlFor="edit-total-to-collect">Valor Total a Cobrar</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="edit-total-to-collect"
                  type="number"
                  step="0.01"
                  min="0"
                  value={totalToCollect}
                  onChange={(e) => setTotalToCollect(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            {/* Received Amount */}
            <div className="space-y-2">
              <Label htmlFor="edit-received-amount">Valor Recibido en Destino</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="edit-received-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Difference Warning */}
            {hasDifference && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-warning">Faltante detectado: ${difference.toFixed(2)}</p>
                  <p className="text-muted-foreground">Se registrará automáticamente como adelanto de sueldo</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Forma de Pago</Label>
              <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="transfer_to_courier">Transferencia al Mensajero</SelectItem>
                  <SelectItem value="transfer_to_client">Transferencia Directa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notas</Label>
              <Textarea
                id="edit-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-reason" className="text-destructive">
                Motivo del cambio *
              </Label>
              <Textarea
                id="edit-reason"
                placeholder="Explica por qué se modifica esta entrega..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !reason.trim()}>
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
