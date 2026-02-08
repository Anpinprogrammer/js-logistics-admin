import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Package, Building2, UserCheck, DollarSign, CreditCard, ArrowLeftRight } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCouriers } from '@/hooks/useCouriers';
import { getCurrentWeekDates } from '@/hooks/useDeliveries';
import { Client } from '@/hooks/useClients';
import BusquedaCliente from './BusquedaCliente';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Swal from 'sweetalert2';

const paymentMethods = [
  { value: 'cash', label: 'Efectivo', icon: DollarSign },
  { value: 'transfer_to_courier', label: 'Transferencia a JS', icon: CreditCard },
  { value: 'transfer_to_client', label: 'Transferencia Directa', icon: ArrowLeftRight },
] as const;

interface ModalDomisProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalDomis = ({ isOpen, onClose }: ModalDomisProps) => {
  const { user } = useAuth();
  const { data: couriers, isLoading: loadingCouriers } = useCouriers();
  const queryClient = useQueryClient();

  // Client fields
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');

  // Delivery fields
  const [courierId, setCourierId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [totalToCollect, setTotalToCollect] = useState('');
  const [serviceValue, setServiceValue] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer_to_courier' | 'transfer_to_client' | ''>('');
  const [notes, setNotes] = useState('');
  const [alerta, setAlerta] = useState('');

  // Auto-calculate service value (70% of total)
  useEffect(() => {
    const total = parseFloat(totalToCollect);
    if (!isNaN(total) && total > 0) {
      setServiceValue((total * 0.7).toFixed(0));
    }
  }, [totalToCollect]);

  const resetForm = () => {
    setClientId('');
    setClientName('');
    setClientCompany('');
    setClientPhone('');
    setClientAddress('');
    setCourierId('');
    setRecipientName('');
    setTotalToCollect('');
    setServiceValue('');
    setPaymentMethod('');
    setNotes('');
    setAlerta('');
  };

  const handleClientSelect = (client: Client) => {
    setClientId(client.id);
    setClientName(client.name);
    setClientCompany(client.company || '');
    setClientPhone(client.phone || '');
    setClientAddress(client.address || '');
  };

  const createDelivery = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user logged in');
      const { weekStart, weekEnd } = getCurrentWeekDates();

      const totalNum = parseFloat(totalToCollect) || 0;
      const serviceNum = parseFloat(serviceValue) || 0;

      const { data: delivery, error } = await supabase
        .from('deliveries')
        .insert({
          client_id: clientId,
          courier_id: courierId,
          created_by: user.id,
          recipient_name: recipientName || null,
          notes: notes || null,
          week_start: weekStart,
          week_end: weekEnd,
          delivery_date: new Date().toISOString().split('T')[0],
          status: 'pending' as const,
          service_value: serviceNum,
          total_to_collect: totalNum,
          amount: totalNum,
          payment_method: paymentMethod as 'cash' | 'transfer_to_courier' | 'transfer_to_client',
        })
        .select()
        .single();

      if (error) throw error;

      // Audit log
      await supabase.from('delivery_audit_log').insert({
        delivery_id: delivery.id,
        action: 'created',
        changed_by: user.id,
        new_values: delivery as any,
      });

      return delivery;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      Swal.fire({
        title: 'Éxito',
        text: 'Pedido creado exitosamente',
        icon: 'success',
        confirmButtonColor: 'hsl(var(--primary))',
      });
      resetForm();
      onClose();
    },
    onError: (error) => {
      Swal.fire({
        title: 'Error',
        text: 'Error al crear pedido: ' + error.message,
        icon: 'error',
        confirmButtonColor: 'hsl(var(--primary))',
      });
    },
  });

  const handleSave = () => {
    if (!clientId) {
      setAlerta('Selecciona un cliente.');
      return;
    }
    if (!courierId) {
      setAlerta('Selecciona un mensajero.');
      return;
    }
    if (!totalToCollect || parseFloat(totalToCollect) <= 0) {
      setAlerta('Ingresa el valor total a cobrar.');
      return;
    }
    if (!paymentMethod) {
      setAlerta('Selecciona una forma de pago.');
      return;
    }
    setAlerta('');
    createDelivery.mutate();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-4xl p-6 md:p-8 overflow-y-auto max-h-[90vh] border border-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <h2 className="text-2xl font-semibold text-foreground">Crear Nuevo Pedido</h2>
          <button
            className="text-muted-foreground hover:text-foreground transition p-2 hover:bg-muted rounded-lg"
            onClick={() => { onClose(); resetForm(); }}
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Client Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
              <Building2 className="w-5 h-5 text-primary" />
              Datos del Cliente
            </h3>

            <BusquedaCliente onClientSelect={handleClientSelect} />

            <div className="space-y-3">
              <div>
                <Label>Nombre</Label>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nombre del cliente" readOnly className="bg-muted/50" />
              </div>
              <div>
                <Label>Empresa</Label>
                <Input value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} placeholder="Empresa" readOnly className="bg-muted/50" />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="Teléfono" readOnly className="bg-muted/50" />
              </div>
              <div>
                <Label>Dirección de Recogida</Label>
                <Input value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} placeholder="Dirección" readOnly className="bg-muted/50" />
              </div>
            </div>
          </div>

          {/* Delivery Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
              <Package className="w-5 h-5 text-primary" />
              Datos de Entrega
            </h3>

            {/* Courier */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-primary" />
                Mensajero *
              </Label>
              <Select value={courierId} onValueChange={setCourierId}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingCouriers ? "Cargando..." : "Selecciona un mensajero"} />
                </SelectTrigger>
                <SelectContent className="z-[200]">
                  {loadingCouriers ? (
                    <div className="p-2 text-center text-muted-foreground">Cargando...</div>
                  ) : couriers?.length === 0 ? (
                    <div className="p-2 text-center text-muted-foreground">No hay mensajeros</div>
                  ) : (
                    couriers?.map((c) => (
                      <SelectItem key={c.user_id} value={c.user_id}>{c.full_name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Recipient */}
            <div className="space-y-2">
              <Label>Nombre de quien recibe</Label>
              <Input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Nombre del destinatario"
              />
            </div>

            {/* Total to collect */}
            <div className="space-y-2">
              <Label>Valor Total a Cobrar *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  className="pl-9"
                  value={totalToCollect}
                  onChange={(e) => setTotalToCollect(e.target.value)}
                />
              </div>
            </div>

            {/* Service Value (auto-calculated) */}
            <div className="space-y-2">
              <Label>Valor del Servicio (70%)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  className="pl-9 bg-muted/50"
                  value={serviceValue}
                  onChange={(e) => setServiceValue(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">70% mensajero / 30% empresa</p>
            </div>

            {/* Payment method */}
            <div className="space-y-2">
              <Label>Forma de Pago *</Label>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setPaymentMethod(m.value)}
                    className={cn(
                      "p-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1",
                      paymentMethod === m.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <m.icon className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-medium text-center leading-tight">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Instrucciones (opcional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Instrucciones para el mensajero..."
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Alert */}
        {alerta && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-center text-destructive font-medium text-sm">{alerta}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-4 mt-6 justify-end">
          <Button
            variant="outline"
            onClick={() => { onClose(); resetForm(); }}
            disabled={createDelivery.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={createDelivery.isPending}
          >
            {createDelivery.isPending ? 'Creando...' : 'Crear Pedido'}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ModalDomis;
