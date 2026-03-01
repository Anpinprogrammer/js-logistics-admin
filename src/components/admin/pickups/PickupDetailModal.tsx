import { createPortal } from 'react-dom';
import { X, Package, User, Phone, MapPin, FileText, Calendar, Truck, Clock } from 'lucide-react';
import { Pickup } from '@/hooks/usePickups';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending_pickup: { label: 'Por Recoger', variant: 'secondary' },
  picked_up: { label: 'Recogido', variant: 'default' },
};

interface PickupDetailModalProps {
  pickup: Pickup | null;
  isOpen: boolean;
  onClose: () => void;
}

const PickupDetailModal = ({ pickup, isOpen, onClose }: PickupDetailModalProps) => {
  if (!isOpen || !pickup) return null;

  const statusInfo = statusLabels[pickup.status] || { label: pickup.status, variant: 'outline' as const };

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-2xl p-6 md:p-8 overflow-y-auto max-h-[90vh] border border-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold text-foreground">Detalle de Recogida</h2>
              <p className="text-xs text-muted-foreground font-mono">{pickup.id.substring(0, 8).toUpperCase()}</p>
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

          {/* Company & Courier */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Empresa / Cliente</h4>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground">
                  {pickup.client?.company || pickup.client?.name || '—'}
                </span>
              </div>
              {pickup.client?.company && (
                <p className="text-sm text-muted-foreground ml-6">{pickup.client.name}</p>
              )}
              {pickup.client?.phone && (
                <p className="text-sm text-muted-foreground ml-6">{pickup.client.phone}</p>
              )}
            </div>

            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Mensajero</h4>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground">
                  {pickup.courier?.full_name || <span className="text-muted-foreground italic">Sin asignar</span>}
                </span>
              </div>
            </div>
          </div>

          {/* Contact */}
          {(pickup.contact_name || pickup.contact_phone) && (
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contacto</h4>
              {pickup.contact_name && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{pickup.contact_name}</span>
                </div>
              )}
              {pickup.contact_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{pickup.contact_phone}</span>
                </div>
              )}
            </div>
          )}

          {/* Address */}
          {pickup.address && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <span className="text-sm text-muted-foreground">Dirección: </span>
                <span className="text-sm font-medium text-foreground">{pickup.address}</span>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Fecha programada:</span>
              <span className="font-medium text-foreground">
                {format(new Date(pickup.pickup_date + 'T00:00:00'), 'dd MMM yyyy', { locale: es })}
              </span>
            </div>
            {pickup.picked_up_at && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-500" />
                <span className="text-muted-foreground">Recogido el:</span>
                <span className="font-medium text-green-600">
                  {format(new Date(pickup.picked_up_at), 'dd MMM yyyy, HH:mm', { locale: es })}
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          {pickup.notes && (
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Notas</h4>
              </div>
              <p className="text-foreground text-sm">{pickup.notes}</p>
            </div>
          )}

          {/* Created at */}
          <p className="text-xs text-muted-foreground">
            Registrado el {format(new Date(pickup.created_at), 'dd MMM yyyy, HH:mm', { locale: es })}
          </p>
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

export default PickupDetailModal;
