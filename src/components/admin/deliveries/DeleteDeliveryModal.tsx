import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle } from 'lucide-react';
import { Delivery, useDeleteDelivery } from '@/hooks/useDeliveries';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface DeleteDeliveryModalProps {
  delivery: Delivery | null;
  isOpen: boolean;
  onClose: () => void;
}

const DeleteDeliveryModal = ({ delivery, isOpen, onClose }: DeleteDeliveryModalProps) => {
  const deleteDelivery = useDeleteDelivery();
  const [reason, setReason] = useState('');

  const handleDelete = async () => {
    if (!delivery || !reason.trim()) return;

    try {
      await deleteDelivery.mutateAsync({ id: delivery.id, reason });
      setReason('');
      onClose();
    } catch {
      // Error handled by mutation
    }
  };

  if (!isOpen || !delivery) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-md p-6 md:p-8 border border-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-destructive" />
            <h2 className="text-xl font-semibold text-foreground">Eliminar Pedido</h2>
          </div>
          <button className="text-muted-foreground hover:text-foreground transition p-2 hover:bg-muted rounded-lg" onClick={onClose} type="button">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
            <p className="text-sm text-foreground">
              ¿Estás seguro de eliminar el pedido <span className="font-mono font-bold">{delivery.id.substring(0, 8).toUpperCase()}</span> del cliente <span className="font-bold">{delivery.client?.name || '—'}</span>?
            </p>
            <p className="text-xs text-muted-foreground mt-2">Esta acción no se puede deshacer.</p>
          </div>

          <div className="space-y-2">
            <Label className="text-destructive">Motivo de eliminación *</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="¿Por qué se elimina este pedido?"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-4 mt-6 justify-end">
          <Button variant="outline" onClick={onClose} disabled={deleteDelivery.isPending}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteDelivery.isPending || !reason.trim()}>
            {deleteDelivery.isPending ? 'Eliminando...' : 'Eliminar Pedido'}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default DeleteDeliveryModal;
