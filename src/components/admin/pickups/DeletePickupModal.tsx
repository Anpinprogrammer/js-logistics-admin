import { createPortal } from 'react-dom';
import { X, AlertTriangle } from 'lucide-react';
import { Pickup, useDeletePickup } from '@/hooks/usePickups';
import { Button } from '@/components/ui/button';

interface DeletePickupModalProps {
  pickup: Pickup | null;
  isOpen: boolean;
  onClose: () => void;
}

const DeletePickupModal = ({ pickup, isOpen, onClose }: DeletePickupModalProps) => {
  const deletePickup = useDeletePickup();

  const handleDelete = async () => {
    if (!pickup) return;
    try {
      await deletePickup.mutateAsync(pickup.id);
      onClose();
    } catch {
      // Error handled by mutation
    }
  };

  if (!isOpen || !pickup) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-md p-6 md:p-8 border border-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-destructive" />
            <h2 className="text-xl font-semibold text-foreground">Eliminar Recogida</h2>
          </div>
          <button
            className="text-muted-foreground hover:text-foreground transition p-2 hover:bg-muted rounded-lg"
            onClick={onClose}
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
            <p className="text-sm text-foreground">
              ¿Estás seguro de eliminar la recogida{' '}
              <span className="font-mono font-bold">{pickup.id.substring(0, 8).toUpperCase()}</span>{' '}
              de{' '}
              <span className="font-bold">
                {pickup.client?.company || pickup.client?.name || '—'}
              </span>
              ?
            </p>
            <p className="text-xs text-muted-foreground mt-2">Esta acción no se puede deshacer.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-4 mt-6 justify-end">
          <Button variant="outline" onClick={onClose} disabled={deletePickup.isPending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deletePickup.isPending}>
            {deletePickup.isPending ? 'Eliminando...' : 'Eliminar Recogida'}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default DeletePickupModal;
