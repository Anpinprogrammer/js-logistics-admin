import { ReactNode, useState, useEffect } from 'react';
//import { useAuth } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContextTest';
import { Button } from '@/components/ui/button';
import { 
  Truck, 
  Package, 
  Users, 
  BarChart3, 
  History, 
  Settings, 
  Menu, 
  X,
  LogOut,
  User,
  Wallet,
  Calendar,
  ClipboardList,
  TrendingUp, 
  DollarSign,
  Building2,
  LucideIcon,
  ChevronDown,
  PackageCheck,
  PackagePlus,
  ArrowRightCircle,
  Warehouse,
  UserRoundCog,
  ArrowDownCircle,
  Settings2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface NavItemBase {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface NavItemWithChildren extends NavItemBase {
  children: NavItemBase[];
}

type NavItem = NavItemBase | NavItemWithChildren;


interface AppLayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function AppLayout({ children, currentPage, onNavigate }: AppLayoutProps) {
  const { user, signOut, isAdmin, isCourier } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    navItems.forEach((item : NavItemWithChildren) => {
      if ('children' in item) {
        if (item.children.some(c => c.id === currentPage)) {
          setOpenGroups(prev => ({ ...prev, [item.id]: true }));
        }
      }
    });
  }, [currentPage]);


  const toggleGroup = (id: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const adminNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    //{ id: 'new-delivery', label: 'Nuevo Pedido', icon: Package },
    //{ id: 'deliveries', label: 'Entregas', icon: Package },
    {
      id: 'deliveries_pickups',
      label: 'Entregas/Recogidas',
      icon: Package,
      children: [
        { id: 'deliveries_pickups/deliveries', label: 'Entregas', icon: ArrowRightCircle },
        /**
         * 
        
        { id: 'deliveries_pickups/pickups', label: 'Recogidas', icon: ArrowDownCircle }
          */
      ]
    },
    {
      id: 'daily',
      label: 'Cuadres Diarios',
      icon: ClipboardList,
      children: [
        { id: 'daily/mensajeros', label: 'Cuadre Mensajeros', icon: Truck },
        //{ id:'daily/clientes', label: 'Cuadre Clientes', icon: Users },
        { id: 'daily/caja', label: 'Cuadre Caja', icon: Wallet },
      ]
    },
    /**
     * 
     
    {
      id: 'weekly',
      label: 'Cuadre Semanal',
      icon: Calendar,
      children: [
        { id: 'weekly/cash', label: 'Caja Consolidada', icon: Wallet },
        { id: 'weekly/payroll', label: 'Nómina Semanal', icon: Calendar },
      ]
    },*/
    //{ id: 'cash', label: 'Caja Consolidada', icon: Wallet },
    //{ id: 'payroll', label: 'Nómina Semanal', icon: Calendar },
    //{ id: 'services', label: 'Servicios', icon: DollarSign },
    {
      id: 'personal',
      label: 'Personal',
      icon: Building2,
      children: [
        { id: 'personal/admins', label: 'Administradores', icon: User },
        //{ id: 'personal/colaboradores', label: 'Colaboradores', icon: Truck },
        { id: 'personal/mensajeros', label: 'Mensajeros', icon: Truck },
      ],
    },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'system',
      label: 'Sistema',
      icon: Settings2,
      children: [
        //{ id: 'system/audit', label: 'Auditoría', icon: History },
        { id: 'system/settings', label: 'Configuración', icon: Settings },
        //{ id: 'system/roles', label: 'Roles', icon: UserRoundCog }
      ]
     },
  ];

  const courierNavItems = [
    { id: 'summary', label: 'Mi Resumen', icon: TrendingUp },
    { id: 'deliveries', label: 'Entregas Pendientes', icon: ClipboardList },
    { id: 'today', label: 'Entregas del Día', icon: Package },
  ];

  const navItems = isAdmin ? adminNavItems : courierNavItems;

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-foreground/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col lg:h-screen",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
              <img src="/img/logo_azul.png" alt="" />
              {/** 
              <Truck className="w-5 h-5 text-sidebar-primary-foreground" />
              */}
            </div>
            <div>
              <h1 className="font-bold text-lg text-white">JS Logistics</h1>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs mt-0.5",
                  isAdmin ? "border-admin-badge text-admin-badge" : "border-courier-badge text-courier-badge"
                )}
              >
                {isAdmin ? 'Admin' : 'Mensajero'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            // 🔹 ITEM CON SUBMENÚ
            if ('children' in item) {
              const isOpen = openGroups[item.id];
              const isGroupActive = currentPage.startsWith(item.id);

              return (
                <div key={item.id}>
                  {/* Botón principal */}
                  <button
                    onClick={() => toggleGroup(item.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm",
                      "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-white" />
                      <span className="font-medium text-white">{item.label}</span>
                    </div>

                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-white transition-transform duration-200",
                        openGroups[item.id] ? "rotate-180" : "rotate-0"
                      )}
                    />
                  </button>


                  {/* Subtabs */}
                  {isOpen && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.children.map(sub => {
                        const isActive = currentPage === sub.id;

                        return (
                          <button
                            key={sub.id}
                            onClick={() => handleNavigate(sub.id)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm",
                              isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground/60 hover:bg-sidebar-accent/40"
                            )}
                          >
                            <sub.icon className={`${!isActive && 'text-white'} w-4 h-4`} />
                              <span className={`${!isActive && 'text-white'}`} >{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
               );
            }

            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm text-left cursor-pointer",
                  isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive
                    ? "text-sidebar-accent-foreground"
                    : "text-white"
                  )}
                />
                <span
                  className={cn(
                    "font-medium transition-colors",
                    isActive
                    ? "text-sidebar-accent-foreground"
                    : "text-white"
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}

        </nav>

        {/* User section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center">
              <User className="w-4 h-4 text-sidebar-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-white">{user?.email}</p>
              <p className="text-xs text-white">
                {isAdmin ? 'Administrador' : 'Mensajero'}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-white hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4 mr-2 " />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-card/95 backdrop-blur-sm border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              <span className="font-bold">JS Logistics</span>
            </div>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
