import { useDeliveries, getCurrentWeekDates } from '@/hooks/useDeliveries';
import { useCouriers } from '@/hooks/useCouriers';
import { useClientsWithDebt } from '@/hooks/useClients';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  DollarSign, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  CreditCard,
  ArrowLeftRight
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function AdminDashboard() {
  const { data: deliveries } = useDeliveries();
  const { data: couriers } = useCouriers();
  const { data: debtClients } = useClientsWithDebt();
  
  const { weekStart, weekEnd } = getCurrentWeekDates();

  // Calculate weekly stats - include both completed and not_delivered_collected (ida perdida)
  const weeklyDeliveries = deliveries?.filter(d => 
    (d.status === 'completed' || d.status === 'not_delivered_collected') && 
    d.week_start === weekStart
  ) || [];

  const totalCash = weeklyDeliveries
    .filter(d => d.payment_method === 'cash')
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const totalTransfersCourier = weeklyDeliveries
    .filter(d => d.payment_method === 'transfer_to_courier')
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const totalTransfersClient = weeklyDeliveries
    .filter(d => d.payment_method === 'transfer_to_client')
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const totalDebt = debtClients?.reduce((sum, c) => sum + Number(c.balance), 0) || 0;

  const stats = [
    {
      title: 'Entregas Esta Semana',
      value: weeklyDeliveries.length,
      icon: Package,
      description: `${format(new Date(weekStart), 'd MMM', { locale: es })} - ${format(new Date(weekEnd), 'd MMM', { locale: es })}`,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Efectivo Recaudado',
      value: `$${totalCash.toFixed(2)}`,
      icon: DollarSign,
      description: 'Pendiente de cuadre',
      color: 'text-cash',
      bgColor: 'bg-cash/10',
    },
    {
      title: 'Transferencias JS',
      value: `$${totalTransfersCourier.toFixed(2)}`,
      icon: CreditCard,
      description: 'Ingreso a caja empresa',
      color: 'text-transfer-courier',
      bgColor: 'bg-transfer-courier/10',
    },
    {
      title: 'Transferencias Directas',
      value: `$${totalTransfersClient.toFixed(2)}`,
      icon: ArrowLeftRight,
      description: 'A cuenta del cliente',
      color: 'text-transfer-client',
      bgColor: 'bg-transfer-client/10',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen de operaciones - Semana del {format(new Date(weekStart), 'd MMMM', { locale: es })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Couriers summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Mensajeros Activos
            </CardTitle>
            <CardDescription>
              Resumen de entregas por mensajero esta semana
            </CardDescription>
          </CardHeader>
          <CardContent>
            {couriers?.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">
                No hay mensajeros registrados
              </p>
            ) : (
              <div className="space-y-3">
                {couriers?.map((courier) => {
                  const courierDeliveries = weeklyDeliveries.filter(
                    d => d.courier_id === courier.user_id
                  );
                  const courierTotal = courierDeliveries.reduce(
                    (sum, d) => sum + Number(d.amount), 0
                  );
                  
                  return (
                    <div 
                      key={courier.user_id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{courier.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {courierDeliveries.length} entregas
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-base">
                        ${courierTotal.toFixed(2)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clients with debt */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Clientes con Deuda
            </CardTitle>
            <CardDescription>
              Total pendiente: ${totalDebt.toFixed(2)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {debtClients?.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">
                No hay clientes con deuda
              </p>
            ) : (
              <div className="space-y-3">
                {debtClients?.slice(0, 5).map((client) => (
                  <div 
                    key={client.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20"
                  >
                    <div>
                      <p className="font-medium">{client.name}</p>
                      {client.phone && (
                        <p className="text-sm text-muted-foreground">{client.phone}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-warning border-warning">
                      ${Number(client.balance).toFixed(2)}
                    </Badge>
                  </div>
                ))}
                {(debtClients?.length || 0) > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{(debtClients?.length || 0) - 5} clientes más
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
