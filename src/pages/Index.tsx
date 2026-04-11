import { useState, useCallback, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
//import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContextTest';
import { LoginFormTest } from '@/components/auth/LoginFormTest';
import { AppLayout } from '@/components/layout/AppLayout';
import { Loader2 } from 'lucide-react';

// Lazy-loaded admin pages — each loads only when first visited
const AdminDashboard = lazy(() => import('@/components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const Deliveries = lazy(() => import('@/components/admin/deliveries/Deliveries'));
const PickUps = lazy(() => import('@/components/admin/pickups/PickUps'));
const ServicesList = lazy(() => import('@/components/admin/options/ServicesList').then(m => ({ default: m.ServicesList })));
const CouriersList = lazy(() => import('@/components/admin/CouriersList').then(m => ({ default: m.CouriersList })));
const AdminsList = lazy(() => import('@/components/admin/personel/AdminsList'));
const CollaboratorList = lazy(() => import('@/components/admin/personel/collaborators/CollaboratorList'));
const ClientsManager = lazy(() => import('@/components/admin/companies/ClientsManager').then(m => ({ default: m.ClientsManager })));
const AuditLog = lazy(() => import('@/components/admin/system/AuditLog').then(m => ({ default: m.AuditLog })));
const SettingsPage = lazy(() => import('@/components/admin/system/SettingsPage').then(m => ({ default: m.SettingsPage })));
const RolesSetting = lazy(() => import('@/components/admin/system/RolesSetting'));
const ConsolidatedCash = lazy(() => import('@/components/admin/ConsolidatedCash').then(m => ({ default: m.ConsolidatedCash })));
const DailySettlements = lazy(() => import('@/components/admin/daily/daily-couriers/DailySettlements').then(m => ({ default: m.DailySettlements })));
const DailyClientSettlement = lazy(() => import('@/components/admin/daily/daily-clients/DailyClientSettlement').then(m => ({ default: m.DailyClientSettlement })));
const DailySettlementCash = lazy(() => import('@/components/admin/daily/daily-accounts/DailySettlementCash'));
const WeeklyPayroll = lazy(() => import('@/components/admin/WeeklyPayroll').then(m => ({ default: m.WeeklyPayroll })));
const AgentChat = lazy(() => import('@/components/agent/AgentChat').then(m => ({ default: m.AgentChat })));

// Lazy-loaded courier pages
const DeliveryList = lazy(() => import('@/components/delivery/DeliveryList').then(m => ({ default: m.DeliveryList })));
const CourierSummary = lazy(() => import('@/components/courier/CourierSummary').then(m => ({ default: m.CourierSummary })));
const CourierTodayDeliveries = lazy(() => import('@/components/courier/CourierTodayDeliveries').then(m => ({ default: m.CourierTodayDeliveries })));

const PageLoader = () => (
  <div className="min-h-[200px] flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

function AppContent() {
  const { user, loading, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const defaultPage = isAdmin ? 'dashboard' : 'summary';
  const initialPage = searchParams.get('page') || defaultPage;
  const [currentPage, setCurrentPage] = useState(initialPage);

  const handleNavigate = useCallback((page: string) => {
    setCurrentPage(page);
    setSearchParams({ page }, { replace: true });
  }, [setSearchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginFormTest />;
  }

  const page = currentPage || defaultPage;
  const renderPage = () => {
    // Admin pages
    if (isAdmin) {
      switch (page) {
        case 'dashboard':
          return <AdminDashboard />;
        case 'deliveries_pickups/deliveries':
          return (
            <div className="space-y-4 animate-fade-in">
              <h1 className="text-2xl font-bold">Todas las Entregas</h1>
              <Deliveries showCourier />
            </div>
          );
        case 'deliveries_pickups/pickups':
          return (
            <div className="space-y-4 animate-fade-in">
              <h1 className="text-2xl font-bold">Todas las Recogidas</h1>
              <PickUps />
            </div>
          );
        case 'daily/mensajeros':
          return <DailySettlements />;
        case 'daily/clientes':
          return <DailyClientSettlement />;  
        case 'daily/caja':
          return <DailySettlementCash />;
        case 'weekly/cash':
          return <ConsolidatedCash />;
        case 'weekly/payroll':
          return <WeeklyPayroll />;
        case 'services':
          return <ServicesList />;
        case 'personal/admins':
          return <AdminsList />;
        case 'personal/colaboradores':
          return <CollaboratorList />;
        case 'personal/mensajeros':
          return <CouriersList />;
        case 'clients':
          return <ClientsManager />;
        case 'system/audit':
          return <AuditLog />;
        case 'system/settings':
          return <SettingsPage />;
        case 'system/roles':
          return <RolesSetting />
        default:
          return <AdminDashboard />;
      }
    }

    // Courier pages
    switch (page) {
      case 'summary':
        return (
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-2xl font-bold">Mi Resumen</h1>
            <CourierSummary />
          </div>
        );
      case 'today':
        return (
          <div className="space-y-4 animate-fade-in">
            <CourierTodayDeliveries />
          </div>
        );
      case 'deliveries':
      default:
        return (
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-2xl font-bold">Entregas Pendientes</h1>
            <DeliveryList />
          </div>
        );
    }
  };

  return (
    <AppLayout currentPage={page} onNavigate={handleNavigate}>
      <Suspense fallback={<PageLoader />}>
        {renderPage()}
        {isAdmin && <AgentChat />}
      </Suspense>
    </AppLayout>
  );
}

const Index = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;
