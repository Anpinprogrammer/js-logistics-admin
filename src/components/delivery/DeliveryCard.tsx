import { Delivery } from '@/hooks/useDeliveries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  ClipboardCheck,
  AlertTriangle,
  Package,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

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
  transfer_to_courier: 'Trans. JS',
  transfer_to_client: 'Trans. Directa',
};

const paymentColors = {
  cash: 'bg-cash/10 text-cash',
  transfer_to_courier: 'bg-transfer-courier/10 text-transfer-courier',
  transfer_to_client: 'bg-transfer-client/10 text-transfer-client',
};

const statusConfig = {
  pending: { icon: Clock, label: 'Pendiente', color: 'bg-warning/10 text-warning' },
  completed: { icon: CheckCircle, label: 'Entregado', color: 'bg-success/10 text-success' },
  not_delivered_collected: { icon: Package, label: 'Ida Perdida', color: 'bg-warning/10 text-warning' },
  not_delivered_no_collection: { icon: XCircle, label: 'No entregado', color: 'bg-destructive/10 text-destructive' },
  cancelled: { icon: XCircle, label: 'Anulada', color: 'bg-destructive/10 text-destructive' },
} as const;

export function DeliveryCard({ delivery, onEdit, onCancel, onRegister, showCourier }: DeliveryCardProps) {
  const { isAdmin, isCourier } = useAuth();
  const [showPhoto, setShowPhoto] = useState(false);
  const PaymentIcon = paymentIcons[delivery.payment_method];
  const status = statusConfig[delivery.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;

  const isPending = delivery.status === 'pending';
  const showRegisterButton = isCourier && !isAdmin && isPending && onRegister;

  // Calculate difference for display
  const totalToCollect = delivery.total_to_collect || delivery.amount || 0;
  const receivedAmount = delivery.received_amount || 0;
  const difference = totalToCollect - receivedAmount;
  const hasDifference = delivery.received_amount !== null && difference > 0;

  return (
    <>
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

              {/* Recipient name if different from client */}
              {delivery.recipient_name && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Destinatario:</span> {delivery.recipient_name}
                </p>
              )}

              {/* Financial details - only show for non-pending deliveries */}
              {!isPending && (
                <div className="space-y-1">
                  {/* Service value */}
                  {delivery.service_value > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Valor servicio:</span>
                      <span className="font-medium">${Number(delivery.service_value).toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground">(70% mensajero)</span>
                    </div>
                  )}
                  
                  {/* Total to collect and received */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm">A cobrar:</span>
                      <span className="text-lg font-bold text-foreground">
                        ${Number(totalToCollect).toFixed(2)}
                      </span>
                    </div>
                    
                    {delivery.received_amount !== null && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">Recibido:</span>
                        <span className={cn(
                          "text-lg font-bold",
                          hasDifference ? "text-warning" : "text-success"
                        )}>
                          ${Number(receivedAmount).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Difference warning */}
                  {hasDifference && (
                    <div className="flex items-center gap-1 text-xs text-warning">
                      <AlertTriangle className="w-3 h-3" />
                      Faltante: ${difference.toFixed(2)} (adelanto)
                    </div>
                  )}

                  {/* Payment method */}
                  <Badge variant="outline" className={cn("text-xs mt-1", paymentColors[delivery.payment_method])}>
                    <PaymentIcon className="w-3 h-3 mr-1" />
                    {paymentLabels[delivery.payment_method]}
                  </Badge>
                </div>
              )}

              {/* Pending delivery - show what's known */}
              {isPending && (
                <div className="space-y-1">
                  {delivery.service_value > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Valor servicio:</span>
                      <span className="font-medium">${Number(delivery.service_value).toFixed(2)}</span>
                    </div>
                  )}
                  {delivery.total_to_collect > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">A cobrar:</span>
                      <span className="font-medium">${Number(delivery.total_to_collect).toFixed(2)}</span>
                    </div>
                  )}
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-accent hover:text-accent"
                    onClick={() => setShowPhoto(true)}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Ver Foto
                  </Button>
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

            {/* Actions */}
            {delivery.status !== 'cancelled' && (onEdit || onCancel) && (
              <div className="flex flex-col gap-1">
                {onEdit && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => onEdit?.(delivery)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                {onCancel && isAdmin && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onCancel?.(delivery)}
                  >
                    <Ban className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Photo Dialog */}
      <Dialog open={showPhoto} onOpenChange={setShowPhoto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              Comprobante de Entrega
            </DialogTitle>
          </DialogHeader>
          {delivery.receipt_photo_url && (
            <div className="flex justify-center">
              <img 
                src={delivery.receipt_photo_url} 
                alt="Comprobante de entrega"
                className="max-w-full max-h-[70vh] rounded-lg object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
