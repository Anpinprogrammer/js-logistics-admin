import { useState, useEffect, useRef } from 'react';
import { Settings, RotateCcw, Loader2, User, Lock, Shield, Eye, EyeOff, Check, Camera, X, AlertTriangle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContextTest';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const AVATAR_COLORS = [
  { id: 'bg-primary',     hex: 'hsl(var(--primary))' },
  { id: 'bg-blue-500',    hex: '#3b82f6' },
  { id: 'bg-green-500',   hex: '#22c55e' },
  { id: 'bg-purple-500',  hex: '#a855f7' },
  { id: 'bg-orange-500',  hex: '#f97316' },
  { id: 'bg-pink-500',    hex: '#ec4899' },
  { id: 'bg-indigo-500',  hex: '#6366f1' },
  { id: 'bg-teal-500',    hex: '#14b8a6' },
];

type Section = 'profile' | 'account' | 'password' | 'danger';

const NAV_ITEMS: { id: Section; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'profile',  label: 'Perfil',               icon: User,          description: 'Foto y datos personales' },
  { id: 'account',  label: 'Cuenta',                icon: Shield,        description: 'Email, rol y membresía' },
  { id: 'password', label: 'Contraseña',            icon: Lock,          description: 'Actualizar credenciales' },
  { id: 'danger',   label: 'Zona de peligro',       icon: AlertTriangle, description: 'Acciones irreversibles' },
];

export function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeSection, setActiveSection] = useState<Section>('profile');

  // ─── Danger zone ──────────────────────────────────────────────────────────
  const [resetting, setResetting] = useState(false);
  const [open, setOpen] = useState(false);

  // ─── Profile ──────────────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '' });
  const [profileFetching, setProfileFetching] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [memberSince, setMemberSince] = useState<string | null>(null);

  // ─── Avatar color (persisted locally) ────────────────────────────────────
  const [avatarColor, setAvatarColor] = useState(
    () => localStorage.getItem('avatarColor') || 'bg-primary'
  );

  // ─── Profile photo (base64, persisted locally per user) ──────────────────
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      setProfilePhoto(localStorage.getItem(`avatarPhoto_${user.id}`) ?? null);
    }
  }, [user?.id]);

  // ─── Password ─────────────────────────────────────────────────────────────
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  // ─── Fetch full profile on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    api.get('/auth/me')
      .then(({ data }) => {
        const d = data?.data ?? data;
        setProfileForm({
          full_name: d?.full_name ?? user.full_name ?? '',
          phone: d?.phone ?? '',
        });
        setMemberSince(d?.created_at ?? null);
      })
      .catch(() => {
        setProfileForm({ full_name: user.full_name ?? '', phone: '' });
      })
      .finally(() => setProfileFetching(false));
  }, [user]);

  const initials = (profileForm.full_name || user?.full_name || '?')
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleAvatarColor = (colorId: string) => {
    setAvatarColor(colorId);
    localStorage.setItem('avatarColor', colorId);
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `profile_pictures/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      setPhotoUrl(publicUrl);
    } catch (error) {
      console.log(error);
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoRemove = () => {
    setProfilePhoto(null);
    localStorage.removeItem(`avatarPhoto_${user!.id}`);
  };

  const handleProfileSave = async () => {
    if (!profileForm.full_name.trim()) {
      toast({ title: 'Error', description: 'El nombre completo es requerido', variant: 'destructive' });
      return;
    }
    setProfileLoading(true);
    try {
      await api.put(`/admins/${user!.id}`, {
        full_name: profileForm.full_name.trim(),
        phone: profileForm.phone.trim() || undefined,
      });
      toast({ title: 'Perfil actualizado', description: 'Tus datos han sido guardados.' });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.error ?? 'No se pudo actualizar el perfil',
        variant: 'destructive',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSave = async () => {
    if (!passwordForm.newPassword) {
      toast({ title: 'Error', description: 'Ingresa una nueva contraseña', variant: 'destructive' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast({ title: 'Error', description: 'La contraseña debe tener al menos 6 caracteres', variant: 'destructive' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: 'Error', description: 'Las contraseñas no coinciden', variant: 'destructive' });
      return;
    }
    setPasswordLoading(true);
    try {
      await api.put(`/admins/${user!.id}`, {
        full_name: profileForm.full_name || user!.full_name,
        password: passwordForm.newPassword,
      });
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      toast({ title: 'Contraseña actualizada', description: 'Tu contraseña ha sido cambiada exitosamente.' });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.error ?? 'No se pudo cambiar la contraseña',
        variant: 'destructive',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await api.delete('/deliveries');
      await api.delete('/daily-settlements');
      await api.post('/daily-settlements/company/reset');
      await api.put('/clients', { balance: 0, service_lost_trips: 0 });
      toast({ title: 'Sistema reiniciado correctamente', description: 'Todas las entregas y saldos han sido eliminados.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'No se pudo reiniciar el sistema', variant: 'destructive' });
    } finally {
      setResetting(false);
      setOpen(false);
    }
  };

  const passwordMismatch =
    passwordForm.newPassword.length > 0 &&
    passwordForm.confirmPassword.length > 0 &&
    passwordForm.newPassword !== passwordForm.confirmPassword;

  const activeNav = NAV_ITEMS.find(n => n.id === activeSection)!;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in w-full min-h-full">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-primary/10">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-12">
          Administra tu cuenta y preferencias del sistema
        </p>
      </div>

      <div className="flex gap-6 items-start">
        {/* ── Sidebar nav ── */}
        <aside className="w-56 flex-shrink-0 sticky top-0">
          <nav className="space-y-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon, description }) => {
              const isActive = activeSection === id;
              const isDanger = id === 'danger';
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveSection(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group ${
                    isActive
                      ? isDanger
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-primary/10 text-primary'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive && isDanger ? 'text-destructive' : isActive ? 'text-primary' : ''}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isActive ? '' : ''}`}>{label}</p>
                    <p className="text-xs opacity-60 truncate">{description}</p>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Content panel ── */}
        <div className="flex-1 min-w-0">
          {/* Section header */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b">
            <div className={`p-2 rounded-lg ${activeSection === 'danger' ? 'bg-destructive/10' : 'bg-muted'}`}>
              <activeNav.icon className={`w-4 h-4 ${activeSection === 'danger' ? 'text-destructive' : 'text-foreground'}`} />
            </div>
            <div>
              <h2 className="font-semibold text-base">{activeNav.label}</h2>
              <p className="text-xs text-muted-foreground">{activeNav.description}</p>
            </div>
          </div>

          {/* ── Profile section ── */}
          {activeSection === 'profile' && (
            <div className="space-y-6">
              {/* Avatar row */}
              <div className="flex items-center gap-6 p-5 rounded-xl bg-muted/40 border">
                <div className="relative flex-shrink-0">
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="Foto de perfil"
                      className="w-20 h-20 rounded-full object-cover ring-2 ring-border"
                    />
                  ) : (
                    <div className={`w-20 h-20 rounded-full ${avatarColor} flex items-center justify-center text-white text-2xl font-bold select-none ring-2 ring-border`}>
                      {initials}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-background border-2 border-border flex items-center justify-center hover:bg-muted transition-colors shadow-sm"
                    title="Cambiar foto"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/gif, image/webp"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold">{profileForm.full_name || user?.full_name || '—'}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Camera className="w-3.5 h-3.5 mr-1.5" />}
                      {profilePhoto ? 'Cambiar foto' : 'Subir foto'}
                    </Button>
                    {profilePhoto && (
                      <Button type="button" variant="ghost" size="sm" onClick={handlePhotoRemove} className="text-muted-foreground hover:text-destructive">
                        <X className="w-3.5 h-3.5 mr-1.5" />
                        Quitar
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">JPG, PNG, GIF o WebP · Máx. 2 MB</p>
                </div>
              </div>

              {/* Color picker */}
              <div className="space-y-2">
                <Label className="text-sm">Color del avatar</Label>
                <p className="text-xs text-muted-foreground">Se muestra cuando no hay foto de perfil</p>
                <div className="flex gap-2 flex-wrap pt-1">
                  {AVATAR_COLORS.map(({ id, hex }) => (
                    <button
                      key={id}
                      type="button"
                      title={id}
                      onClick={() => handleAvatarColor(id)}
                      style={{ background: hex }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 focus:outline-none shadow-sm ${
                        avatarColor === id ? 'ring-2 ring-offset-2 ring-foreground/40 scale-110' : ''
                      }`}
                    >
                      {avatarColor === id && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t" />

              {/* Name + phone */}
              {profileFetching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nombre completo</Label>
                    <Input
                      id="full_name"
                      value={profileForm.full_name}
                      onChange={e => setProfileForm(p => ({ ...p, full_name: e.target.value }))}
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="Número de teléfono"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button onClick={handleProfileSave} disabled={profileLoading || profileFetching}>
                  {profileLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {profileLoading ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </div>
          )}

          {/* ── Account section ── */}
          {activeSection === 'account' && (
            <div className="space-y-3">
              {[
                { label: 'Correo electrónico', value: user?.email },
                { label: 'Rol', value: <Badge variant="secondary" className="font-medium">Administrador</Badge> },
                ...(memberSince
                  ? [{ label: 'Miembro desde', value: format(new Date(memberSince), "d 'de' MMMM, yyyy", { locale: es }) }]
                  : []),
              ].map((row, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-3.5 rounded-lg bg-muted/40 border hover:bg-muted/60 transition-colors"
                >
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                  <span className="text-sm font-medium">{row.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Password section ── */}
          {activeSection === 'password' && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-muted/40 border text-sm text-muted-foreground">
                Elige una contraseña segura de al menos <strong>6 caracteres</strong>. No compartas tu contraseña con nadie.
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                      placeholder="Mínimo 6 caracteres"
                      className="pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(v => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                      placeholder="Repite la contraseña"
                      className={`pr-9 ${passwordMismatch ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(v => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {passwordMismatch && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <X className="w-3 h-3" /> Las contraseñas no coinciden
                </p>
              )}

              <div className="flex justify-end pt-2">
                <Button onClick={handlePasswordSave} disabled={passwordLoading || passwordMismatch}>
                  {passwordLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {passwordLoading ? 'Actualizando...' : 'Actualizar contraseña'}
                </Button>
              </div>
            </div>
          )}

          {/* ── Danger zone section ── */}
          {activeSection === 'danger' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 overflow-hidden">
                <div className="px-5 py-4 border-b border-destructive/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-destructive">Reiniciar sistema</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Elimina todas las entregas, liquidaciones y saldos de clientes. Los usuarios, mensajeros y configuraciones se mantienen intactos.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-5 py-4">
                  <p className="text-xs text-muted-foreground mb-4">
                    Esta acción <strong>no se puede deshacer</strong>. Asegúrate de exportar cualquier dato que necesites antes de continuar.
                  </p>
                  <AlertDialog open={open} onOpenChange={setOpen}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="gap-2">
                        <RotateCcw className="w-4 h-4" />
                        Reiniciar sistema
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Seguro que deseas borrar todas las entregas?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminarán todos los registros de entregas y su historial de auditoría. Los usuarios, configuraciones y mensajeros se mantendrán intactos.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={resetting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleReset}
                          disabled={resetting}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {resetting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                          {resetting ? 'Reiniciando...' : 'Sí, reiniciar'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
