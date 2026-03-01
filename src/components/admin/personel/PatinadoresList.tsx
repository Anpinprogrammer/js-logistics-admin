import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, PlusCircle, Pencil, Trash2, X,
  AlertTriangle, Warehouse, Phone, User,
  Mail, Lock, Eye, EyeOff, PackageCheck,
  Clock, Package,
} from 'lucide-react';
import { usePickers, Picker } from '@/hooks/usePickers';
import { usePickups } from '@/hooks/usePickups';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { getCurrentWeekDates } from '@/hooks/useDeliveries';
import api from '@/services/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────
// Create Modal
// ─────────────────────────────────────────────
const CreatePickerModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [alerta, setAlerta] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setFullName(''); setEmail(''); setPhone('');
    setPassword(''); setAlerta(''); setShowPassword(false);
  };

  const handleSave = async () => {
    if (!fullName.trim()) { setAlerta('El nombre es requerido.'); return; }
    if (!email.trim()) { setAlerta('El email es requerido.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setAlerta('El email no es válido.'); return; }
    if (password.length < 6) { setAlerta('La contraseña debe tener al menos 6 caracteres.'); return; }
    setAlerta('');
    setSaving(true);
    try {
      await api.post('/pickers', { full_name: fullName, email, phone: phone || undefined, password });
      queryClient.invalidateQueries({ queryKey: ['pickers'] });
      toast.success(`Patinador "${fullName}" creado exitosamente`);
      reset();
      onClose();
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Error al crear patinador';
      setAlerta(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-md p-6 md:p-8 border border-border">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div className="flex items-center gap-3">
            <Warehouse className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Nuevo Patinador</h2>
          </div>
          <button className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-lg transition" onClick={() => { reset(); onClose(); }} type="button">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" />Nombre completo *</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nombre del patinador" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" />Email *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="patinador@empresa.com" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" />Teléfono</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Número de contacto (opcional)" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Lock className="w-4 h-4 text-muted-foreground" />Contraseña *</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="pr-10"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {alerta && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-center text-destructive font-medium text-sm">{alerta}</p>
          </div>
        )}

        <div className="flex gap-3 mt-6 justify-end">
          <Button variant="outline" onClick={() => { reset(); onClose(); }} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Creando...' : 'Crear Patinador'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─────────────────────────────────────────────
// Edit Modal
// ─────────────────────────────────────────────
const EditPickerModal = ({ picker, isOpen, onClose }: { picker: Picker | null; isOpen: boolean; onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [alerta, setAlerta] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (picker) {
      setFullName(picker.full_name);
      setPhone(picker.phone || '');
      setPassword('');
      setAlerta('');
      setShowPassword(false);
    }
  }, [picker]);

  const handleSave = async () => {
    if (!picker) return;
    if (!fullName.trim()) { setAlerta('El nombre es requerido.'); return; }
    if (password && password.length < 6) { setAlerta('La contraseña debe tener al menos 6 caracteres.'); return; }
    setAlerta('');
    setSaving(true);
    try {
      await api.put(`/pickers/${picker.user_id}`, { full_name: fullName, phone: phone || undefined, password: password || undefined });
      queryClient.invalidateQueries({ queryKey: ['pickers'] });
      toast.success(`Patinador "${fullName}" actualizado`);
      onClose();
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Error al actualizar patinador';
      setAlerta(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !picker) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-md p-6 md:p-8 border border-border">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div className="flex items-center gap-3">
            <Pencil className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold text-foreground">Editar Patinador</h2>
              <p className="text-xs text-muted-foreground">{picker.full_name}</p>
            </div>
          </div>
          <button className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-lg transition" onClick={onClose} type="button">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" />Nombre completo *</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nombre del patinador" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" />Teléfono</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Número de contacto (opcional)" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-muted-foreground" />
              Nueva contraseña
              <span className="text-xs text-muted-foreground font-normal">(dejar en blanco para no cambiar)</span>
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="pr-10"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {alerta && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-center text-destructive font-medium text-sm">{alerta}</p>
          </div>
        )}

        <div className="flex gap-3 mt-6 justify-end">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─────────────────────────────────────────────
// Delete Modal
// ─────────────────────────────────────────────
const DeletePickerModal = ({ picker, isOpen, onClose }: { picker: Picker | null; isOpen: boolean; onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!picker) return;
    setDeleting(true);
    try {
      await api.delete(`/pickers/${picker.user_id}`);
      queryClient.invalidateQueries({ queryKey: ['pickers'] });
      toast.success(`Patinador "${picker.full_name}" eliminado`);
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar patinador');
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen || !picker) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-md p-6 md:p-8 border border-border">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-destructive" />
            <h2 className="text-xl font-semibold text-foreground">Eliminar Patinador</h2>
          </div>
          <button className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-lg transition" onClick={onClose} type="button">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 space-y-1">
          <p className="text-sm text-foreground">
            ¿Estás seguro de eliminar al patinador <span className="font-bold">{picker.full_name}</span>?
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Las recogidas asignadas a este patinador quedarán sin asignar. Esta acción no se puede deshacer.
          </p>
        </div>

        <div className="flex gap-3 mt-6 justify-end">
          <Button variant="outline" onClick={onClose} disabled={deleting}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─────────────────────────────────────────────
// Stat Row
// ─────────────────────────────────────────────
function StatRow({ icon: Icon, label, value, highlight }: {
  icon: React.ElementType;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      'flex items-center justify-between px-3 py-2 rounded-lg',
      highlight ? 'bg-primary/8 border border-primary/15' : 'bg-muted/50'
    )}>
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className={cn('w-4 h-4', highlight ? 'text-primary' : 'text-muted-foreground')} />
        {label}
      </span>
      <span className={cn('font-bold text-sm', highlight ? 'text-primary' : 'text-foreground')}>
        {value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
const PatinadoresList = () => {
  const isMobile = useIsMobile();
  const { data: pickers, isLoading, error } = usePickers();
  const { data: pickups } = usePickups();

  const [busqueda, setBusqueda] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editPicker, setEditPicker] = useState<Picker | null>(null);
  const [deletePicker, setDeletePicker] = useState<Picker | null>(null);

  const { weekStart, weekEnd } = getCurrentWeekDates();

  const filtered = useMemo(() => {
    if (!pickers) return [];
    if (!busqueda) return pickers;
    const s = busqueda.toLowerCase();
    return pickers.filter(
      (p) =>
        p.full_name.toLowerCase().includes(s) ||
        (p.phone?.toLowerCase().includes(s) ?? false)
    );
  }, [pickers, busqueda]);

  // Compute per-picker pickup stats
  const pickerStats = useMemo(() => {
    const map = new Map<string, { completed: number; pending: number; thisWeek: number }>();
    if (!pickups) return map;

    for (const pickup of pickups) {
      if (!pickup.courier_id) continue;
      const current = map.get(pickup.courier_id) ?? { completed: 0, pending: 0, thisWeek: 0 };

      if (pickup.status === 'picked_up') {
        current.completed += 1;
        const pickupDate = pickup.pickup_date?.split('T')[0];
        if (pickupDate >= weekStart && pickupDate <= weekEnd) {
          current.thisWeek += 1;
        }
      } else {
        current.pending += 1;
      }

      map.set(pickup.courier_id, current);
    }
    return map;
  }, [pickups, weekStart, weekEnd]);

  return (
    <div className="p-4 md:p-6 text-foreground">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-start md:gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-primary" />
            Patinadores
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pickers?.length ?? 0} patinador{(pickers?.length ?? 0) !== 1 ? 'es' : ''} registrado{(pickers?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl px-4 md:px-5 py-2.5 md:py-3 shadow-sm transition-all cursor-pointer text-sm md:text-base shrink-0"
          onClick={() => setCreateOpen(true)}
        >
          <PlusCircle className="w-5 h-5" />
          {isMobile ? 'Nuevo' : 'Agregar Patinador'}
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center w-full md:w-96 bg-background rounded-xl shadow-sm border border-border focus-within:ring-2 focus-within:ring-primary transition-all mb-6">
        <Search className="w-5 h-5 ml-3 text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="Buscar por nombre o teléfono..."
          className="w-full py-2.5 px-3 bg-transparent outline-none text-sm text-foreground placeholder-muted-foreground"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
          </div>
        </div>
      ) : error ? (
        <div className="text-center text-destructive py-12 text-sm">
          Error al cargar los patinadores. Por favor, intenta de nuevo.
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-background rounded-xl border border-border flex flex-col items-center justify-center py-16 text-center px-4">
          <Warehouse className="w-12 h-12 text-muted-foreground/20 mb-3" />
          <p className="font-semibold text-muted-foreground">
            {busqueda ? 'Sin resultados' : 'No hay patinadores registrados'}
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {busqueda ? 'Intenta con otro nombre o teléfono' : 'Usa el botón para agregar el primero'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((picker) => {
            const stats = pickerStats.get(picker.user_id) ?? { completed: 0, pending: 0, thisWeek: 0 };
            const initial = picker.full_name.charAt(0).toUpperCase();

            return (
              <div key={picker.user_id} className="bg-background rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow flex flex-col">
                {/* Card header */}
                <div className="p-4 flex items-start justify-between gap-3 border-b border-border">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0">
                      <span className="text-violet-600 font-bold text-sm">{initial}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{picker.full_name}</p>
                      {picker.phone ? (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          {picker.phone}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground/40 mt-0.5">Sin teléfono</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditPicker(picker)}
                      className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletePicker(picker)}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="p-4 space-y-2 flex-1">
                  <StatRow icon={PackageCheck} label="Completadas esta semana" value={stats.thisWeek} highlight />
                  <StatRow icon={Package} label="Total completadas" value={stats.completed} />
                  <StatRow icon={Clock} label="Pendientes" value={stats.pending} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <CreatePickerModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      <EditPickerModal picker={editPicker} isOpen={!!editPicker} onClose={() => setEditPicker(null)} />
      <DeletePickerModal picker={deletePicker} isOpen={!!deletePicker} onClose={() => setDeletePicker(null)} />
    </div>
  );
};

export default PatinadoresList;
