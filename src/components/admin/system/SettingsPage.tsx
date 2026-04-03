import { useState, useEffect, useRef } from 'react';
import { Settings, RotateCcw, Loader2, User, Lock, Shield, Eye, EyeOff, Check, Camera, X } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
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

export function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

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
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  // Load photo once user id is known
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
      
        if(uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);
    
      setPhotoUrl(publicUrl)


    } catch (error) {
      console.log(error)
    } finally {
      setUploading(false)
    }

    /**
     * 
     
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Error', description: 'La imagen no puede superar 2 MB', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setProfilePhoto(base64);
      localStorage.setItem(`avatarPhoto_${user!.id}`, base64);
      toast({ title: 'Foto actualizada', description: 'Tu foto de perfil ha sido guardada.' });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    */
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
      const dummy = '00000000-0000-0000-0000-000000000000';
      await api.delete('/deliveries');
      await api.delete('/daily-settlements');
      await api.post('/daily-settlements/company/reset');
      //await supabase.from('weekly_settlements').delete().neq('id', dummy);
      //await supabase.from('salary_advances').delete().neq('id', dummy);
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

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in w-full">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Settings className="w-6 h-6 text-primary" />
        Configuración
      </h1>

      {/* ── Cards grid 2x2 ── */}
      <div className='grid grid-cols-2 gap-4'>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5" />
            Perfil
          </CardTitle>
          <CardDescription>Actualiza tu información personal.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Avatar + photo controls */}
          <div className="flex items-start gap-5">
            {/* Avatar with camera overlay */}
            <div className="relative flex-shrink-0">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="Foto de perfil"
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className={`w-20 h-20 rounded-full ${avatarColor} flex items-center justify-center text-white text-2xl font-bold select-none`}>
                  {initials}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-background border-2 border-border flex items-center justify-center hover:bg-muted transition-colors"
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

            {/* Controls */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Camera className="w-3.5 h-3.5 mr-1.5" />
                  {profilePhoto ? 'Cambiar foto' : 'Subir foto'}
                </Button>
                {profilePhoto && (
                  <Button type="button" variant="ghost" size="sm" onClick={handlePhotoRemove} className="text-muted-foreground hover:text-destructive">
                    <X className="w-3.5 h-3.5 mr-1.5" />
                    Quitar foto
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">JPG, PNG, GIF o WebP · Máx. 2 MB</p>

              {/* Color picker — shown always so user can pre-pick before removing photo */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Color del avatar</p>
                <div className="flex gap-2 flex-wrap">
                  {AVATAR_COLORS.map(({ id, hex }) => (
                    <button
                      key={id}
                      type="button"
                      title={id}
                      onClick={() => handleAvatarColor(id)}
                      style={{ background: hex }}
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none ${
                        avatarColor === id ? 'ring-2 ring-offset-2 ring-foreground/40' : ''
                      }`}
                    >
                      {avatarColor === id && <Check className="w-3 h-3 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t" />

          {/* Name + phone form */}
          {profileFetching ? (
            <div className="flex items-center justify-center py-6">
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
        </CardContent>

        <CardFooter>
          <Button onClick={handleProfileSave} disabled={profileLoading || profileFetching}>
            {profileLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {profileLoading ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </CardFooter>
      </Card>

      {/* ── Account info ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5" />
            Información de cuenta
          </CardTitle>
          <CardDescription>Datos de tu cuenta en el sistema.</CardDescription>
        </CardHeader>

        <CardContent className="divide-y">
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted-foreground">Correo electrónico</span>
            <span className="text-sm font-medium">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted-foreground">Rol</span>
            <Badge variant="secondary">Administrador</Badge>
          </div>
          {memberSince && (
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground">Miembro desde</span>
              <span className="text-sm font-medium">
                {format(new Date(memberSince), "d 'de' MMMM, yyyy", { locale: es })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Change password ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="w-5 h-5" />
            Cambiar contraseña
          </CardTitle>
          <CardDescription>Elige una contraseña segura de al menos 6 caracteres.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
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
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          {passwordMismatch && (
            <p className="text-xs text-destructive">Las contraseñas no coinciden</p>
          )}
        </CardContent>

        <CardFooter>
          <Button onClick={handlePasswordSave} disabled={passwordLoading}>
            {passwordLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {passwordLoading ? 'Actualizando...' : 'Actualizar contraseña'}
          </Button>
        </CardFooter>
      </Card>

      {/* ── Danger zone ── */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de peligro</CardTitle>
          <CardDescription>
            Acciones irreversibles que afectan los datos del sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
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
        </CardContent>
      </Card>

      </div>
    </div>
  );
}
