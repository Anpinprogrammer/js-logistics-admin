import { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { AppLayout } from '@/components/layout/AppLayout';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { DeliveryList } from '@/components/delivery/DeliveryList';
import { NewDeliveryForm } from '@/components/courier/NewDeliveryForm';
import { CouriersList } from '@/components/admin/CouriersList';
import { ClientsManager } from '@/components/admin/ClientsManager';
import { AuditLog } from '@/components/admin/AuditLog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading, isAdmin, isCourier } = useAuth();
  const [currentPage, setCurrentPage] = useState(isAdmin ? 'dashboard' : 'deliveries');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  // Set default page based on role
  const defaultPage = isAdmin ? 'dashboard' : 'deliveries';
  const page = currentPage || defaultPage;

  const renderPage = () => {
    // Admin pages
    if (isAdmin) {
      switch (page) {
        case 'dashboard':
          return <AdminDashboard />;
        case 'deliveries':
          return (
            <div className="space-y-4 animate-fade-in">
              <h1 className="text-2xl font-bold">Todas las Entregas</h1>
              <DeliveryList showCourier />
            </div>
          );
        case 'couriers':
          return <CouriersList />;
        case 'clients':
          return <ClientsManager />;
        case 'audit':
          return <AuditLog />;
        case 'settings':
          return (
            <div className="space-y-4 animate-fade-in">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Settings className="w-6 h-6 text-primary" />
                Configuración
              </h1>
              <Card>
                <CardHeader>
                  <CardTitle>Próximamente</CardTitle>
                  <CardDescription>
                    Configuración de la aplicación, períodos de pago, y más opciones estarán disponibles aquí.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          );
        default:
          return <AdminDashboard />;
      }
    }

    // Courier pages
    switch (page) {
      case 'deliveries':
        return (
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-2xl font-bold">Mis Entregas</h1>
            <DeliveryList />
          </div>
        );
      case 'new-delivery':
        return <NewDeliveryForm onSuccess={() => setCurrentPage('deliveries')} />;
      default:
        return (
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-2xl font-bold">Mis Entregas</h1>
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
