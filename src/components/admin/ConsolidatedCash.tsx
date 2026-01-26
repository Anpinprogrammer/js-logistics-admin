import { useState } from 'react';
import { useDeliveries, getCurrentWeekDates } from '@/hooks/useDeliveries';
import { useCouriers } from '@/hooks/useCouriers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Wallet, 
  Plus, 
  Minus, 
  Equal, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Package
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function ConsolidatedCash() {
  const [initialBase, setInitialBase] = useState<number>(0);
  const { data: deliveries } = useDeliveries();
  const { data: couriers } = useCouriers();
  const { weekStart, weekEnd } = getCurrentWeekDates();

  // Filter completed deliveries for current week
  const weeklyDeliveries = deliveries?.filter(d => 
    d.status === 'completed' && 
    d.week_start === weekStart
  ) || [];

  // Calculate totals by payment method
  const cashDeliveries = weeklyDeliveries.filter(d => d.payment_method === 'cash');
  const transferCourierDeliveries = weeklyDeliveries.filter(d => d.payment_method === 'transfer_to_courier');
  const transferClientDeliveries = weeklyDeliveries.filter(d => d.payment_method === 'transfer_to_client');

  // Total collected = sum of received_amount (what courier actually collected) for cash
  // Plus transfer_to_courier which goes to company cash
  const totalCashCollected = cashDeliveries.reduce(
    (sum, d) => sum + Number(d.received_amount || d.total_to_collect), 0
  );
  
  const totalTransferJSCollected = transferCourierDeliveries.reduce(
    (sum, d) => sum + Number(d.received_amount || d.total_to_collect), 0
  );
  
  // Combined total for company cash (efectivo + transferencias JS)
  const totalCompanyCash = totalCashCollected + totalTransferJSCollected;
  
  // Partial deliveries = difference between total_to_collect and received_amount (for cash + JS transfers)
  const cashAndJSDeliveries = [...cashDeliveries, ...transferCourierDeliveries];
  const partialDeliveries = cashAndJSDeliveries.reduce((sum, d) => {
    const expected = Number(d.total_to_collect);
    const received = Number(d.received_amount || d.total_to_collect);
    const difference = expected - received;
    return sum + (difference > 0 ? difference : 0);
  }, 0);

  // Final balance calculation - now includes JS transfers
  const expectedBalance = initialBase + totalCompanyCash;
  const actualBalance = expectedBalance - partialDeliveries;
  const isPositive = actualBalance >= 0;

  // Stats by payment method
  const stats = {
    cash: {
      count: cashDeliveries.length,
      collected: totalCashCollected,
      expected: cashDeliveries.reduce((sum, d) => sum + Number(d.total_to_collect), 0),
    },
    transferJS: {
      count: transferCourierDeliveries.length,
      collected: totalTransferJSCollected,
      expected: transferCourierDeliveries.reduce((sum, d) => sum + Number(d.total_to_collect), 0),
    },
    transferClient: {
      count: transferClientDeliveries.length,
      total: transferClientDeliveries.reduce((sum, d) => sum + Number(d.total_to_collect), 0),
    },
  };

  // Courier breakdown for cash + JS transfers
  const courierBreakdown = couriers?.map(courier => {
    const courierCashDeliveries = cashDeliveries.filter(d => d.courier_id === courier.user_id);
    const courierJSDeliveries = transferCourierDeliveries.filter(d => d.courier_id === courier.user_id);
    const allCourierDeliveries = [...courierCashDeliveries, ...courierJSDeliveries];
    
    const collected = allCourierDeliveries.reduce(
      (sum, d) => sum + Number(d.received_amount || d.total_to_collect), 0
    );
    const expected = allCourierDeliveries.reduce(
      (sum, d) => sum + Number(d.total_to_collect), 0
    );
    const difference = expected - collected;
    
    return {
      id: courier.user_id,
      name: courier.full_name,
      deliveries: allCourierDeliveries.length,
      cashCount: courierCashDeliveries.length,
      jsCount: courierJSDeliveries.length,
      collected,
      expected,
      difference,
    };
  }).filter(c => c.deliveries > 0) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Wallet className="w-6 h-6 text-primary" />
          Caja Consolidada
        </h1>
        <p className="text-muted-foreground">
          Semana del {format(new Date(weekStart), 'd MMMM', { locale: es })} al {format(new Date(weekEnd), 'd MMMM yyyy', { locale: es })}
        </p>
      </div>

      {/* Main Calculation Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-cash" />
            Cálculo de Caja
          </CardTitle>
          <CardDescription>
            Balance de efectivo para el período actual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Initial Base Input */}
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
              <Wallet className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <Label htmlFor="initial-base" className="text-sm text-muted-foreground">
                Dinero base inicial
              </Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="initial-base"
                  type="number"
                  min="0"
                  step="0.01"
                  value={initialBase || ''}
                  onChange={(e) => setInitialBase(Number(e.target.value) || 0)}
                  className="pl-8 text-lg font-semibold"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Total Collected (Cash + JS Transfers) */}
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-cash/10">
              <Plus className="w-5 h-5 text-cash" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Total cobrado (Efectivo + Trans. JS)
              </p>
              <p className="text-xl font-bold text-cash">
                +${totalCompanyCash.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.cash.count} en efectivo + {stats.transferJS.count} trans. JS
              </p>
            </div>
          </div>

          {/* Partial Deliveries */}
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-warning/10">
              <Minus className="w-5 h-5 text-warning" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Entregas parciales realizadas (faltantes)
              </p>
              <p className="text-xl font-bold text-warning">
                -${partialDeliveries.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                Diferencia entre cobro esperado y recibido
              </p>
            </div>
          </div>

          <Separator />

          {/* Final Balance */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
            <div className={`flex items-center justify-center w-12 h-12 rounded-full ${isPositive ? 'bg-cash/20' : 'bg-destructive/20'}`}>
              <Equal className={`w-6 h-6 ${isPositive ? 'text-cash' : 'text-destructive'}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                {isPositive ? 'Saldo pendiente de entregar' : 'Faltante en caja'}
              </p>
              <p className={`text-3xl font-bold ${isPositive ? 'text-cash' : 'text-destructive'}`}>
                ${Math.abs(actualBalance).toFixed(2)}
              </p>
            </div>
            <Badge 
              variant="outline" 
              className={`text-sm ${isPositive ? 'border-cash text-cash bg-cash/10' : 'border-destructive text-destructive bg-destructive/10'}`}
            >
              {isPositive ? (
                <><CheckCircle className="w-4 h-4 mr-1" /> OK</>
              ) : (
                <><AlertTriangle className="w-4 h-4 mr-1" /> Faltante</>
              )}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cash Stats */}
        <Card className="border-cash/30">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Efectivo</p>
                <p className="text-2xl font-bold">${stats.cash.collected.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.cash.count} entrega{stats.cash.count !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-cash/10">
                <DollarSign className="w-5 h-5 text-cash" />
              </div>
            </div>
            {stats.cash.expected !== stats.cash.collected && (
              <div className="mt-3 p-2 rounded bg-warning/10 text-xs text-warning">
                Esperado: ${stats.cash.expected.toFixed(2)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transfer JS Stats */}
        <Card className="border-transfer-courier/30">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Trans. JS</p>
                <p className="text-2xl font-bold">${stats.transferJS.collected.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.transferJS.count} entrega{stats.transferJS.count !== 1 ? 's' : ''} • Ingresa a caja
                </p>
              </div>
              <div className="p-3 rounded-xl bg-transfer-courier/10">
                <TrendingUp className="w-5 h-5 text-transfer-courier" />
              </div>
            </div>
            {stats.transferJS.expected !== stats.transferJS.collected && (
              <div className="mt-3 p-2 rounded bg-warning/10 text-xs text-warning">
                Esperado: ${stats.transferJS.expected.toFixed(2)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transfer Client Stats */}
        <Card className="border-transfer-client/30">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Trans. Cliente</p>
                <p className="text-2xl font-bold">${stats.transferClient.total.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.transferClient.count} entrega{stats.transferClient.count !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-transfer-client/10">
                <TrendingDown className="w-5 h-5 text-transfer-client" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courier Breakdown */}
      {courierBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Desglose por Mensajero (Efectivo + Trans. JS)
            </CardTitle>
            <CardDescription>
              Detalle del dinero recaudado que ingresa a caja por cada mensajero
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {courierBreakdown.map((courier) => (
                <div 
                  key={courier.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    courier.difference > 0 
                      ? 'bg-warning/5 border-warning/30' 
                      : 'bg-muted/50 border-transparent'
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-medium">{courier.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {courier.cashCount} efectivo + {courier.jsCount} trans. JS
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-cash">${courier.collected.toFixed(2)}</p>
                    {courier.difference > 0 && (
                      <p className="text-xs text-warning">
                        Faltante: ${courier.difference.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
