import { createPortal } from 'react-dom';
import { X, Package, User, DollarSign, Calendar, MapPin, CreditCard, FileText, Image } from 'lucide-react';
import { Delivery } from '@/hooks/useDeliveries';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendiente', variant: 'secondary' },
  completed: { label: 'Entregado', variant: 'default' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
  not_delivered_collected: { label: 'No entregado (cobrado)', variant: 'destructive' },
  not_delivered_no_collection: { label: 'No entregado (sin cobro)', variant: 'destructive' },
};

const paymentLabels: Record<string, string> = {
  cash: 'Efectivo',
  transfer_to_courier: 'Transferencia a JS',
  transfer_to_client: 'Transferencia Directa',
};

interface DeliveryDetailModalProps {
  delivery: Delivery | null;
  isOpen: boolean;
  onClose: () => void;
  showProof?: boolean;
}

const DeliveryDetailModal = ({ delivery, isOpen, onClose, showProof = false }: DeliveryDetailModalProps) => {
  const [imageError, setImageError] = useState(false);

  if (!isOpen || !delivery) return null;

  const statusInfo = statusLabels[delivery.status] || { label: delivery.status, variant: 'outline' as const };

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-2xl p-6 md:p-8 overflow-y-auto max-h-[90vh] border border-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold text-foreground">Detalle del Pedido</h2>
              <p className="text-xs text-muted-foreground font-mono">{delivery.id.substring(0, 8).toUpperCase()}</p>
            </div>
          </div>
          <button
            className="text-muted-foreground hover:text-foreground transition p-2 hover:bg-muted rounded-lg"
            onClick={onClose}
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Estado:</span>
            <Badge variant={statusInfo.variant} className="text-sm">{statusInfo.label}</Badge>
          </div>

          {/* Client & Courier */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Cliente</h4>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground">{delivery.client?.name || '—'}</span>
              </div>
              {delivery.client?.phone && (
                <p className="text-sm text-muted-foreground ml-6">{delivery.client.phone}</p>
              )}
            </div>

            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Mensajero</h4>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground">{delivery.courier?.full_name || '—'}</span>
              </div>
            </div>
          </div>

          {/* Recipient */}
          {delivery.recipient_name && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Destinatario:</span>
              <span className="font-medium text-foreground">{delivery.recipient_name}</span>
            </div>
          )}

          {/* Amounts */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <DollarSign className="w-5 h-5 mx-auto text-primary mb-1" />
              <p className="text-xs text-muted-foreground">Total a Cobrar</p>
              <p className="text-lg font-bold text-foreground">${Number(delivery.total_to_collect).toLocaleString('es-CO')}</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <DollarSign className="w-5 h-5 mx-auto text-primary mb-1" />
              <p className="text-xs text-muted-foreground">Valor Servicio</p>
              <p className="text-lg font-bold text-foreground">${Number(delivery.service_value).toLocaleString('es-CO')}</p>
            </div>
            {delivery.received_amount !== null && (
              <div className="bg-muted/50 rounded-xl p-4 text-center">
                <DollarSign className="w-5 h-5 mx-auto text-green-500 mb-1" />
                <p className="text-xs text-muted-foreground">Valor Recibido</p>
                <p className="text-lg font-bold text-green-600">${Number(delivery.received_amount).toLocaleString('es-CO')}</p>
              </div>
            )}
          </div>

          {/* Payment & Date */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Pago:</span>
              <span className="font-medium text-foreground">{paymentLabels[delivery.payment_method] || delivery.payment_method}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Fecha:</span>
              <span className="font-medium text-foreground">{format(new Date(delivery.created_at), 'dd MMM yyyy, HH:mm', { locale: es })}</span>
            </div>
          </div>

          {/* Notes */}
          {delivery.notes && (
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Notas</h4>
              </div>
              <p className="text-foreground text-sm">{delivery.notes}</p>
            </div>
          )}

          {/* Proof of delivery (for completed tab) */}
          {showProof && delivery.status === 'completed' && (
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Image className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Prueba de Entrega</h4>
              </div>
              {delivery.receipt_photo_url && !imageError ? (
                <img
                  src={delivery.receipt_photo_url}
                  alt="Comprobante de entrega"
                  className="rounded-lg max-h-64 w-auto mx-auto border border-border"
                  onError={() => setImageError(true)}
                />
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  {delivery.receipt_photo_url ? 'No se pudo cargar la imagen' : 'Sin comprobante adjunto'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-6 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default DeliveryDetailModal;
