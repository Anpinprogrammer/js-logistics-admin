import { useCouriers } from '@/hooks/useCouriers';
import { useDeliveries, getCurrentWeekDates } from '@/hooks/useDeliveries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, Phone, Package, DollarSign, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function CouriersList() {
  const { data: couriers, isLoading } = useCouriers();
  const { data: deliveries } = useDeliveries();
  const { weekStart, weekEnd } = getCurrentWeekDates();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Truck className="w-6 h-6 text-primary" />
          Mensajeros
        </h1>
        <p className="text-muted-foreground">
          Cuadre semanal: {format(new Date(weekStart), 'd MMM', { locale: es })} - {format(new Date(weekEnd), 'd MMM yyyy', { locale: es })}
        </p>
      </div>

      {couriers?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No hay mensajeros registrados. Los nuevos usuarios se registran como mensajeros automáticamente.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {couriers?.map((courier) => {
            const courierDeliveries = deliveries?.filter(
              d => d.courier_id === courier.user_id && 
                   d.status === 'completed' && 
                   d.week_start === weekStart
            ) || [];

            const stats = {
              total: courierDeliveries.length,
              cash: courierDeliveries
                .filter(d => d.payment_method === 'cash')
                .reduce((sum, d) => sum + Number(d.amount), 0),
              transferCourier: courierDeliveries
                .filter(d => d.payment_method === 'transfer_to_courier')
                .reduce((sum, d) => sum + Number(d.amount), 0),
              transferClient: courierDeliveries
                .filter(d => d.payment_method === 'transfer_to_client')
                .reduce((sum, d) => sum + Number(d.amount), 0),
            };

            return (
              <Card key={courier.user_id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{courier.full_name}</CardTitle>
                      {courier.phone && (
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" />
                          {courier.phone}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="secondary" className="bg-courier-badge/10 text-courier-badge">
                      Mensajero
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Deliveries count */}
                  <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="w-4 h-4" />
                      Entregas
                    </span>
                    <span className="font-semibold">{stats.total}</span>
                  </div>

                  {/* Cash to collect */}
                  <div className="flex items-center justify-between p-2 rounded bg-cash/5 border border-cash/20">
                    <span className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-cash" />
                      Efectivo a entregar
                    </span>
                    <span className="font-bold text-cash">${stats.cash.toFixed(2)}</span>
                  </div>

                  {/* Transfers to courier */}
                  <div className="flex items-center justify-between p-2 rounded bg-transfer-courier/5">
                    <span className="text-sm text-muted-foreground">Trans. Mensajero</span>
                    <span className="font-medium">${stats.transferCourier.toFixed(2)}</span>
                  </div>

                  {/* Transfers to client */}
                  <div className="flex items-center justify-between p-2 rounded bg-transfer-client/5">
                    <span className="text-sm text-muted-foreground">Trans. Cliente</span>
                    <span className="font-medium">${stats.transferClient.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
