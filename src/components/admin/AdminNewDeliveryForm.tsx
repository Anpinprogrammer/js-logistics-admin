import { useState, useRef } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClients } from '@/hooks/useClients';
import { useCouriers } from '@/hooks/useCouriers';
import { getCurrentWeekDates } from '@/hooks/useDeliveries';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Loader2, DollarSign, CreditCard, ArrowLeftRight, CheckCircle, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const paymentMethods = [
  { value: 'cash', label: 'Efectivo', icon: DollarSign, color: 'text-cash' },
  { value: 'transfer_to_courier', label: 'Transferencia al Mensajero', icon: CreditCard, color: 'text-transfer-courier' },
  { value: 'transfer_to_client', label: 'Transferencia Directa', icon: ArrowLeftRight, color: 'text-transfer-client' },
] as const;

interface AdminNewDeliveryFormProps {
  onSuccess?: () => void;
}

export function AdminNewDeliveryForm({ onSuccess }: AdminNewDeliveryFormProps) {
  const { data: clients, isLoading: loadingClients } = useClients();
  const { data: couriers, isLoading: loadingCouriers } = useCouriers();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    courier_id: '',
    client_id: '',
    amount: '',
    payment_method: '' as 'cash' | 'transfer_to_courier' | 'transfer_to_client' | '',
    notes: '',
  });
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createDelivery = useMutation({
    mutationFn: async (data: {
      courier_id: string;
      client_id: string;
      amount: number;
      payment_method: 'cash' | 'transfer_to_courier' | 'transfer_to_client';
      notes?: string;
      receipt_photo_url?: string;
    }) => {
      if (!user) throw new Error('No user logged in');
      
      const { weekStart, weekEnd } = getCurrentWeekDates();
      
      const { data: delivery, error } = await supabase
        .from('deliveries')
        .insert({
          ...data,
          created_by: user.id,
          week_start: weekStart,
          week_end: weekEnd,
          delivery_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();
      
      if (error) throw error;
      return delivery;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast.success('Entrega registrada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al registrar entrega: ' + error.message);
    },
  });

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
    if (!formData.courier_id || !formData.client_id || !formData.amount || !formData.payment_method) return;
    
    await createDelivery.mutateAsync({
      courier_id: formData.courier_id,
      client_id: formData.client_id,
      amount: parseFloat(formData.amount),
      payment_method: formData.payment_method,
      notes: formData.notes || undefined,
      receipt_photo_url: photoUrl || undefined,
    });
    
    // Reset form
    setFormData({ courier_id: '', client_id: '', amount: '', payment_method: '', notes: '' });
    setPhotoUrl(null);
    onSuccess?.();
  };

  return (
    <Card className="glass-card animate-slide-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-success" />
          Registrar Entrega (Admin)
        </CardTitle>
        <CardDescription>
          Crea una entrega y asígnala a cualquier mensajero.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Courier selection */}
          <div className="space-y-2">
            <Label htmlFor="courier" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary" />
              Mensajero *
            </Label>
            <Select
              value={formData.courier_id}
              onValueChange={(value) => setFormData({ ...formData, courier_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingCouriers ? "Cargando..." : "Selecciona un mensajero"} />
              </SelectTrigger>
              <SelectContent>
                {couriers?.map((courier) => (
                  <SelectItem key={courier.user_id} value={courier.user_id}>
                    {courier.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Monto *</Label>
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
                    <span>Seleccionar imagen</span>
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
            disabled={createDelivery.isPending || !formData.courier_id || !formData.client_id || !formData.amount || !formData.payment_method}
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
