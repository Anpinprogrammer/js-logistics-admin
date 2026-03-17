import { useDeliveriesTest, getCurrentWeekDates } from '@/hooks/useDeliveries';
import { useCouriersTest } from '@/hooks/useCouriers';
import { useClientsWithDebt } from '@/hooks/useClientsTest';
import { getTodayDate } from '@/hooks/useDailyOperations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  DollarSign,
  AlertTriangle,
  CreditCard,
  ArrowLeftRight,
  Clock,
  CheckCircle,
  Truck,
  Calendar,
  BarChart3,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  color,
  bg,
}: {
  title: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <Card className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-lg ${bg}`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
        </div>
        <p className="text-2xl font-bold tracking-tight leading-none">{value}</p>
        <p className="text-xs font-medium text-foreground/70 mt-1">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}

function StatusBar({
  label,
  count,
  total,
  barColor,
  textColor,
}: {
  label: string;
  count: number;
  total: number;
  barColor: string;
  textColor: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-semibold ${textColor}`}>
          {count}
          <span className="text-muted-foreground font-normal text-xs ml-1">({pct.toFixed(0)}%)</span>
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function FinancialBar({
  label,
  amount,
  total,
  dotColor,
  barColor,
}: {
  label: string;
  amount: number;
  total: number;
  dotColor: string;
  barColor: string;
}) {
  const pct = total > 0 ? (amount / total) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotColor}`} />
          {label}
        </span>
        <span className="font-semibold">
          ${amount.toFixed(2)}
          <span className="text-muted-foreground font-normal text-xs ml-1">({pct.toFixed(0)}%)</span>
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminDashboard() {
  const { data: deliveries } = useDeliveriesTest();
  const { data: couriers } = useCouriersTest();
  const { data: debtClients } = useClientsWithDebt();

  const { weekStart, weekEnd } = getCurrentWeekDates();
  const today = getTodayDate();

  // ── Deliveries this week (completed + ida perdida) ──
  const weeklyDeliveries =
    deliveries?.filter((d) => {
      const ws = new Date(d.week_start).toISOString().split('T')[0];
      return (
        (d.status === 'completed' || d.status === 'not_delivered_collected') &&
        ws === weekStart
      );
    }) ?? [];

  // ── All deliveries this week (any status) ──
  const allWeekDeliveries =
    deliveries?.filter((d) => {
      const ws = new Date(d.week_start).toISOString().split('T')[0];
      return ws === weekStart;
    }) ?? [];

  // ── Today's deliveries ──
  const todayDeliveries = deliveries?.filter((d) => d.delivery_date === today) ?? [];
  const todayCompleted = todayDeliveries.filter((d) => d.status === 'completed').length;
  const todayPending = todayDeliveries.filter((d) => d.status === 'pending').length;

  // ── Status counts ──
  const pendingCount = allWeekDeliveries.filter((d) => d.status === 'pending').length;
  const completedCount = allWeekDeliveries.filter((d) => d.status === 'completed').length;
  const cancelledCount = allWeekDeliveries.filter((d) => d.status === 'cancelled').length;
  const lostCollectedCount = allWeekDeliveries.filter(
    (d) => d.status === 'not_delivered_collected'
  ).length;
  const lostNoCollectionCount = allWeekDeliveries.filter(
    (d) => d.status === 'not_delivered_no_collection'
  ).length;

  // ── Financial totals ──
  const totalCash = weeklyDeliveries
    .filter((d) => d.payment_method === 'cash')
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const totalTransfersCourier = weeklyDeliveries
    .filter((d) => d.payment_method === 'transfer_to_courier')
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const totalTransfersClient = weeklyDeliveries
    .filter((d) => d.payment_method === 'transfer_to_client')
    .reduce((sum, d) => sum + Number(d.service_value), 0);

  const totalRevenue = totalCash + totalTransfersCourier + totalTransfersClient;

  const totalDebt =
    Math.abs(debtClients?.reduce((sum, c) => sum + Number(c.balance), 0) ?? 0);

  // ── Courier rows sorted by deliveries ──
  const courierRows = (couriers ?? [])
    .map((courier) => {
      const delivered = weeklyDeliveries.filter((d) => d.courier_id === courier.user_id);
      const cash = delivered
        .filter((d) => d.payment_method === 'cash')
        .reduce((sum, d) => sum + Number(d.amount), 0);
      const total = delivered.reduce((sum, d) => sum + Number(d.amount), 0);
      const todayCnt = todayDeliveries.filter(
        (d) => d.courier_id === courier.user_id && d.status === 'completed'
      ).length;
      const pendingCnt = allWeekDeliveries.filter(
        (d) => d.courier_id === courier.user_id && d.status === 'pending'
      ).length;
      return { courier, delivered, cash, total, todayCnt, pendingCnt };
    })
    .sort((a, b) => b.delivered.length - a.delivered.length);

  // ── Debt clients sorted by amount ──
  const sortedDebtClients = (debtClients ?? [])
    .slice()
    .sort((a, b) => Math.abs(Number(b.balance)) - Math.abs(Number(a.balance)));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Panel de Control</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Semana:{' '}
            {format(new Date(weekStart + 'T12:00:00'), "d 'de' MMM", { locale: es })} —{' '}
            {format(new Date(weekEnd + 'T12:00:00'), "d 'de' MMM yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 border border-border/50 px-3 py-2 rounded-lg self-start sm:self-auto">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span className="capitalize">
            {format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })}
          </span>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard
          title="Entregas Semana"
          value={weeklyDeliveries.length}
          sub={`${todayCompleted} completadas hoy`}
          icon={Package}
          color="text-primary"
          bg="bg-primary/10"
        />
        <KpiCard
          title="Pendientes"
          value={pendingCount}
          sub={`${todayPending} pendientes hoy`}
          icon={Clock}
          color={pendingCount > 0 ? 'text-warning' : 'text-success'}
          bg={pendingCount > 0 ? 'bg-warning/10' : 'bg-success/10'}
        />
        <KpiCard
          title="Efectivo"
          value={`$${totalCash.toFixed(0)}`}
          sub="Pendiente de cuadre"
          icon={DollarSign}
          color="text-cash"
          bg="bg-cash/10"
        />
        <KpiCard
          title="Transf. JS"
          value={`$${totalTransfersCourier.toFixed(0)}`}
          sub="Ingreso a caja"
          icon={CreditCard}
          color="text-transfer-courier"
          bg="bg-transfer-courier/10"
        />
        <KpiCard
          title="Transf. Cliente"
          value={`$${totalTransfersClient.toFixed(0)}`}
          sub="A cuenta del cliente"
          icon={ArrowLeftRight}
          color="text-transfer-client"
          bg="bg-transfer-client/10"
        />
        <KpiCard
          title="Deuda Total"
          value={`$${totalDebt.toFixed(0)}`}
          sub={`${debtClients?.length ?? 0} clientes`}
          icon={AlertTriangle}
          color="text-destructive"
          bg="bg-destructive/10"
        />
      </div>

      {/* ── Status + Financial row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-4 h-4 text-primary" />
              Estado de Entregas
            </CardTitle>
            <CardDescription>
              {allWeekDeliveries.length} pedidos totales esta semana
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5">
            <StatusBar
              label="Completadas"
              count={completedCount}
              total={allWeekDeliveries.length}
              barColor="bg-success"
              textColor="text-success"
            />
            <StatusBar
              label="Pendientes"
              count={pendingCount}
              total={allWeekDeliveries.length}
              barColor="bg-warning"
              textColor="text-warning"
            />
            <StatusBar
              label="Ida perdida (cobrada)"
              count={lostCollectedCount}
              total={allWeekDeliveries.length}
              barColor="bg-transfer-courier"
              textColor="text-transfer-courier"
            />
            <StatusBar
              label="No entregada s/cobro"
              count={lostNoCollectionCount}
              total={allWeekDeliveries.length}
              barColor="bg-muted-foreground"
              textColor="text-muted-foreground"
            />
            <StatusBar
              label="Canceladas"
              count={cancelledCount}
              total={allWeekDeliveries.length}
              barColor="bg-destructive"
              textColor="text-destructive"
            />
          </CardContent>
        </Card>

        {/* Financial breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="w-4 h-4 text-primary" />
              Resumen Financiero
            </CardTitle>
            <CardDescription>Ingresos de la semana en curso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FinancialBar
              label="Efectivo"
              amount={totalCash}
              total={totalRevenue}
              dotColor="bg-cash"
              barColor="bg-cash"
            />
            <FinancialBar
              label="Transferencia JS"
              amount={totalTransfersCourier}
              total={totalRevenue}
              dotColor="bg-transfer-courier"
              barColor="bg-transfer-courier"
            />
            <FinancialBar
              label="Transferencia Cliente"
              amount={totalTransfersClient}
              total={totalRevenue}
              dotColor="bg-transfer-client"
              barColor="bg-transfer-client"
            />
            <div className="pt-3 mt-1 border-t flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span>Total ingresos</span>
              </div>
              <span className="text-xl font-bold">${totalRevenue.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Couriers + Debt row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Courier performance */}
        <Card className="flex flex-col" style={{ height: 440 }}>
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="w-4 h-4 text-primary" />
              Rendimiento Mensajeros
            </CardTitle>
            <CardDescription>Entregas completadas esta semana</CardDescription>
          </CardHeader>
          <CardContent className="overflow-y-auto flex-1">
            {courierRows.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No hay mensajeros registrados
              </p>
            ) : (
              <div className="space-y-2">
                {courierRows.map(({ courier, delivered, cash, total, todayCnt, pendingCnt }) => (
                  <div
                    key={courier.user_id}
                    className="p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors border border-border/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{courier.full_name}</p>
                          {pendingCnt > 0 && (
                            <Badge
                              variant="outline"
                              className="text-xs text-warning border-warning px-1.5 py-0"
                            >
                              {pendingCnt} pend.
                            </Badge>
                          )}
                          {todayCnt > 0 && (
                            <Badge
                              variant="outline"
                              className="text-xs text-primary border-primary px-1.5 py-0"
                            >
                              {todayCnt} hoy
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-success" />
                            {delivered.length} entregas
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-cash" />
                            ${cash.toFixed(0)} efectivo
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-sm">${total.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">total</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clients with debt */}
        <Card className="flex flex-col" style={{ height: 440 }}>
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Clientes con Deuda
            </CardTitle>
            <CardDescription>
              {debtClients?.length ?? 0} clientes · Total pendiente: ${totalDebt.toFixed(2)}
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-y-auto flex-1">
            {sortedDebtClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <CheckCircle className="w-10 h-10 text-success opacity-40" />
                <p className="text-muted-foreground text-sm">Sin deudas pendientes</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedDebtClients.map((client, i) => {
                  const debt = Math.abs(Number(client.balance));
                  const isHighDebt = totalDebt > 0 && debt / totalDebt > 0.2;
                  return (
                    <div
                      key={client.id}
                      className={`flex items-center justify-between p-3 rounded-lg border gap-3 ${
                        isHighDebt
                          ? 'bg-destructive/5 border-destructive/20'
                          : 'bg-warning/5 border-warning/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                            isHighDebt
                              ? 'bg-destructive/20 text-destructive'
                              : 'bg-warning/20 text-warning'
                          }`}
                        >
                          {i + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{client.name}</p>
                          {client.phone && (
                            <p className="text-xs text-muted-foreground">{client.phone}</p>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`flex-shrink-0 font-bold ${
                          isHighDebt
                            ? 'text-destructive border-destructive'
                            : 'text-warning border-warning'
                        }`}
                      >
                        ${debt.toFixed(2)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
