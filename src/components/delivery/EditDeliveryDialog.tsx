import { useState, useEffect } from 'react';
import { Delivery } from '@/hooks/useDeliveries';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface EditDeliveryDialogProps {
  delivery: Delivery | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: Partial<Delivery>, reason: string) => Promise<void>;
  loading: boolean;
}

export function EditDeliveryDialog({ delivery, open, onOpenChange, onSave, loading }: EditDeliveryDialogProps) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer_to_courier' | 'transfer_to_client'>('cash');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (delivery) {
      setAmount(String(delivery.amount));
      setPaymentMethod(delivery.payment_method);
      setNotes(delivery.notes || '');
      setReason('');
    }
  }, [delivery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    
    await onSave({
      amount: parseFloat(amount),
      payment_method: paymentMethod,
      notes: notes || null,
    }, reason);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Entrega</DialogTitle>
            <DialogDescription>
              Modifica los datos de la entrega. Se registrará en el historial de auditoría.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Monto</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

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
