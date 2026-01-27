import { useCourierDaySummary, useCourierWeeklySummary } from '@/hooks/useCourierSummary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  DollarSign, 
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function CourierSummary() {
  const { data: dayStats, isLoading: loadingDay } = useCourierDaySummary();
  const { data: weekStats, isLoading: loadingWeek } = useCourierWeeklySummary();
  
  if (loadingDay || loadingWeek) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="space-y-6">
      {/* Today's Summary */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-primary" />
            Resumen del Día
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
        <CardContent className="space-y-4">
          {/* Delivery Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Package className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <div className="text-2xl font-bold">{dayStats?.deliveriesToday || 0}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-3 bg-warning/10 rounded-lg">
              <AlertCircle className="w-5 h-5 mx-auto mb-1 text-warning" />
              <div className="text-2xl font-bold text-warning">{dayStats?.pendingToday || 0}</div>
              <div className="text-xs text-muted-foreground">Pendientes</div>
            </div>
            <div className="text-center p-3 bg-success/10 rounded-lg">
              <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-success" />
              <div className="text-2xl font-bold text-success">{dayStats?.completedToday || 0}</div>
              <div className="text-xs text-muted-foreground">Completadas</div>
            </div>
          </div>
          
          <Separator />
          
          {/* Financial Stats */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Por cobrar hoy</span>
              <span className="font-semibold">{formatCurrency(dayStats?.totalToCollect || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Ya cobrado</span>
              <span className="font-semibold text-success">{formatCurrency(dayStats?.totalCollected || 0)}</span>
            </div>
          </div>
          
          <Separator />
          
          {/* Salary Stats */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Sueldo generado (70%)</span>
              <span className="font-medium">{formatCurrency(dayStats?.salaryGenerated || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Descuento diario</span>
              <span className="font-medium text-destructive">-{formatCurrency(dayStats?.dailyDiscount || 0)}</span>
            </div>
            {(dayStats?.advances || 0) > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Adelantos</span>
                <span className="font-medium text-destructive">-{formatCurrency(dayStats?.advances || 0)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Neto estimado del día</span>
              <span className={cn(
                "font-bold text-lg",
                (dayStats?.netEstimated || 0) > 0 ? "text-success" : "text-muted-foreground"
              )}>
                {formatCurrency(dayStats?.netEstimated || 0)}
              </span>
            </div>
          </div>
          
          {/* Balance to Settle */}
          {(dayStats?.baseMoney || 0) > 0 && (
            <>
              <Separator />
              <div className="p-3 bg-primary/5 rounded-lg space-y-2">
                <div className="text-sm font-medium text-primary">Cuadre de Caja</div>
                <div className="flex justify-between items-center text-sm">
                  <span>Dinero base</span>
                  <span>{formatCurrency(dayStats?.baseMoney || 0)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>+ Cobrado</span>
                  <span>{formatCurrency(dayStats?.totalCollected || 0)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>- Entregas parciales</span>
                  <span>{formatCurrency(dayStats?.partialDeliveries || 0)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center font-medium">
                  <span>Saldo a entregar</span>
                  <span className="text-primary">{formatCurrency(dayStats?.balanceToSettle || 0)}</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Weekly Summary */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-primary" />
            Resumen Semanal
          </CardTitle>
          <CardDescription>
            Período: {weekStats?.weekStart} al {weekStats?.weekEnd}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{weekStats?.completedDeliveries || 0}</div>
              <div className="text-xs text-muted-foreground">Entregas completadas</div>
            </div>
            <div className="p-3 bg-warning/10 rounded-lg">
              <div className="text-2xl font-bold">{weekStats?.lostTripsWithCollection || 0}</div>
              <div className="text-xs text-muted-foreground">Idas perdidas</div>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Valor servicios</span>
              <span className="font-medium">{formatCurrency(weekStats?.totalServiceValue || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Tu 70%</span>
              <span className="font-medium text-success">{formatCurrency(weekStats?.totalSalary || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Descuentos diarios</span>
              <span className="font-medium text-destructive">-{formatCurrency(weekStats?.totalDailyDiscounts || 0)}</span>
            </div>
            {(weekStats?.totalAdvances || 0) > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Adelantos</span>
                <span className="font-medium text-destructive">-{formatCurrency(weekStats?.totalAdvances || 0)}</span>
              </div>
            )}
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center">
            <span className="font-medium">Neto a recibir</span>
            <Badge variant="default" className="text-lg px-3 py-1">
              {formatCurrency(weekStats?.netPayable || 0)}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
