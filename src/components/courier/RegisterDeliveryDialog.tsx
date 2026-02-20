import { useState, useRef, useEffect } from 'react';
import { Delivery } from '@/hooks/useDeliveries';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Camera, Loader2, DollarSign, CreditCard, ArrowLeftRight, CheckCircle, AlertTriangle, XCircle, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

type DeliveryFinalStatus = 'completed' | 'not_delivered_collected' | 'not_delivered_no_collection';

const deliveryStatuses = [
  { value: 'completed' as DeliveryFinalStatus, label: 'Entregado', icon: CheckCircle, color: 'text-success' },
  { value: 'not_delivered_collected' as DeliveryFinalStatus, label: 'No entregado (con cobro)', icon: Package, color: 'text-warning' },
  { value: 'not_delivered_no_collection' as DeliveryFinalStatus, label: 'No entregado (sin cobro)', icon: XCircle, color: 'text-destructive' },
] as const;

const paymentMethods = [
  { value: 'cash', label: 'Efectivo', icon: DollarSign, color: 'text-cash' },
  { value: 'transfer_to_courier', label: 'Transferencia a JS', icon: CreditCard, color: 'text-transfer-courier' },
  { value: 'transfer_to_client', label: 'Transferencia Directa', icon: ArrowLeftRight, color: 'text-transfer-client' },
] as const;

interface RegisterDeliveryDialogProps {
  delivery: Delivery | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegister: (data: {
    final_status: DeliveryFinalStatus;
    received_amount: number;
    payment_method: 'cash' | 'transfer_to_courier' | 'transfer_to_client';
    notes?: string;
    receipt_photo_url?: string;
  }) => Promise<void>;
  loading?: boolean;
}

export function RegisterDeliveryDialog({
  delivery,
  open,
  onOpenChange,
  onRegister,
  loading,
}: RegisterDeliveryDialogProps) {
  
  const [formData, setFormData] = useState({
    final_status: '' as DeliveryFinalStatus | '',
    received_amount: '',
    payment_method: '' as 'cash' | 'transfer_to_courier' | 'transfer_to_client' | '',
    notes: '',
  });
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (delivery && open) {
      setFormData({
        final_status: '',
        received_amount: '',
        payment_method: '',
        notes: '',
      });
      setPhotoUrl(null);
    }
  }, [delivery, open]);

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `receipts/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath);
      
      setPhotoUrl(publicUrl);
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setUploading(false);
    }
  };

  // Only "completed" needs payment info - "not_delivered_collected" means no money was collected
  const needsPaymentInfo = formData.final_status === 'completed';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.final_status) return;
    
    // For statuses that require payment info
    if (needsPaymentInfo && (!formData.received_amount || !formData.payment_method)) return;
    
    await onRegister({
      final_status: formData.final_status,
      received_amount: needsPaymentInfo ? parseFloat(formData.received_amount) : 0,
      payment_method: (needsPaymentInfo && formData.payment_method) ? formData.payment_method : 'cash',
      notes: formData.notes || undefined,
      receipt_photo_url: photoUrl || undefined,
    });
    
    // Reset form
    setFormData({ final_status: '', received_amount: '', payment_method: '', notes: '' });
    setPhotoUrl(null);
  };

  const resetForm = () => {
    setFormData({ final_status: '', received_amount: '', payment_method: '', notes: '' });
    setPhotoUrl(null);
  };

  // Calculate difference for warning
  const totalToCollect = delivery?.total_to_collect || 0;
  const receivedAmount = parseFloat(formData.received_amount) || 0;
  const difference = totalToCollect - receivedAmount;
  const hasDifference = needsPaymentInfo && formData.received_amount && difference > 0;
  const differenceDirectTransfer = Number(delivery?.service_value || 0) - receivedAmount;
  const hasDifferenceDirectTransfer = needsPaymentInfo && formData.received_amount && differenceDirectTransfer > 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            Registrar Entrega
          </DialogTitle>
          <DialogDescription>
            Completa los datos de la entrega a <strong>{delivery?.client?.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Read-only info from admin */}
          <div className="space-y-3 p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Datos del pedido (solo lectura)</p>
            
            {delivery?.recipient_name && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Destinatario:</span>
                <span className="font-medium">{delivery.recipient_name}</span>
              </div>
            )}
            
            {delivery && Number(delivery.service_value) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor del servicio:</span>
                <span className="font-medium">${Number(delivery.service_value).toFixed(2)}</span>
              </div>
            )}
            
            {delivery && Number(delivery.total_to_collect) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor a cobrar:</span>
                <span className="font-medium text-primary">${Number(delivery.total_to_collect).toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Status selection */}
          <div className="space-y-3">
            <Label>Estado de la Entrega *</Label>
            <div className="grid grid-cols-1 gap-2">
              {deliveryStatuses.map((status) => (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, final_status: status.value, received_amount: '', payment_method: '' })}
                  className={cn(
                    "p-3 rounded-xl border-2 transition-all duration-200 flex items-center gap-3",
                    formData.final_status === status.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <status.icon className={cn("w-5 h-5", status.color)} />
                  <span className="text-sm font-medium">{status.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payment fields - only show if status requires payment */}
          {needsPaymentInfo && (
            <>
              {/* Payment method */}
              <div className="space-y-3">
                <Label>Forma de Pago *</Label>
                <div className="grid grid-cols-1 gap-2">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, payment_method: method.value })}
                      className={cn(
                        "p-3 rounded-xl border-2 transition-all duration-200 flex items-center gap-3",
                        formData.payment_method === method.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <method.icon className={cn("w-5 h-5", method.color)} />
                      <span className="text-sm font-medium">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Received Amount */}
              <div className="space-y-2">
                <Label htmlFor="received_amount">Valor Recibido en Destino *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="received_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="pl-9"
                    value={formData.received_amount}
                    onChange={(e) => setFormData({ ...formData, received_amount: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Difference Warning */}
              {formData.payment_method === 'transfer_to_client' ?
                hasDifferenceDirectTransfer && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30">
                  <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-warning">Faltante detectado: ${differenceDirectTransfer.toFixed(2)}</p>
                    <p className="text-muted-foreground">Registra unicamente el valor a cobrar por el servicio</p>
                  </div>
                </div>
                )
                :
                hasDifference && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30">
                  <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-warning">Faltante detectado: ${difference.toFixed(2)}</p>
                    <p className="text-muted-foreground">Se registrará automáticamente como adelanto de sueldo</p>
                  </div>
                </div>
              )}

              
              
            </>
          )}

          {/* Photo upload */}
          <div className="space-y-2">
            <Label>Foto del Comprobante {needsPaymentInfo ? '' : '(opcional)'}</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoCapture}
            />
            
            {photoUrl ? (
              <div className="relative">
                <img 
                  src={photoUrl} 
                  alt="Comprobante" 
                  className="w-full h-32 object-cover rounded-xl border border-border"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-2 right-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Cambiar
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full h-24 flex flex-col gap-2 border-dashed"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    <span className="text-sm">Tomar foto o seleccionar</span>
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Observaciones adicionales..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          {/* Submit button */}
          <Button 
            type="submit" 
            className="w-full gradient-primary text-primary-foreground"
            disabled={loading || !formData.final_status || (needsPaymentInfo && (!formData.received_amount || !formData.payment_method))}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Confirmar Registro
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
