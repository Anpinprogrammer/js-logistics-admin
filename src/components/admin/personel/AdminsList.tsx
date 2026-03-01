import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, PlusCircle, Pencil, Trash2, X,
  AlertTriangle, ShieldCheck, Eye, EyeOff,
  Mail, Phone, User, Lock,
} from 'lucide-react';
import { useAdmins, useCreateAdmin, useUpdateAdmin, useDeleteAdmin, Admin } from '@/hooks/useAdmins';
import { useAuth } from '@/contexts/AuthContextTest';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ─────────────────────────────────────────────
// Create Modal
// ─────────────────────────────────────────────
const CreateAdminModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const createAdmin = useCreateAdmin();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [alerta, setAlerta] = useState('');

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
    try {
      await createAdmin.mutateAsync({ full_name: fullName, email, phone: phone || undefined, password });
      reset();
      onClose();
    } catch { /* handled by hook */ }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-md p-6 md:p-8 border border-border">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Nuevo Administrador</h2>
          </div>
          <button className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-lg transition" onClick={() => { reset(); onClose(); }} type="button">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" />Nombre completo *</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nombre del administrador" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" />Email *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@empresa.com" />
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
          <Button variant="outline" onClick={() => { reset(); onClose(); }} disabled={createAdmin.isPending}>Cancelar</Button>
          <Button onClick={handleSave} disabled={createAdmin.isPending}>
            {createAdmin.isPending ? 'Creando...' : 'Crear Administrador'}
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
const EditAdminModal = ({ admin, isOpen, onClose }: { admin: Admin | null; isOpen: boolean; onClose: () => void }) => {
  const updateAdmin = useUpdateAdmin();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [alerta, setAlerta] = useState('');

  useEffect(() => {
    if (admin) {
      setFullName(admin.full_name);
      setPhone(admin.phone || '');
      setPassword('');
      setAlerta('');
      setShowPassword(false);
    }
  }, [admin]);

  const handleSave = async () => {
    if (!admin) return;
    if (!fullName.trim()) { setAlerta('El nombre es requerido.'); return; }
    if (password && password.length < 6) { setAlerta('La contraseña debe tener al menos 6 caracteres.'); return; }
    setAlerta('');
    try {
      await updateAdmin.mutateAsync({ id: admin.id, full_name: fullName, phone: phone || undefined, password: password || undefined });
      onClose();
    } catch { /* handled by hook */ }
  };

  if (!isOpen || !admin) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-md p-6 md:p-8 border border-border">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div className="flex items-center gap-3">
            <Pencil className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold text-foreground">Editar Administrador</h2>
              <p className="text-xs text-muted-foreground">{admin.email}</p>
            </div>
          </div>
          <button className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-lg transition" onClick={onClose} type="button">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" />Nombre completo *</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nombre del administrador" />
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
          <Button variant="outline" onClick={onClose} disabled={updateAdmin.isPending}>Cancelar</Button>
          <Button onClick={handleSave} disabled={updateAdmin.isPending}>
            {updateAdmin.isPending ? 'Guardando...' : 'Guardar Cambios'}
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
const DeleteAdminModal = ({ admin, isOpen, onClose }: { admin: Admin | null; isOpen: boolean; onClose: () => void }) => {
  const deleteAdmin = useDeleteAdmin();

  const handleDelete = async () => {
    if (!admin) return;
    try {
      await deleteAdmin.mutateAsync(admin.id);
      onClose();
    } catch { /* handled by hook */ }
  };

  if (!isOpen || !admin) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-md p-6 md:p-8 border border-border">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-destructive" />
            <h2 className="text-xl font-semibold text-foreground">Eliminar Administrador</h2>
          </div>
          <button className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-lg transition" onClick={onClose} type="button">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 space-y-1">
          <p className="text-sm text-foreground">
            ¿Estás seguro de eliminar al administrador <span className="font-bold">{admin.full_name}</span>?
          </p>
          <p className="text-xs text-muted-foreground">{admin.email}</p>
          <p className="text-xs text-muted-foreground mt-1">Esta acción no se puede deshacer.</p>
        </div>

        <div className="flex gap-3 mt-6 justify-end">
          <Button variant="outline" onClick={onClose} disabled={deleteAdmin.isPending}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteAdmin.isPending}>
            {deleteAdmin.isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
const AdminsList = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { data: admins, isLoading, error } = useAdmins();

  const [busqueda, setBusqueda] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editAdmin, setEditAdmin] = useState<Admin | null>(null);
  const [deleteAdmin, setDeleteAdmin] = useState<Admin | null>(null);

  const filtered = useMemo(() => {
    if (!admins) return [];
    if (!busqueda) return admins;
    const s = busqueda.toLowerCase();
    return admins.filter(
      (a) =>
        a.full_name.toLowerCase().includes(s) ||
        a.email.toLowerCase().includes(s) ||
        (a.phone?.toLowerCase().includes(s) ?? false)
    );
  }, [admins, busqueda]);

  return (
    <div className="p-4 md:p-6 text-foreground">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-start md:gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Administradores</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {admins?.length ?? 0} administrador{(admins?.length ?? 0) !== 1 ? 'es' : ''} registrado{(admins?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl px-4 md:px-5 py-2.5 md:py-3 shadow-sm transition-all cursor-pointer text-sm md:text-base shrink-0"
          onClick={() => setCreateOpen(true)}
        >
          <PlusCircle className="w-5 h-5" />
          {isMobile ? 'Nuevo Admin' : 'Agregar Administrador'}
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center w-full md:w-96 bg-background rounded-xl shadow-sm border border-border focus-within:ring-2 focus-within:ring-primary transition-all mb-4">
        <Search className="w-5 h-5 ml-3 text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="Buscar por nombre, email o teléfono..."
          className="w-full py-2.5 px-3 bg-transparent outline-none text-sm text-foreground placeholder-muted-foreground"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Content */}
      <div className="bg-background shadow-md rounded-xl border border-border">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
            </div>
          </div>
        ) : error ? (
          <div className="text-center text-destructive py-12 text-sm">
            Error al cargar los administradores. Por favor, intenta de nuevo.
          </div>
        ) : isMobile ? (
          /* ── Mobile cards ── */
          <div className="divide-y divide-border">
            {filtered.length === 0 ? (
              <div className="text-center text-muted-foreground py-12 text-sm">
                No se encontraron administradores.
              </div>
            ) : (
              filtered.map((admin) => (
                <div key={admin.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary font-bold text-sm">
                          {admin.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-foreground truncate flex items-center gap-2">
                          {admin.full_name}
                          {admin.id === user?.id && (
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold shrink-0">Tú</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{admin.email}</div>
                        {admin.phone && <div className="text-xs text-muted-foreground">{admin.phone}</div>}
                        <div className="text-xs text-muted-foreground mt-1">
                          Desde {format(new Date(admin.created_at), 'dd MMM yyyy', { locale: es })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setEditAdmin(admin)}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {admin.id !== user?.id && (
                        <button
                          onClick={() => setDeleteAdmin(admin)}
                          className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* ── Desktop table ── */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted border-b border-border text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="p-4 font-semibold">Administrador</th>
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 font-semibold">Teléfono</th>
                  <th className="p-4 font-semibold">Miembro desde</th>
                  <th className="p-4 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted-foreground py-12 text-sm">
                      No se encontraron administradores.
                    </td>
                  </tr>
                ) : (
                  filtered.map((admin) => (
                    <tr key={admin.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-primary font-bold text-sm">
                              {admin.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="font-medium text-foreground flex items-center gap-2">
                            {admin.full_name}
                            {admin.id === user?.id && (
                              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">Tú</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-foreground">{admin.email}</td>
                      <td className="p-4 text-sm text-foreground">
                        {admin.phone || <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {format(new Date(admin.created_at), 'dd MMM yyyy', { locale: es })}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditAdmin(admin)}
                            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                            title="Editar administrador"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {admin.id !== user?.id && (
                            <button
                              onClick={() => setDeleteAdmin(admin)}
                              className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              title="Eliminar administrador"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateAdminModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      <EditAdminModal admin={editAdmin} isOpen={!!editAdmin} onClose={() => setEditAdmin(null)} />
      <DeleteAdminModal admin={deleteAdmin} isOpen={!!deleteAdmin} onClose={() => setDeleteAdmin(null)} />
    </div>
  );
};

export default AdminsList;
