import { Pickup } from '@/hooks/usePickups';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye, Pencil, Trash2, CheckCircle, Truck } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PickupsTabProps {
  data: Pickup[];
  toggleState: number;
  onViewDetail?: (pickup: Pickup) => void;
  onEdit?: (pickup: Pickup) => void;
  onDelete?: (pickup: Pickup) => void;
  onMarkPickedUp?: (pickup: Pickup) => void;
  onAssignDelivery?: (pickup: Pickup) => void;
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending_pickup: { label: 'Por Recoger', variant: 'secondary' },
  picked_up: { label: 'Recogido', variant: 'default' },
};

function ActionButtons({
  pickup,
  toggleState,
  onViewDetail,
  onEdit,
  onDelete,
  onMarkPickedUp,
  onAssignDelivery,
}: {
  pickup: Pickup;
  toggleState: number;
  onViewDetail?: (p: Pickup) => void;
  onEdit?: (p: Pickup) => void;
  onDelete?: (p: Pickup) => void;
  onMarkPickedUp?: (p: Pickup) => void;
  onAssignDelivery?: (p: Pickup) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {toggleState === 1 && (
        <>
          {onViewDetail && (
            <button
              onClick={() => onViewDetail(pickup)}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
              title="Ver detalle"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          {onMarkPickedUp && (
            <button
              onClick={() => onMarkPickedUp(pickup)}
              className="p-2 rounded-lg hover:bg-green-500/10 text-muted-foreground hover:text-green-600 transition-colors"
              title="Marcar como recogido"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(pickup)}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
              title="Editar recogida"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(pickup)}
              className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Eliminar recogida"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </>
      )}
      {toggleState === 2 && (
        <>
          {onViewDetail && (
            <button
              onClick={() => onViewDetail(pickup)}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
              title="Ver detalle"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          {onAssignDelivery && (
            <button
              onClick={() => onAssignDelivery(pickup)}
              className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
              title="Asignar a domicilio"
            >
              <Truck className="w-4 h-4" />
            </button>
          )}
        </>
      )}
    </div>
  );
}

const PickupsTab = ({
  data,
  toggleState,
  onViewDetail,
  onEdit,
  onDelete,
  onMarkPickedUp,
  onAssignDelivery,
}: PickupsTabProps) => {
  const isMobile = useIsMobile();

  if (data.length === 0) {
    if (isMobile) {
      return (
        <div className="text-center text-muted-foreground py-12 text-sm">
          No hay recogidas en esta categoría.
        </div>
      );
    }
    return (
      <tr>
        <td colSpan={6} className="text-center text-muted-foreground py-12 text-sm">
          No hay recogidas en esta categoría.
        </td>
      </tr>
    );
  }

  // Mobile: card layout
  if (isMobile) {
    return (
      <div className="divide-y divide-border">
        {data.map((pickup) => {
          const statusInfo = statusLabels[pickup.status] || { label: pickup.status, variant: 'outline' as const };
          return (
            <div key={pickup.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-foreground truncate">
                    {pickup.client?.company || pickup.client?.name || '—'}
                  </div>
                  {pickup.client?.company && (
                    <div className="text-xs text-muted-foreground">{pickup.client.name}</div>
                  )}
                  {pickup.contact_name && (
                    <div className="text-xs text-muted-foreground">Contacto: {pickup.contact_name}</div>
                  )}
                </div>
                <Badge variant={statusInfo.variant} className="shrink-0 text-[10px]">
                  {statusInfo.label}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  {pickup.courier ? (
                    <div className="text-sm text-foreground">{pickup.courier.full_name}</div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">Sin mensajero</div>
                  )}
                  {pickup.address && (
                    <div className="text-xs text-muted-foreground truncate max-w-[160px]">{pickup.address}</div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(pickup.created_at), 'dd MMM yyyy', { locale: es })}
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border/50">
                <span className="font-mono text-[10px] text-muted-foreground">
                  {pickup.id.substring(0, 8).toUpperCase()}
                </span>
                <ActionButtons
                  pickup={pickup}
                  toggleState={toggleState}
                  onViewDetail={onViewDetail}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onMarkPickedUp={onMarkPickedUp}
                  onAssignDelivery={onAssignDelivery}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Desktop: table rows
  return (
    <>
      {data.map((pickup) => {
        const statusInfo = statusLabels[pickup.status] || { label: pickup.status, variant: 'outline' as const };
        return (
          <tr key={pickup.id} className="border-b border-border hover:bg-muted/50 transition-colors">
            <td className="p-4 font-mono text-xs text-muted-foreground">
              {pickup.id.substring(0, 8).toUpperCase()}
            </td>
            <td className="p-4">
              <div className="font-medium text-foreground">
                {pickup.client?.company || pickup.client?.name || '—'}
              </div>
              {pickup.client?.company && (
                <div className="text-xs text-muted-foreground">{pickup.client.name}</div>
              )}
            </td>
            <td className="p-4 text-sm text-foreground">
              {pickup.contact_name || <span className="text-muted-foreground">—</span>}
              {pickup.contact_phone && (
                <div className="text-xs text-muted-foreground">{pickup.contact_phone}</div>
              )}
            </td>
            <td className="p-4 text-sm text-foreground">
              {pickup.courier?.full_name || <span className="text-muted-foreground italic">Sin asignar</span>}
            </td>
            <td className="p-4">
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </td>
            <td className="p-4 text-xs text-muted-foreground">
              {format(new Date(pickup.created_at), 'dd MMM yyyy', { locale: es })}
            </td>
            <td className="p-4">
              <ActionButtons
                pickup={pickup}
                toggleState={toggleState}
                onViewDetail={onViewDetail}
                onEdit={onEdit}
                onDelete={onDelete}
                onMarkPickedUp={onMarkPickedUp}
                onAssignDelivery={onAssignDelivery}
              />
            </td>
          </tr>
        );
      })}
    </>
  );
};

export default PickupsTab;
