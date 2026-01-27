import { useState } from 'react';
import { useDeliveries, getCurrentWeekDates } from '@/hooks/useDeliveries';
import { useCouriers } from '@/hooks/useCouriers';
import { useClients } from '@/hooks/useClients';
import { useOperationalCharges } from '@/hooks/useDailyOperations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Package,
  Users,
  Truck,
  Receipt
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const DAILY_DISCOUNT = 20000;

export function ConsolidatedCash() {
  const [initialBase, setInitialBase] = useState<number>(0);
  const { data: deliveries } = useDeliveries();
  const { data: couriers } = useCouriers();
  const { data: clients } = useClients();
  const { data: operationalCharges } = useOperationalCharges();
  const { weekStart, weekEnd } = getCurrentWeekDates();

  // Get advances for the week
  const { data: advances } = useQuery({
    queryKey: ['salary-advances', weekStart, weekEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('salary_advances')
        .select('*')
        .gte('created_at', weekStart)
        .lte('created_at', weekEnd);
      if (error) throw error;
      return data;
    },
  });

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  // Filter deliveries for current week - include both 'completed' and 'not_delivered_collected' (ida perdida)
  const weeklyDeliveries = deliveries?.filter(d => 
    (d.status === 'completed' || d.status === 'not_delivered_collected') && 
    d.week_start === weekStart
  ) || [];

  // Calculate totals by payment method
  const cashDeliveries = weeklyDeliveries.filter(d => d.payment_method === 'cash');
  const transferCourierDeliveries = weeklyDeliveries.filter(d => d.payment_method === 'transfer_to_courier');
  const transferClientDeliveries = weeklyDeliveries.filter(d => d.payment_method === 'transfer_to_client');

  // Total collected
  const totalCashCollected = cashDeliveries.reduce(
    (sum, d) => sum + Number(d.received_amount || d.total_to_collect), 0
  );
  
  const totalTransferJSCollected = transferCourierDeliveries.reduce(
    (sum, d) => sum + Number(d.received_amount || d.total_to_collect), 0
  );
  
  const totalCompanyCash = totalCashCollected + totalTransferJSCollected;
  
  // Partial deliveries = difference between total_to_collect and received_amount
  const cashAndJSDeliveries = [...cashDeliveries, ...transferCourierDeliveries];
  const partialDeliveries = cashAndJSDeliveries.reduce((sum, d) => {
    const expected = Number(d.total_to_collect);
    const received = Number(d.received_amount || d.total_to_collect);
    const difference = expected - received;
    return sum + (difference > 0 ? difference : 0);
  }, 0);

  // Calculate service values and profits
  const totalServiceValue = weeklyDeliveries.reduce((sum, d) => sum + Number(d.service_value || 0), 0);
  const companyProfit = totalServiceValue * 0.3; // 30% for company
  const courierSalaries = totalServiceValue * 0.7; // 70% for couriers

  // Calculate unique days worked and discounts
  const daysWithDeliveries = new Set(weeklyDeliveries.map(d => d.delivery_date)).size;
  const courierDays = new Map<string, number>();
  weeklyDeliveries.forEach(d => {
    const key = `${d.courier_id}-${d.delivery_date}`;
    if (!courierDays.has(d.courier_id)) {
      courierDays.set(d.courier_id, new Set([d.delivery_date]).size);
    } else {
      const existingDays = new Set<string>();
      weeklyDeliveries
        .filter(wd => wd.courier_id === d.courier_id)
        .forEach(wd => existingDays.add(wd.delivery_date));
      courierDays.set(d.courier_id, existingDays.size);
    }
  });
  
  // Total daily discounts across all couriers
  const totalDailyDiscounts = Array.from(courierDays.values()).reduce((sum, days) => sum + (days * DAILY_DISCOUNT), 0);
  
  // Total advances
  const totalAdvances = advances?.reduce((sum, a) => sum + Number(a.amount), 0) || 0;
  
  // Operational charges
  const totalOperationalCharges = operationalCharges?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
  
  // Clients with debt (accounts receivable)
  const clientsWithDebt = clients?.filter(c => Number(c.balance) > 0) || [];
  const totalAccountsReceivable = clientsWithDebt.reduce((sum, c) => sum + Number(c.balance), 0);

  // Final balance calculation
  const expectedBalance = initialBase + totalCompanyCash;
  const actualBalance = expectedBalance - partialDeliveries - totalOperationalCharges;
  const isPositive = actualBalance >= 0;

  // Net payroll
  const netPayroll = Math.max(0, courierSalaries - totalDailyDiscounts - totalAdvances);

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

  // Courier breakdown
  const courierBreakdown = couriers?.map(courier => {
    const courierDeliveries = weeklyDeliveries.filter(d => d.courier_id === courier.user_id);
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
    
    // Service value and salary
    const serviceValue = courierDeliveries.reduce((sum, d) => sum + Number(d.service_value || 0), 0);
    const salary70 = serviceValue * 0.7;
    const daysWorked = new Set(courierDeliveries.map(d => d.delivery_date)).size;
    const dailyDiscounts = daysWorked * DAILY_DISCOUNT;
    const courierAdvances = advances?.filter(a => a.courier_id === courier.user_id)
      .reduce((sum, a) => sum + Number(a.amount), 0) || 0;
    const netSalary = Math.max(0, salary70 - dailyDiscounts - courierAdvances);
    
    return {
      id: courier.user_id,
      name: courier.full_name,
      deliveries: courierDeliveries.length,
      cashCount: courierCashDeliveries.length,
      jsCount: courierJSDeliveries.length,
      collected,
      expected,
      difference,
      serviceValue,
      salary70,
      daysWorked,
      dailyDiscounts,
      advances: courierAdvances,
      netSalary,
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-success/5">
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Ingresos (Servicios)</div>
            <div className="text-2xl font-bold text-success">{formatCurrency(totalServiceValue)}</div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5">
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Ganancia JS (30%)</div>
            <div className="text-2xl font-bold text-primary">{formatCurrency(companyProfit)}</div>
          </CardContent>
        </Card>
        <Card className="bg-warning/5">
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Nómina (70%)</div>
            <div className="text-2xl font-bold text-warning">{formatCurrency(netPayroll)}</div>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5">
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Cuentas x Cobrar</div>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalAccountsReceivable)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="cash" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cash">Caja</TabsTrigger>
          <TabsTrigger value="payroll">Sueldos</TabsTrigger>
          <TabsTrigger value="charges">Cargos</TabsTrigger>
          <TabsTrigger value="receivables">Por Cobrar</TabsTrigger>
        </TabsList>

        <TabsContent value="cash">
          {/* Main Calculation Card */}
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-cash" />
                Cálculo de Caja
              </CardTitle>
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
                      step="1000"
                      value={initialBase || ''}
                      onChange={(e) => setInitialBase(Number(e.target.value) || 0)}
                      className="pl-8 text-lg font-semibold"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-cash/10">
                  <Plus className="w-5 h-5 text-cash" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Total cobrado (Efectivo + Trans. JS)</p>
                  <p className="text-xl font-bold text-cash">+{formatCurrency(totalCompanyCash)}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-warning/10">
                  <Minus className="w-5 h-5 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Faltantes en entregas</p>
                  <p className="text-xl font-bold text-warning">-{formatCurrency(partialDeliveries)}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10">
                  <Minus className="w-5 h-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Cargos operativos</p>
                  <p className="text-xl font-bold text-destructive">-{formatCurrency(totalOperationalCharges)}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full ${isPositive ? 'bg-cash/20' : 'bg-destructive/20'}`}>
                  <Equal className={`w-6 h-6 ${isPositive ? 'text-cash' : 'text-destructive'}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {isPositive ? 'Saldo pendiente de entregar' : 'Faltante en caja'}
                  </p>
                  <p className={`text-3xl font-bold ${isPositive ? 'text-cash' : 'text-destructive'}`}>
                    {formatCurrency(Math.abs(actualBalance))}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Card className="border-cash/30">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Efectivo</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.cash.collected)}</p>
                    <p className="text-xs text-muted-foreground">{stats.cash.count} entregas</p>
                  </div>
                  <div className="p-3 rounded-xl bg-cash/10">
                    <DollarSign className="w-5 h-5 text-cash" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-transfer-courier/30">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Trans. JS</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.transferJS.collected)}</p>
                    <p className="text-xs text-muted-foreground">{stats.transferJS.count} entregas</p>
                  </div>
                  <div className="p-3 rounded-xl bg-transfer-courier/10">
                    <TrendingUp className="w-5 h-5 text-transfer-courier" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-transfer-client/30">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Trans. Cliente</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.transferClient.total)}</p>
                    <p className="text-xs text-muted-foreground">{stats.transferClient.count} entregas</p>
                  </div>
                  <div className="p-3 rounded-xl bg-transfer-client/10">
                    <TrendingDown className="w-5 h-5 text-transfer-client" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payroll">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                Sueldos por Mensajero
              </CardTitle>
              <CardDescription>
                Detalle del 70% del servicio - descuentos - adelantos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {courierBreakdown.map((courier) => (
                  <div 
                    key={courier.id}
                    className="p-4 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{courier.name}</span>
                      <Badge variant="default" className="text-lg">
                        {formatCurrency(courier.netSalary)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-sm text-muted-foreground">
                      <div>
                        <span className="block text-xs">Servicios</span>
                        <span className="font-medium text-foreground">{formatCurrency(courier.serviceValue)}</span>
                      </div>
                      <div>
                        <span className="block text-xs">70%</span>
                        <span className="font-medium text-success">{formatCurrency(courier.salary70)}</span>
                      </div>
                      <div>
                        <span className="block text-xs">Desc. ({courier.daysWorked}d)</span>
                        <span className="font-medium text-destructive">-{formatCurrency(courier.dailyDiscounts)}</span>
                      </div>
                      <div>
                        <span className="block text-xs">Adelantos</span>
                        <span className="font-medium text-destructive">-{formatCurrency(courier.advances)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg">
                <span className="font-medium">Total Nómina</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(netPayroll)}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charges">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                Cargos Operativos y Adelantos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Operational Charges */}
              <div>
                <h4 className="font-medium mb-2">Cargos Operativos del Día</h4>
                {operationalCharges && operationalCharges.length > 0 ? (
                  <div className="space-y-2">
                    {operationalCharges.map(charge => (
                      <div key={charge.id} className="flex justify-between items-center p-3 bg-muted/50 rounded">
                        <span>{charge.description}</span>
                        <span className="font-medium">{formatCurrency(Number(charge.amount))}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center p-3 bg-destructive/10 rounded font-medium">
                      <span>Total Cargos</span>
                      <span className="text-destructive">{formatCurrency(totalOperationalCharges)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No hay cargos registrados hoy</p>
                )}
              </div>
              
              <Separator />
              
              {/* Advances */}
              <div>
                <h4 className="font-medium mb-2">Adelantos de la Semana</h4>
                {advances && advances.length > 0 ? (
                  <div className="space-y-2">
                    {advances.map(advance => {
                      const courierName = couriers?.find(c => c.user_id === advance.courier_id)?.full_name || 'Desconocido';
                      return (
                        <div key={advance.id} className="flex justify-between items-center p-3 bg-muted/50 rounded">
                          <div>
                            <span className="font-medium">{courierName}</span>
                            <p className="text-xs text-muted-foreground">{advance.reason}</p>
                          </div>
                          <span className="font-medium">{formatCurrency(Number(advance.amount))}</span>
                        </div>
                      );
                    })}
                    <div className="flex justify-between items-center p-3 bg-warning/10 rounded font-medium">
                      <span>Total Adelantos</span>
                      <span className="text-warning">{formatCurrency(totalAdvances)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No hay adelantos esta semana</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receivables">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Cuentas por Cobrar
              </CardTitle>
              <CardDescription>
                Clientes con saldo pendiente (idas perdidas + transferencias directas)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {clientsWithDebt.length > 0 ? (
                <div className="space-y-2">
                  {clientsWithDebt.map(client => (
                    <div key={client.id} className="flex justify-between items-center p-3 bg-destructive/5 rounded border border-destructive/20">
                      <span className="font-medium">{client.name}</span>
                      <span className="font-bold text-destructive">{formatCurrency(Number(client.balance))}</span>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center p-4 bg-destructive/10 rounded font-medium">
                    <span>Total por Cobrar</span>
                    <span className="text-xl text-destructive">{formatCurrency(totalAccountsReceivable)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-success/50" />
                  <p>No hay cuentas por cobrar 🎉</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
