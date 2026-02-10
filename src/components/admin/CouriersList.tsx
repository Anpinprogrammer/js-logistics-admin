import { useState } from 'react';
import { useCouriers } from '@/hooks/useCouriers';
import { useDeliveries, getCurrentWeekDates } from '@/hooks/useDeliveries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Truck, Phone, Package, DollarSign, Loader2, UserPlus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface CourierData {
  user_id: string;
  full_name: string;
  phone?: string | null;
}

function CourierFormDialog({
  open,
  onOpenChange,
  mode,
  courier,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  courier?: CourierData | null;
}) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(courier?.full_name || '');
  const [phone, setPhone] = useState(courier?.phone || '');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setPhone('');
  };

  // Sync state when courier prop changes
  useState(() => {
    if (courier) {
      setFullName(courier.full_name);
      setPhone(courier.phone || '');
    }
  });

  const handleSave = async () => {
    if (mode === 'create' && (!email || !password || !fullName)) {
      toast.error('Email, contraseña y nombre son obligatorios');
      return;
    }
    if (mode === 'create' && password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (mode === 'edit' && !fullName) {
      toast.error('El nombre es obligatorio');
      return;
    }
    if (password && password.length > 0 && password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setSaving(true);
    try {
      if (mode === 'create') {
        const { data, error } = await supabase.functions.invoke('create-courier', {
          body: { email, password, full_name: fullName, phone },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        toast.success(`Mensajero "${fullName}" creado exitosamente`);
      } else {
        const body: any = { user_id: courier!.user_id, full_name: fullName, phone };
        if (password) body.password = password;
        const { data, error } = await supabase.functions.invoke('update-courier', { body });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        toast.success(`Mensajero "${fullName}" actualizado`);
      }

      queryClient.invalidateQueries({ queryKey: ['couriers'] });
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || `Error al ${mode === 'create' ? 'crear' : 'actualizar'} mensajero`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Agregar Mensajero' : 'Editar Mensajero'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Crea una cuenta de mensajero nueva' : 'Modifica los datos del mensajero'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nombre completo *</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nombre del mensajero" />
          </div>
          {mode === 'create' && (
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" />
            </div>
          )}
          <div className="space-y-2">
            <Label>{mode === 'create' ? 'Contraseña *' : 'Nueva contraseña (dejar vacío para no cambiar)'}</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === 'create' ? 'Mínimo 6 caracteres' : '••••••••'} />
          </div>
          <div className="space-y-2">
            <Label>Teléfono (opcional)</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="3001234567" />
          </div>
          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {mode === 'create' ? 'Crear Mensajero' : 'Guardar Cambios'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CouriersList() {
  const { data: couriers, isLoading } = useCouriers();
  const { data: deliveries } = useDeliveries();
  const { weekStart, weekEnd } = getCurrentWeekDates();
  const queryClient = useQueryClient();

  const [addDialog, setAddDialog] = useState(false);
  const [editCourier, setEditCourier] = useState<CourierData | null>(null);
  const [deleteCourier, setDeleteCourier] = useState<CourierData | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteCourier) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-courier', {
        body: { user_id: deleteCourier.user_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Mensajero "${deleteCourier.full_name}" eliminado`);
      queryClient.invalidateQueries({ queryKey: ['couriers'] });
      setDeleteCourier(null);
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar mensajero');
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary" />
            Mensajeros
          </h1>
          <p className="text-muted-foreground">
            Cuadre semanal: {format(new Date(weekStart), 'd MMM', { locale: es })} - {format(new Date(weekEnd), 'd MMM yyyy', { locale: es })}
          </p>
        </div>

        <Button size="sm" onClick={() => setAddDialog(true)}>
          <UserPlus className="w-4 h-4 mr-1" />
          Agregar Mensajero
        </Button>
      </div>

      <CourierFormDialog open={addDialog} onOpenChange={setAddDialog} mode="create" />
      <CourierFormDialog
        open={!!editCourier}
        onOpenChange={(v) => { if (!v) setEditCourier(null); }}
        mode="edit"
        courier={editCourier}
      />

      <AlertDialog open={!!deleteCourier} onOpenChange={(v) => { if (!v) setDeleteCourier(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar mensajero?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente a <strong>{deleteCourier?.full_name}</strong> y su cuenta de acceso. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {couriers?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No hay mensajeros registrados. Usa el botón "Agregar Mensajero" para crear uno.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {couriers?.map((courier) => {
            const courierDeliveries = deliveries?.filter(
              d => d.courier_id === courier.user_id &&
                   (d.status === 'completed' || d.status === 'not_delivered_collected') &&
                   d.week_start === weekStart
            ) || [];

            const stats = {
              total: courierDeliveries.length,
              cash: courierDeliveries
                .filter(d => d.payment_method === 'cash')
                .reduce((sum, d) => sum + Number(d.amount), 0),
              transferCourier: courierDeliveries
                .filter(d => d.payment_method === 'transfer_to_courier')
                .reduce((sum, d) => sum + Number(d.amount), 0),
              transferClient: courierDeliveries
                .filter(d => d.payment_method === 'transfer_to_client')
                .reduce((sum, d) => sum + Number(d.amount), 0),
            };

            return (
              <Card key={courier.user_id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{courier.full_name}</CardTitle>
                      {courier.phone && (
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" />
                          {courier.phone}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditCourier({
                          user_id: courier.user_id,
                          full_name: courier.full_name,
                          phone: courier.phone,
                        })}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteCourier({
                          user_id: courier.user_id,
                          full_name: courier.full_name,
                          phone: courier.phone,
                        })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="w-4 h-4" />
                      Entregas
                    </span>
                    <span className="font-semibold">{stats.total}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-cash/5 border border-cash/20">
                    <span className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-cash" />
                      Efectivo a entregar
                    </span>
                    <span className="font-bold text-cash">${stats.cash.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-transfer-courier/5">
                    <span className="text-sm text-muted-foreground">Trans. JS</span>
                    <span className="font-medium">${stats.transferCourier.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-transfer-client/5">
                    <span className="text-sm text-muted-foreground">Trans. Cliente</span>
                    <span className="font-medium">${stats.transferClient.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
