import { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { LoginFormTest } from '@/components/auth/LoginFormTest';
import { AppLayout } from '@/components/layout/AppLayout';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { DeliveryList } from '@/components/delivery/DeliveryList';
import Deliveries from '@/components/admin/deliveries/Deliveries';
import { AdminNewDeliveryForm } from '@/components/admin/AdminNewDeliveryForm';
import { CouriersList } from '@/components/admin/CouriersList';
import { ClientsManager } from '@/components/admin/ClientsManager';
import { AuditLog } from '@/components/admin/AuditLog';
import { SettingsPage } from '@/components/admin/SettingsPage';
import { ConsolidatedCash } from '@/components/admin/ConsolidatedCash';
import { DailySettlements } from '@/components/admin/DailySettlements';
import { WeeklyPayroll } from '@/components/admin/WeeklyPayroll';
import { CourierSummary } from '@/components/courier/CourierSummary';
import { CourierTodayDeliveries } from '@/components/courier/CourierTodayDeliveries';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading, isAdmin, isCourier } = useAuth();
  const [currentPage, setCurrentPage] = useState(isAdmin ? 'dashboard' : 'summary');

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

  // Set default page based on role
  const defaultPage = isAdmin ? 'dashboard' : 'summary';
  const page = currentPage || defaultPage;

  const renderPage = () => {
    // Admin pages
    if (isAdmin) {
      switch (page) {
        case 'dashboard':
          return <AdminDashboard />;
        case 'new-delivery':
          return <AdminNewDeliveryForm />;
        case 'deliveries':
          return (
            <div className="space-y-4 animate-fade-in">
              <h1 className="text-2xl font-bold">Todas las Entregas</h1>
              <Deliveries showCourier />
            </div>
          );
        case 'daily-settlements':
          return <DailySettlements />;
        case 'cash':
          return <ConsolidatedCash />;
        case 'payroll':
          return <WeeklyPayroll />;
        case 'couriers':
          return <CouriersList />;
        case 'clients':
          return <ClientsManager />;
        case 'audit':
          return <AuditLog />;
        case 'settings':
          return <SettingsPage />;
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
    <AppLayout currentPage={page} onNavigate={setCurrentPage}>
      {renderPage()}
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
