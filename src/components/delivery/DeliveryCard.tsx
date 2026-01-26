import { Delivery } from '@/hooks/useDeliveries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  CreditCard, 
  ArrowLeftRight, 
  Clock, 
  CheckCircle, 
  XCircle,
  Edit,
  Ban,
  Image,
  ClipboardCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface DeliveryCardProps {
  delivery: Delivery;
  onEdit?: (delivery: Delivery) => void;
  onCancel?: (delivery: Delivery) => void;
  onRegister?: (delivery: Delivery) => void;
  showCourier?: boolean;
}

const paymentIcons = {
  cash: DollarSign,
  transfer_to_courier: CreditCard,
  transfer_to_client: ArrowLeftRight,
};

const paymentLabels = {
  cash: 'Efectivo',
  transfer_to_courier: 'Trans. Mensajero',
  transfer_to_client: 'Trans. Directa',
};

const paymentColors = {
  cash: 'bg-cash/10 text-cash',
  transfer_to_courier: 'bg-transfer-courier/10 text-transfer-courier',
  transfer_to_client: 'bg-transfer-client/10 text-transfer-client',
};

const statusConfig = {
  pending: { icon: Clock, label: 'Pendiente', color: 'bg-warning/10 text-warning' },
  completed: { icon: CheckCircle, label: 'Completada', color: 'bg-success/10 text-success' },
  cancelled: { icon: XCircle, label: 'Anulada', color: 'bg-destructive/10 text-destructive' },
};

export function DeliveryCard({ delivery, onEdit, onCancel, onRegister, showCourier }: DeliveryCardProps) {
  const { isAdmin, isCourier } = useAuth();
  const PaymentIcon = paymentIcons[delivery.payment_method];
  const status = statusConfig[delivery.status];
  const StatusIcon = status.icon;

  const isPending = delivery.status === 'pending';
  const showRegisterButton = isCourier && !isAdmin && isPending && onRegister;

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      delivery.status === 'cancelled' && "opacity-60",
      isPending && isCourier && !isAdmin && "border-warning/50 bg-warning/5"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            {/* Client name and status */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground truncate">
                {delivery.client?.name || 'Cliente desconocido'}
              </h3>
              <Badge variant="secondary" className={cn("text-xs", status.color)}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.label}
              </Badge>
            </div>

            {/* Amount and payment method - only show for completed deliveries */}
            {!isPending && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xl font-bold text-foreground">
                  ${Number(delivery.amount).toFixed(2)}
                </span>
                <Badge variant="outline" className={cn("text-xs", paymentColors[delivery.payment_method])}>
                  <PaymentIcon className="w-3 h-3 mr-1" />
                  {paymentLabels[delivery.payment_method]}
                </Badge>
              </div>
            )}

            {/* Meta info */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span>
                {format(new Date(delivery.created_at), "d MMM yyyy, HH:mm", { locale: es })}
              </span>
              {showCourier && delivery.courier && (
                <span className="text-primary font-medium">
                  {delivery.courier.full_name}
                </span>
              )}
              {delivery.receipt_photo_url && (
                <span className="flex items-center gap-1 text-accent">
                  <Image className="w-3 h-3" />
                  Foto
                </span>
              )}
            </div>

            {/* Notes */}
            {delivery.notes && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {delivery.notes}
              </p>
            )}

            {/* Register button for couriers - prominent for pending deliveries */}
            {showRegisterButton && (
              <Button 
                className="w-full mt-2 gradient-primary text-primary-foreground"
                onClick={() => onRegister?.(delivery)}
              >
                <ClipboardCheck className="w-4 h-4 mr-2" />
                Registrar Entrega
              </Button>
            )}
          </div>

          {/* Admin actions */}
          {isAdmin && delivery.status !== 'cancelled' && (
            <div className="flex flex-col gap-1">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={() => onEdit?.(delivery)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => onCancel?.(delivery)}
              >
                <Ban className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
