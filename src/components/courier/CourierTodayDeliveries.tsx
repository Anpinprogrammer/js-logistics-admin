import { useDeliveriesTest } from '@/hooks/useDeliveries';
import { useAuth } from '@/contexts/AuthContextTest';
import { DeliveryCard } from '@/components/delivery/DeliveryCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, CheckCircle2, Clock, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTodayDate } from '@/hooks/useDailyOperations';

export function CourierTodayDeliveries() {
  const { user } = useAuth();
  const { data: deliveries, isLoading, isFetching, refetch } = useDeliveriesTest(user?.id);
  const today = getTodayDate();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const todayDeliveries = deliveries?. 
    filter(d =>
      {
        const date = new Date(d.delivery_date).toISOString().split('T')[0]
        return date === today
      }) || [];
  const completedToday = todayDeliveries.filter(d => 
    d.status === 'completed' || 
    d.status === 'not_delivered_collected' ||
    d.status === 'not_delivered_no_collection'
  );
  const pendingToday = todayDeliveries.filter(d => d.status === 'pending');
  
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Entregas de Hoy
          </span>
          <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        <CardDescription>
          {new Date().toLocaleDateString('es-CO', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pendientes
              <Badge variant="destructive" className="ml-1">{pendingToday.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Registradas
              <Badge variant="secondary" className="ml-1">{completedToday.length}</Badge>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="space-y-3">
            {pendingToday.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-success/50" />
                <p>¡No tienes entregas pendientes!</p>
              </div>
            ) : (
              pendingToday.map(delivery => (
                <DeliveryCard
                  key={delivery.id}
                  delivery={delivery}
                  showCourier={false}
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-3">
            {completedToday.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p>Aún no has registrado entregas hoy</p>
              </div>
            ) : (
              completedToday.map(delivery => (
                <DeliveryCard
                  key={delivery.id}
                  delivery={delivery}
                  showCourier={false}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
