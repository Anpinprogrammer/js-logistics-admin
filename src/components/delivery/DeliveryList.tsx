import { useState } from 'react';
import { useDeliveries, Delivery, useUpdateDelivery, useCancelDelivery } from '@/hooks/useDeliveries';
import { DeliveryCard } from './DeliveryCard';
import { EditDeliveryDialog } from './EditDeliveryDialog';
import { CancelDeliveryDialog } from './CancelDeliveryDialog';
import { Loader2, Package, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

interface DeliveryListProps {
  courierId?: string;
  showCourier?: boolean;
}

export function DeliveryList({ courierId, showCourier }: DeliveryListProps) {
  const { data: deliveries, isLoading, error } = useDeliveries(courierId);
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);
  const [cancellingDelivery, setCancellingDelivery] = useState<Delivery | null>(null);
  
  const updateDelivery = useUpdateDelivery();
  const cancelDelivery = useCancelDelivery();

  const filteredDeliveries = deliveries?.filter(d => 
    d.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.notes?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        Error al cargar entregas: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente o notas..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Delivery list */}
      {filteredDeliveries?.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No hay entregas para mostrar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDeliveries?.map((delivery) => (
            <DeliveryCard
              key={delivery.id}
              delivery={delivery}
              onEdit={isAdmin ? setEditingDelivery : undefined}
              onCancel={isAdmin ? setCancellingDelivery : undefined}
              showCourier={showCourier}
            />
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <EditDeliveryDialog
        delivery={editingDelivery}
        open={!!editingDelivery}
        onOpenChange={(open) => !open && setEditingDelivery(null)}
        onSave={async (updates, reason) => {
          if (!editingDelivery) return;
          await updateDelivery.mutateAsync({
            id: editingDelivery.id,
            updates,
            reason,
          });
          setEditingDelivery(null);
        }}
        loading={updateDelivery.isPending}
      />

      {/* Cancel dialog */}
      <CancelDeliveryDialog
        delivery={cancellingDelivery}
        open={!!cancellingDelivery}
        onOpenChange={(open) => !open && setCancellingDelivery(null)}
        onConfirm={async (reason) => {
          if (!cancellingDelivery) return;
          await cancelDelivery.mutateAsync({
            id: cancellingDelivery.id,
            reason,
          });
          setCancellingDelivery(null);
        }}
        loading={cancelDelivery.isPending}
      />
    </div>
  );
}
