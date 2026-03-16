import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
//import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContextTest';
import { LoginForm } from '@/components/auth/LoginForm';
import { LoginFormTest } from '@/components/auth/LoginFormTest';
import { AppLayout } from '@/components/layout/AppLayout';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { DeliveryList } from '@/components/delivery/DeliveryList';
import Deliveries from '@/components/admin/deliveries/Deliveries';
import PickUps from '@/components/admin/pickups/PickUps';
import { ServicesList } from '@/components/admin/options/ServicesList';
import { AdminNewDeliveryForm } from '@/components/admin/AdminNewDeliveryForm';
import { CouriersList } from '@/components/admin/CouriersList';
import AdminsList from '@/components/admin/personel/AdminsList';
import PatinadoresList from '@/components/admin/personel/PatinadoresList';
import { ClientsManager } from '@/components/admin/companies/ClientsManager';
import { AuditLog } from '@/components/admin/system/AuditLog';
import { SettingsPage } from '@/components/admin/system/SettingsPage';
import RolesSetting from '@/components/admin/system/RolesSetting';
import { ConsolidatedCash } from '@/components/admin/ConsolidatedCash';
import { DailySettlements } from '@/components/admin/daily/daily-couriers/DailySettlements';
import {DailyClientSettlement} from '@/components/admin/daily/daily-clients/DailyClientSettlement';
import DailySettlementCash from '@/components/admin/daily/daily-accounts/DailySettlementCash';
import { WeeklyPayroll } from '@/components/admin/WeeklyPayroll';
import { CourierSummary } from '@/components/courier/CourierSummary';
import { CourierTodayDeliveries } from '@/components/courier/CourierTodayDeliveries';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Loader2 } from 'lucide-react';
import { AgentChat } from '@/components/agent/AgentChat';

function AppContent() {
  const { user, loading, isAdmin, isCourier } = useAuth();
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
        case 'new-delivery':
          return <AdminNewDeliveryForm />;
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
        case 'personal/patinadores':
          return <PatinadoresList />;
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
      {renderPage()}
      {isAdmin && <AgentChat />}
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
