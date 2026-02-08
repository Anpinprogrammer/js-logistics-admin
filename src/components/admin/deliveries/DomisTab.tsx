import { Delivery } from '@/hooks/useDeliveries';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DomisTabProps {
  data: Delivery[];
  toggleState: number;
  busqueda: string;
}

const statusMap: Record<number, string[]> = {
  1: ['pending'],
  2: ['completed'],
  3: ['cancelled', 'not_delivered_collected', 'not_delivered_no_collection'],
};

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

const DomisTab = ({ data, toggleState, busqueda }: DomisTabProps) => {
  const allowedStatuses = statusMap[toggleState] || [];

  const filtered = data.filter((d) => {
    const matchesStatus = allowedStatuses.includes(d.status);
    if (!matchesStatus) return false;
    if (!busqueda) return true;
    const search = busqueda.toLowerCase();
    return (
      d.client?.name?.toLowerCase().includes(search) ||
      d.courier?.full_name?.toLowerCase().includes(search) ||
      d.id.toLowerCase().includes(search) ||
      d.notes?.toLowerCase().includes(search) ||
      d.recipient_name?.toLowerCase().includes(search)
    );
  });

  if (filtered.length === 0) {
    return (
      <tr>
        <td colSpan={6} className="text-center text-muted-foreground py-12 text-sm">
          No hay domicilios en esta categoría.
        </td>
      </tr>
    );
  }

  return (
    <>
      {filtered.map((delivery) => {
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
          </tr>
        );
      })}
    </>
  );
};

export default DomisTab;
