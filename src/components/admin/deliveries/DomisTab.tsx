import { Delivery } from '@/hooks/useDeliveries';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye, Pencil, Trash2, RefreshCw, CheckCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface DomisTabProps {
  data: Delivery[];
  toggleState: number;
  busqueda: string;
  onViewDetail?: (delivery: Delivery) => void;
  onEdit?: (delivery: Delivery) => void;
  onDelete?: (delivery: Delivery) => void;
  onReassign?: (delivery: Delivery) => void;
  onComplete?: (delivery: Delivery) => void;
  onCorrect?: (delivery: Delivery) => void;
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendiente', variant: 'secondary' },
  completed: { label: 'Entregado', variant: 'default' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
  not_delivered_collected: { label: 'No entregado (cobrado)', variant: 'destructive' },
  not_delivered_no_collection: { label: 'No entregado (sin cobro)', variant: 'destructive' },
};

const paymentLabels: Record<string, string> = {
  cash: 'Efectivo',
  transfer_to_courier: 'Trans. a JS',
  transfer_to_client: 'Trans. Directa',
};

function ActionButtons({
  delivery,
  toggleState,
  onViewDetail,
  onEdit,
  onDelete,
  onReassign,
  onComplete,
  onCorrect,
}: {
  delivery: Delivery;
  toggleState: number;
  onViewDetail?: (d: Delivery) => void;
  onEdit?: (d: Delivery) => void;
  onDelete?: (d: Delivery) => void;
  onReassign?: (d: Delivery) => void;
  onComplete?: (d: Delivery) => void;
  onCorrect?: (d: Delivery) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {toggleState === 1 && (
        <>
          {onViewDetail && (
            <button onClick={() => onViewDetail(delivery)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors" title="Ver detalle">
              <Eye className="w-4 h-4" />
            </button>
          )}
          {onComplete && (
            <button onClick={() => onComplete(delivery)} className="p-2 rounded-lg hover:bg-green-500/10 text-muted-foreground hover:text-green-600 transition-colors" title="Marcar como entregado">
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {onEdit && (
            <button onClick={() => onEdit(delivery)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors" title="Editar pedido">
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(delivery)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Eliminar pedido">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </>
      )}
      {toggleState === 2 && (
        <>
          {onViewDetail && (
            <button onClick={() => onViewDetail(delivery)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors" title="Ver detalle y prueba">
              <Eye className="w-4 h-4" />
            </button>
          )}
          {onCorrect && (
            <button onClick={() => onCorrect(delivery)} className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Corregir entrega">
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </>
      )}
      {toggleState === 3 && (
        <>
          {onViewDetail && (
            <button onClick={() => onViewDetail(delivery)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors" title="Ver detalle">
              <Eye className="w-4 h-4" />
            </button>
          )}
          {onReassign && (
            <button onClick={() => onReassign(delivery)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors" title="Reasignar pedido">
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </>
      )}
    </div>
  );
}

const DomisTab = ({ data, toggleState, busqueda, onViewDetail, onEdit, onDelete, onReassign, onComplete, onCorrect }: DomisTabProps) => {
  const isMobile = useIsMobile();

  if (data.length === 0) {
    if (isMobile) {
      return (
        <div className="text-center text-muted-foreground py-12 text-sm">
          No hay domicilios en esta categoría.
        </div>
      );
    }
    return (
      <tr>
        <td colSpan={8} className="text-center text-muted-foreground py-12 text-sm">
          No hay domicilios en esta categoría.
        </td>
      </tr>
    );
  }

  // Mobile: card layout
  if (isMobile) {
    return (
      <div className="divide-y divide-border">
        {data.map((delivery) => {
          const statusInfo = statusLabels[delivery.status] || { label: delivery.status, variant: 'outline' as const };
          return (
            <div key={delivery.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-foreground truncate">{delivery.client?.name || '—'}</div>
                  {delivery.recipient_name && (
                    <div className="text-xs text-muted-foreground">→ {delivery.recipient_name}</div>
                  )}
                  <div className="text-xs text-muted-foreground mt-0.5">{delivery.courier?.full_name || '—'}</div>
                </div>
                <Badge variant={statusInfo.variant} className="shrink-0 text-[10px]">{statusInfo.label}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground">
                    ${Number(delivery.total_to_collect).toLocaleString('es-CO')}
                  </div>
                  <div className="text-xs text-muted-foreground">{paymentLabels[delivery.payment_method] || delivery.payment_method}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(delivery.created_at), 'dd MMM yyyy', { locale: es })}
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border/50">
                <span className="font-mono text-[10px] text-muted-foreground">{delivery.id.substring(0, 8).toUpperCase()}</span>
                <ActionButtons
                  delivery={delivery}
                  toggleState={toggleState}
                  onViewDetail={onViewDetail}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onReassign={onReassign}
                  onComplete={onComplete}
                  onCorrect={onCorrect}
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
      {data.map((delivery) => {
        const statusInfo = statusLabels[delivery.status] || { label: delivery.status, variant: 'outline' as const };
        return (
          <tr key={delivery.id} className="border-b border-border hover:bg-muted/50 transition-colors">
            <td className="p-4 font-mono text-xs text-muted-foreground">
              {delivery.id.substring(0, 8).toUpperCase()}
            </td>
            <td className="p-4">
              <div className="font-medium text-foreground">{delivery.client?.name || '—'}</div>
              {delivery.recipient_name && (
                <div className="text-xs text-muted-foreground">→ {delivery.recipient_name}</div>
              )}
            </td>
            <td className="p-4 text-sm text-foreground">
              {delivery.courier?.full_name || '—'}
            </td>
            <td className="p-4">
              <div className="font-semibold text-foreground">
                ${Number(delivery.total_to_collect).toLocaleString('es-CO')}
              </div>
              <div className="text-xs text-muted-foreground">{paymentLabels[delivery.payment_method] || delivery.payment_method}</div>
            </td>
            <td className="p-4">
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </td>
            <td className="p-4 text-xs text-muted-foreground">
              {format(new Date(delivery.created_at), 'dd MMM yyyy', { locale: es })}
            </td>
            <td className="p-4">
              <ActionButtons
                delivery={delivery}
                toggleState={toggleState}
                onViewDetail={onViewDetail}
                onEdit={onEdit}
                onDelete={onDelete}
                onReassign={onReassign}
                onComplete={onComplete}
                onCorrect={onCorrect}
              />
            </td>
          </tr>
        );
      })}
    </>
  );
};

export default DomisTab;
