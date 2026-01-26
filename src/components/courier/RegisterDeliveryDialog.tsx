import { useState, useRef } from 'react';
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
import { Camera, Loader2, DollarSign, CreditCard, ArrowLeftRight, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const paymentMethods = [
  { value: 'cash', label: 'Efectivo', icon: DollarSign, color: 'text-cash' },
  { value: 'transfer_to_courier', label: 'Transferencia al Mensajero', icon: CreditCard, color: 'text-transfer-courier' },
  { value: 'transfer_to_client', label: 'Transferencia Directa', icon: ArrowLeftRight, color: 'text-transfer-client' },
] as const;

interface RegisterDeliveryDialogProps {
  delivery: Delivery | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegister: (data: {
    amount: number;
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
    amount: '',
    payment_method: '' as 'cash' | 'transfer_to_courier' | 'transfer_to_client' | '',
    notes: '',
  });
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.payment_method) return;
    
    await onRegister({
      amount: parseFloat(formData.amount),
      payment_method: formData.payment_method,
      notes: formData.notes || undefined,
      receipt_photo_url: photoUrl || undefined,
    });
    
    // Reset form
    setFormData({ amount: '', payment_method: '', notes: '' });
    setPhotoUrl(null);
  };

  const resetForm = () => {
    setFormData({ amount: '', payment_method: '', notes: '' });
    setPhotoUrl(null);
  };

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
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Monto Cobrado *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="pl-9"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
          </div>

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

          {/* Photo upload */}
          <div className="space-y-2">
            <Label>Foto del Comprobante</Label>
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
            disabled={loading || !formData.amount || !formData.payment_method}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Confirmar Entrega
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
