import { Delivery } from '@/hooks/useDeliveries';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye, Pencil, Trash2, RefreshCw } from 'lucide-react';

interface DomisTabProps {
  data: Delivery[];
  toggleState: number;
  busqueda: string;
  onViewDetail?: (delivery: Delivery) => void;
  onEdit?: (delivery: Delivery) => void;
  onDelete?: (delivery: Delivery) => void;
  onReassign?: (delivery: Delivery) => void;
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

const DomisTab = ({ data, toggleState, busqueda, onViewDetail, onEdit, onDelete, onReassign }: DomisTabProps) => {
  if (data.length === 0) {
    return (
      <tr>
        <td colSpan={7} className="text-center text-muted-foreground py-12 text-sm">
          No hay domicilios en esta categoría.
        </td>
      </tr>
    );
  }

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
              <div className="flex items-center gap-1">
                {/* Tab 1: Pending → View, Edit, Delete */}
                {toggleState === 1 && (
                  <>
                    {onViewDetail && (
                      <button
                        onClick={() => onViewDetail(delivery)}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(delivery)}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                        title="Editar pedido"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(delivery)}
                        className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Eliminar pedido"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}

                {/* Tab 2: Completed → View detail with proof */}
                {toggleState === 2 && onViewDetail && (
                  <button
                    onClick={() => onViewDetail(delivery)}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                    title="Ver detalle y prueba"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}

                {/* Tab 3: Rejected → Reassign */}
                {toggleState === 3 && (
                  <>
                    {onViewDetail && (
                      <button
                        onClick={() => onViewDetail(delivery)}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    {onReassign && (
                      <button
                        onClick={() => onReassign(delivery)}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                        title="Reasignar pedido"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </td>
          </tr>
        );
      })}
    </>
  );
};

export default DomisTab;
