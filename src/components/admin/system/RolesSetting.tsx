import { useState } from 'react';
import {
  ShieldCheck, Users, Truck, Warehouse,
  ClipboardList, DollarSign, Settings2,
  Building2, Calendar, ArrowRightCircle,
  ArrowDownCircle, Lock, Save, UserRoundCog,
  ChevronRight, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { LucideIcon } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────
type RoleId = 'admin' | 'client' | 'courier' | 'picker';

interface Permission {
  id: string;
  label: string;
  description: string;
}

interface PermissionGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  permissions: Permission[];
}

interface RoleDef {
  id: RoleId;
  name: string;
  description: string;
  icon: LucideIcon;
  badgeBg: string;
  color: string;
  locked: boolean;
  defaultPermissions: string[];
}

// ─── Permission Groups ──────────────────────────────────────────────────────
const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'deliveries',
    label: 'Entregas',
    icon: ArrowRightCircle,
    permissions: [
      { id: 'view_all_deliveries', label: 'Ver todas las entregas', description: 'Acceso a la lista completa de entregas del sistema' },
      { id: 'view_own_deliveries', label: 'Ver entregas propias', description: 'Solo las entregas asignadas o relacionadas con el usuario' },
      { id: 'manage_deliveries', label: 'Gestionar entregas', description: 'Crear, editar y eliminar entregas' },
    ],
  },
  {
    id: 'pickups',
    label: 'Recogidas',
    icon: ArrowDownCircle,
    permissions: [
      { id: 'view_all_pickups', label: 'Ver todas las recogidas', description: 'Acceso a la lista completa de recogidas del sistema' },
      { id: 'view_own_pickups', label: 'Ver recogidas propias', description: 'Solo las recogidas asignadas o relacionadas con el usuario' },
      { id: 'manage_pickups', label: 'Gestionar recogidas', description: 'Crear, editar y eliminar recogidas' },
    ],
  },
  {
    id: 'daily',
    label: 'Cuadres Diarios',
    icon: ClipboardList,
    permissions: [
      { id: 'view_daily_couriers', label: 'Cuadre de mensajeros', description: 'Ver cuadres diarios del personal de mensajería' },
      { id: 'view_daily_clients', label: 'Cuadre de clientes', description: 'Ver cuadres diarios por cliente' },
      { id: 'view_daily_cash', label: 'Cuadre de caja', description: 'Ver el cuadre diario de caja' },
    ],
  },
  {
    id: 'weekly',
    label: 'Cuadres Semanales',
    icon: Calendar,
    permissions: [
      { id: 'view_weekly_cash', label: 'Caja consolidada', description: 'Ver la caja consolidada semanal' },
      { id: 'view_weekly_payroll', label: 'Nómina semanal completa', description: 'Ver la nómina semanal de todo el personal' },
      { id: 'view_own_payroll', label: 'Nómina propia', description: 'Ver únicamente la nómina personal del usuario' },
    ],
  },
  {
    id: 'personnel',
    label: 'Personal',
    icon: Building2,
    permissions: [
      { id: 'view_admins', label: 'Ver administradores', description: 'Acceso a la lista de administradores del sistema' },
      { id: 'view_couriers', label: 'Ver mensajeros', description: 'Acceso a la lista de mensajeros' },
      { id: 'view_pickers', label: 'Ver patinadores', description: 'Acceso a la lista de patinadores' },
      { id: 'manage_personnel', label: 'Gestionar personal', description: 'Crear, editar y eliminar personal del sistema' },
    ],
  },
  {
    id: 'clients',
    label: 'Clientes',
    icon: Users,
    permissions: [
      { id: 'view_all_clients', label: 'Ver todos los clientes', description: 'Acceso al directorio completo de clientes' },
      { id: 'view_own_client_info', label: 'Ver información propia', description: 'Solo la información de su propia cuenta de cliente' },
      { id: 'manage_clients', label: 'Gestionar clientes', description: 'Crear, editar y eliminar clientes' },
    ],
  },
  {
    id: 'financial',
    label: 'Información Financiera',
    icon: DollarSign,
    permissions: [
      { id: 'view_all_financial', label: 'Ver finanzas completas', description: 'Acceso a toda la información financiera del sistema' },
      { id: 'view_own_financial', label: 'Ver finanzas propias', description: 'Ver únicamente la información financiera personal' },
    ],
  },
  {
    id: 'system',
    label: 'Sistema',
    icon: Settings2,
    permissions: [
      { id: 'view_dashboard', label: 'Dashboard', description: 'Acceso al panel de control principal' },
      { id: 'view_audit', label: 'Auditoría', description: 'Ver el registro de auditoría del sistema' },
      { id: 'manage_settings', label: 'Configuración del sistema', description: 'Modificar la configuración del sistema' },
      { id: 'manage_roles', label: 'Gestión de roles', description: 'Crear y editar roles y permisos del sistema' },
    ],
  },
];

const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.id));

// ─── Role Definitions ───────────────────────────────────────────────────────
const ROLES: RoleDef[] = [
  {
    id: 'admin',
    name: 'Administrador',
    description: 'Acceso completo al sistema sin restricciones. Puede gestionar todos los módulos, usuarios y configuraciones.',
    icon: ShieldCheck,
    badgeBg: 'bg-blue-500/10',
    color: 'text-blue-500',
    locked: true,
    defaultPermissions: ALL_PERMISSIONS,
  },
  {
    id: 'client',
    name: 'Cliente',
    description: 'Puede consultar sus entregas, recogidas y la información financiera relacionada con sus operaciones.',
    icon: Users,
    badgeBg: 'bg-emerald-500/10',
    color: 'text-emerald-500',
    locked: false,
    defaultPermissions: ['view_own_deliveries', 'view_own_pickups', 'view_own_client_info', 'view_own_financial'],
  },
  {
    id: 'courier',
    name: 'Mensajero',
    description: 'Puede ver las entregas que le han sido asignadas y consultar su información de nómina.',
    icon: Truck,
    badgeBg: 'bg-orange-500/10',
    color: 'text-orange-500',
    locked: false,
    defaultPermissions: ['view_own_deliveries', 'view_own_payroll'],
  },
  {
    id: 'picker',
    name: 'Patinador',
    description: 'Puede ver las recogidas que le han sido asignadas y consultar su información de nómina.',
    icon: Warehouse,
    badgeBg: 'bg-violet-500/10',
    color: 'text-violet-500',
    locked: false,
    defaultPermissions: ['view_own_pickups', 'view_own_payroll'],
  },
];

// ─── Main Component ─────────────────────────────────────────────────────────
const RolesSetting = () => {
  const [selectedRole, setSelectedRole] = useState<RoleId | null>(null);
  const [permissions, setPermissions] = useState<Record<RoleId, string[]>>({
    admin: ALL_PERMISSIONS,
    client: ['view_own_deliveries', 'view_own_pickups', 'view_own_client_info', 'view_own_financial'],
    courier: ['view_own_deliveries', 'view_own_payroll'],
    picker: ['view_own_pickups', 'view_own_payroll'],
  });
  const [saving, setSaving] = useState(false);

  const selectedRoleDef = selectedRole ? ROLES.find((r) => r.id === selectedRole) ?? null : null;
  const currentPermissions = selectedRole ? permissions[selectedRole] : [];

  const togglePermission = (permId: string) => {
    if (!selectedRole || selectedRoleDef?.locked) return;
    setPermissions((prev) => {
      const current = prev[selectedRole];
      return {
        ...prev,
        [selectedRole]: current.includes(permId)
          ? current.filter((id) => id !== permId)
          : [...current, permId],
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    // TODO: wire to backend API (e.g. PUT /api/roles/:id/permissions)
    await new Promise((resolve) => setTimeout(resolve, 700));
    setSaving(false);
    toast.success(`Permisos del rol "${selectedRoleDef?.name}" guardados`);
  };

  return (
    <div className="p-4 md:p-6 text-foreground">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <UserRoundCog className="w-6 h-6 text-primary" />
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Gestión de Roles</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure los permisos de acceso para cada rol. El rol Administrador tiene acceso completo y no puede modificarse.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 lg:gap-6 lg:items-start">

        {/* ── Role List ── */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-3">
            Roles del sistema
          </p>
          {ROLES.map((role) => {
            const RoleIcon = role.icon;
            const isSelected = selectedRole === role.id;
            const permCount = role.locked ? ALL_PERMISSIONS.length : permissions[role.id].length;

            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={cn(
                  'w-full text-left p-4 rounded-xl border transition-all duration-200',
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-background hover:border-primary/30 hover:bg-muted/50'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', role.badgeBg)}>
                    <RoleIcon className={cn('w-5 h-5', role.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-foreground text-sm">{role.name}</span>
                      {role.locked && <Lock className="w-3 h-3 text-muted-foreground" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {role.locked ? 'Acceso total al sistema' : `${permCount} de ${ALL_PERMISSIONS.length} permisos`}
                    </p>
                  </div>
                  <ChevronRight
                    className={cn(
                      'w-4 h-4 shrink-0 transition-colors',
                      isSelected ? 'text-primary' : 'text-muted-foreground/30'
                    )}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Permission Panel ── */}
        {!selectedRole ? (
          <div className="rounded-xl border border-border bg-background flex items-center justify-center min-h-[420px]">
            <div className="text-center p-8">
              <UserRoundCog className="w-14 h-14 mx-auto mb-4 text-muted-foreground/20" />
              <p className="font-semibold text-muted-foreground">Selecciona un rol</p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                Elige un rol para ver y configurar sus permisos
              </p>
            </div>
          </div>
        ) : selectedRoleDef && (
          <div className="rounded-xl border border-border bg-background overflow-hidden">

            {/* Role header */}
            <div className="p-4 md:p-5 border-b border-border bg-muted/20">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {(() => {
                    const PanelIcon = selectedRoleDef.icon;
                    return (
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5', selectedRoleDef.badgeBg)}>
                        <PanelIcon className={cn('w-5 h-5', selectedRoleDef.color)} />
                      </div>
                    );
                  })()}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-semibold text-foreground">{selectedRoleDef.name}</h2>
                      {selectedRoleDef.locked && (
                        <Badge variant="secondary" className="text-[10px] gap-1 h-5">
                          <Lock className="w-2.5 h-2.5" />
                          Sin restricciones
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 max-w-md">{selectedRoleDef.description}</p>
                  </div>
                </div>
                {!selectedRoleDef.locked && (
                  <Button size="sm" onClick={handleSave} disabled={saving} className="shrink-0">
                    {saving ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                        Guardando
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 mr-2" />
                        Guardar
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Permission groups */}
            <div className="divide-y divide-border overflow-y-auto max-h-[60vh]">
              {PERMISSION_GROUPS.map((group) => {
                const GroupIcon = group.icon;
                return (
                  <div key={group.id} className="p-4 md:p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <GroupIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {group.label}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {group.permissions.map((perm) => {
                        const isEnabled = currentPermissions.includes(perm.id);
                        return (
                          <div
                            key={perm.id}
                            className={cn(
                              'flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors',
                              isEnabled
                                ? 'bg-primary/5 border-primary/10'
                                : 'bg-muted/30 border-transparent'
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <p className={cn('text-sm font-medium', isEnabled ? 'text-foreground' : 'text-muted-foreground')}>
                                {perm.label}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">{perm.description}</p>
                            </div>
                            {selectedRoleDef.locked ? (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Check className="w-4 h-4 text-primary" />
                              </div>
                            ) : (
                              <Switch
                                checked={isEnabled}
                                onCheckedChange={() => togglePermission(perm.id)}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            {!selectedRoleDef.locked && (
              <div className="p-4 border-t border-border bg-muted/20">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {currentPermissions.length} de {ALL_PERMISSIONS.length} permisos habilitados
                  </p>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RolesSetting;
