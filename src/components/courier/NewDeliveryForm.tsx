import { useState, useRef } from 'react';
import { useCreateDelivery } from '@/hooks/useDeliveries';
import { useClients } from '@/hooks/useClients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Loader2, DollarSign, CreditCard, ArrowLeftRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const paymentMethods = [
  { value: 'cash', label: 'Efectivo', icon: DollarSign, color: 'text-cash' },
  { value: 'transfer_to_courier', label: 'Transferencia a JS', icon: CreditCard, color: 'text-transfer-courier' },
  { value: 'transfer_to_client', label: 'Transferencia Directa', icon: ArrowLeftRight, color: 'text-transfer-client' },
] as const;

interface NewDeliveryFormProps {
  onSuccess?: () => void;
}

export function NewDeliveryForm({ onSuccess }: NewDeliveryFormProps) {
  const { data: clients, isLoading: loadingClients } = useClients();
  const createDelivery = useCreateDelivery();
  
  const [formData, setFormData] = useState({
    client_id: '',
    recipient_name: '',
    service_value: '',
    total_to_collect: '',
    payment_method: '' as 'cash' | 'transfer_to_courier' | 'transfer_to_client' | '',
    notes: '',
  });
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Service value is read-only for couriers - they can only set total_to_collect
  const serviceValue = parseFloat(formData.service_value) || 0;

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
    if (!formData.client_id || !formData.total_to_collect || !formData.payment_method) return;
    
    await createDelivery.mutateAsync({
      client_id: formData.client_id,
      recipient_name: formData.recipient_name || undefined,
      service_value: 0, // Couriers cannot set service value - admin will set it later if needed
      total_to_collect: parseFloat(formData.total_to_collect),
      payment_method: formData.payment_method,
      notes: formData.notes || undefined,
      receipt_photo_url: photoUrl || undefined,
    });
    
    // Reset form
    setFormData({ client_id: '', recipient_name: '', service_value: '', total_to_collect: '', payment_method: '', notes: '' });
    setPhotoUrl(null);
    onSuccess?.();
  };

  return (
    <Card className="glass-card animate-slide-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-success" />
          Registrar Entrega
        </CardTitle>
        <CardDescription>
          Registra una nueva entrega. El valor del servicio será asignado por el administrador.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client selection */}
          <div className="space-y-2">
            <Label htmlFor="client">Cliente *</Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => setFormData({ ...formData, client_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingClients ? "Cargando..." : "Selecciona un cliente"} />
              </SelectTrigger>
              <SelectContent>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recipient name */}
          <div className="space-y-2">
            <Label htmlFor="recipient_name">Nombre de quien recibe</Label>
            <Input
              id="recipient_name"
              type="text"
              placeholder="Nombre del destinatario"
              value={formData.recipient_name}
              onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
            />
          </div>

          {/* Info about service value */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
            <AlertTriangle className="w-5 h-5 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">
              El valor del servicio será asignado por el administrador
            </p>
          </div>

          {/* Total to Collect */}
          <div className="space-y-2">
            <Label htmlFor="total_to_collect">Valor Total a Cobrar *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="total_to_collect"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="pl-9"
                value={formData.total_to_collect}
                onChange={(e) => setFormData({ ...formData, total_to_collect: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Payment method */}
          <div className="space-y-3">
            <Label>Forma de Pago *</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, payment_method: method.value })}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2",
                    formData.payment_method === method.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <method.icon className={cn("w-6 h-6", method.color)} />
                  <span className="text-sm font-medium text-center">{method.label}</span>
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
                  className="w-full h-48 object-cover rounded-xl border border-border"
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
                className="w-full h-32 flex flex-col gap-2 border-dashed"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Camera className="w-6 h-6" />
                    <span>Tomar foto o seleccionar</span>
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
              rows={3}
            />
          </div>

          {/* Submit button */}
          <Button 
            type="submit" 
            className="w-full gradient-primary text-primary-foreground"
            disabled={createDelivery.isPending || !formData.client_id || !formData.total_to_collect || !formData.payment_method}
          >
            {createDelivery.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Registrar Entrega
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
