import { useState, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClients } from '@/hooks/useClients';
import { useCouriersTest } from '@/hooks/useCouriers';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Package, UserCheck, Users, DollarSign, CreditCard, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const paymentMethods = [
  { value: 'cash', label: 'Efectivo', icon: DollarSign, color: 'text-cash' },
  { value: 'transfer_to_courier', label: 'Transferencia a JS', icon: CreditCard, color: 'text-transfer-courier' },
  { value: 'transfer_to_client', label: 'Transferencia Directa', icon: ArrowLeftRight, color: 'text-transfer-client' },
] as const;

interface DeliveryInfoProps {
  onSuccess?: () => void;
  deliveryFormData: {
    courierId: string;
    recipientName: string;
    totalToCollect: string;
    paymentMethod: string;
    notes: string;
  };
  setDeliveryFormData: React.Dispatch<React.SetStateAction<{
    courierId: string;
    recipientName: string;
    totalToCollect: string;
    paymentMethod: string;
    notes: string;
  }>>;
}

export function DeliveryInfo({ onSuccess, deliveryFormData, setDeliveryFormData }: DeliveryInfoProps) {
  const { data: couriers, isLoading: loadingCouriers } = useCouriersTest();
  
  
  

  return (
    <Card className="glass-card animate-slide-up max-w-xl h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          Datos de Entrega
        </CardTitle>
        <CardDescription>
          Asigna un pedido a un mensajero con todos los valores definidos. El mensajero registrará el valor recibido.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6">
          {/* Courier selection */}
          <div className="space-y-2">
            <Label htmlFor="courier" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary" />
              Mensajero *
            </Label>
            <Select
              value={deliveryFormData.courierId}
              onValueChange={(value) => setDeliveryFormData({ ...deliveryFormData, courierId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingCouriers ? "Cargando..." : (couriers?.length === 0 ? "No hay mensajeros" : "Selecciona un mensajero")} />
              </SelectTrigger>
              <SelectContent className="z-[200]">
                {loadingCouriers ? (
                  <div className="p-2 text-center text-muted-foreground">Cargando...</div>
                ) : couriers?.length === 0 ? (
                  <div className="p-2 text-center text-muted-foreground">No hay mensajeros disponibles</div>
                ) : (
                  couriers?.map((courier) => (
                    <SelectItem key={courier.user_id} value={courier.user_id}>
                      {courier.full_name}
                    </SelectItem>
                  ))
                )}
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
              value={deliveryFormData.recipientName}
              onChange={(e) => setDeliveryFormData({ ...deliveryFormData, recipientName: e.target.value })}
            />
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
                value={deliveryFormData.totalToCollect}
                onChange={(e) => setDeliveryFormData({ ...deliveryFormData, totalToCollect: e.target.value })}
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
                  onClick={() => setDeliveryFormData({ ...deliveryFormData, paymentMethod: method.value })}
                  className={cn(
                    "p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2",
                    deliveryFormData.paymentMethod === method.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <method.icon className={cn("w-5 h-5", method.color)} />
                  <span className="text-xs font-medium text-center">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Instrucciones (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Instrucciones para el mensajero..."
              value={deliveryFormData.notes}
              onChange={(e) => setDeliveryFormData({ ...deliveryFormData, notes: e.target.value })}
              rows={3}
            />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
