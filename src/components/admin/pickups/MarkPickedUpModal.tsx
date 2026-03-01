import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, FileText } from 'lucide-react';
import { Pickup, useMarkPickedUp } from '@/hooks/usePickups';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface MarkPickedUpModalProps {
  pickup: Pickup | null;
  isOpen: boolean;
  onClose: () => void;
}

const MarkPickedUpModal = ({ pickup, isOpen, onClose }: MarkPickedUpModalProps) => {
  const markPickedUp = useMarkPickedUp();
  const [notes, setNotes] = useState('');

  const handleConfirm = async () => {
    if (!pickup) return;
    try {
      await markPickedUp.mutateAsync({ id: pickup.id, notes: notes || undefined });
      setNotes('');
      onClose();
    } catch {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    setNotes('');
    onClose();
  };

  if (!isOpen || !pickup) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-md p-6 md:p-8 border border-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-semibold text-foreground">Marcar como Recogido</h2>
          </div>
          <button
            className="text-muted-foreground hover:text-foreground transition p-2 hover:bg-muted rounded-lg"
            onClick={handleClose}
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Pickup info summary */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
            <p className="text-sm text-foreground">
              Confirmas que el paquete de{' '}
              <span className="font-bold">
                {pickup.client?.company || pickup.client?.name || '—'}
              </span>{' '}
              ya fue recogido.
            </p>
            {pickup.address && (
              <p className="text-xs text-muted-foreground mt-1">Dirección: {pickup.address}</p>
            )}
          </div>

          {/* Optional notes */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Notas de la recogida (opcional)
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones sobre la recogida..."
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-4 mt-6 justify-end">
          <Button variant="outline" onClick={handleClose} disabled={markPickedUp.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={markPickedUp.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {markPickedUp.isPending ? 'Actualizando...' : 'Confirmar Recogida'}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default MarkPickedUpModal;
