import { useState } from 'react';
import { useDeliveries, Delivery, useUpdateDelivery, useCancelDelivery, useDeliveriesTest } from '@/hooks/useDeliveries';
import { useRegisterDelivery } from '@/hooks/useRegisterDelivery';
import { DeliveryCard } from './DeliveryCard';
import { EditDeliveryDialog } from './EditDeliveryDialog';
import { CancelDeliveryDialog } from './CancelDeliveryDialog';
import { RegisterDeliveryDialog } from '@/components/courier/RegisterDeliveryDialog';
import { Loader2, Package, Search, ClipboardList } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
//import { useAuth } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContextTest';

interface DeliveryListProps {
  courierId?: string;
  showCourier?: boolean;
}

export function DeliveryList({ courierId, showCourier }: DeliveryListProps) {
  const { data: deliveries, isLoading, error } = useDeliveriesTest(courierId);
  const { isAdmin, isCourier } = useAuth();
  const [search, setSearch] = useState('');
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);
  const [cancellingDelivery, setCancellingDelivery] = useState<Delivery | null>(null);
  const [registeringDelivery, setRegisteringDelivery] = useState<Delivery | null>(null);
  
  const updateDelivery = useUpdateDelivery();
  const cancelDelivery = useCancelDelivery();
  const registerDelivery = useRegisterDelivery();

  // For couriers: ONLY show pending deliveries assigned to them
  // For admins: show all deliveries
  const visibleDeliveries = isCourier && !isAdmin 
    ? deliveries?.filter(d => d.status === 'pending') || []
    : deliveries || [];

  const filterDeliveries = (list: Delivery[]) => 
    list.filter(d => 
      d.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.notes?.toLowerCase().includes(search.toLowerCase())
    );

  const filteredDeliveries = filterDeliveries(visibleDeliveries);

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

  const renderDeliveryList = (list: Delivery[], showRegisterButton = false, allowCourierEdit = false) => (
    list.length === 0 ? (
      <div className="text-center py-12">
        <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">No hay entregas para mostrar</p>
      </div>
    ) : (
      <div className="space-y-3">
        {list.map((delivery) => (
          <DeliveryCard
            key={delivery.id}
            delivery={delivery}
            onEdit={isAdmin || (allowCourierEdit && isCourier && delivery.status === 'completed') ? setEditingDelivery : undefined}
            onCancel={isAdmin ? setCancellingDelivery : undefined}
            onRegister={showRegisterButton && isCourier ? setRegisteringDelivery : undefined}
            showCourier={showCourier}
          />
        ))}
      </div>
    )
  );

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

      {/* Courier view - simple list of pending deliveries only */}
      {isCourier && !isAdmin ? (
        <div className="space-y-3">
          {filteredDeliveries.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No tienes entregas pendientes</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList className="w-5 h-5 text-warning" />
                <span className="font-medium">Entregas Pendientes</span>
                <Badge variant="destructive">{filteredDeliveries.length}</Badge>
              </div>
              {filteredDeliveries.map((delivery) => (
                <DeliveryCard
                  key={delivery.id}
                  delivery={delivery}
                  onRegister={setRegisteringDelivery}
                  showCourier={false}
                />
              ))}
            </>
          )}
        </div>
      ) : (
        // Admin view - all deliveries
        renderDeliveryList(filteredDeliveries, false)
      )}

      {/* Edit dialog (admin only) */}
      <EditDeliveryDialog
        delivery={editingDelivery}
        open={!!editingDelivery}
        onOpenChange={(open) => !open && setEditingDelivery(null)}
        onSave={async (updates, reason, autoAdvance) => {
          if (!editingDelivery) return;
          await updateDelivery.mutateAsync({
            id: editingDelivery.id,
            updates,
            reason,
            autoAdvance,
          });
          setEditingDelivery(null);
        }}
        loading={updateDelivery.isPending}
      />

      {/* Cancel dialog (admin only) */}
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

      {/* Register dialog (courier only) */}
      <RegisterDeliveryDialog
        delivery={registeringDelivery}
        open={!!registeringDelivery}
        onOpenChange={(open) => !open && setRegisteringDelivery(null)}
        onRegister={async (data) => {
          if (!registeringDelivery) return;
          await registerDelivery.mutateAsync({
            deliveryId: registeringDelivery.id,
            courierId: registeringDelivery.courier_id,
            final_status: data.final_status,
            received_amount: data.received_amount,
            payment_method: data.payment_method,
            subAccount: data.subAccount,
            notes: data.notes,
            receipt_photo_url: data.receipt_photo_url,
          });
          setRegisteringDelivery(null);
        }}
        loading={registerDelivery.isPending}
      />
    </div>
  );
}
