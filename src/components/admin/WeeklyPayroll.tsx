import { useState } from 'react';
import { useCouriers } from '@/hooks/useCouriers';
import { useDeliveries, getCurrentWeekDates } from '@/hooks/useDeliveries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Calendar,
  DollarSign,
  Truck,
  CheckCircle2,
  Loader2,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const DAILY_DISCOUNT = 20000;

export function WeeklyPayroll() {
  const { weekStart, weekEnd } = getCurrentWeekDates();
  const { data: couriers, isLoading: loadingCouriers } = useCouriers();
  const { data: deliveries, isLoading: loadingDeliveries } = useDeliveries();
  
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
  
  // Get daily settlements for the week
  const { data: dailySettlements } = useQuery({
    queryKey: ['daily-settlements-week', weekStart, weekEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_settlements')
        .select('*')
        .gte('date', weekStart)
        .lte('date', weekEnd);
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

  const isLoading = loadingCouriers || loadingDeliveries;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filter deliveries for this week
  const weekDeliveries = deliveries?.filter(d => 
    d.delivery_date >= weekStart && 
    d.delivery_date <= weekEnd &&
    (d.status === 'completed' || d.status === 'not_delivered_collected')
  ) || [];
  
  // Calculate payroll per courier
  const payrollData = couriers?.map(courier => {
    const courierDeliveries = weekDeliveries.filter(d => d.courier_id === courier.user_id);
    
    // Get unique days worked
    const daysWorked = new Set(courierDeliveries.map(d => d.delivery_date)).size;
    
    // Calculate service value
    let totalServiceValue = 0;
    let completedCount = 0;
    let lostTripsCount = 0;
    
    courierDeliveries.forEach(d => {
      totalServiceValue += Number(d.service_value) || 0;
      if (d.status === 'completed') completedCount++;
      if (d.status === 'not_delivered_collected') lostTripsCount++;
    });
    
    // Get advances for this courier
    const courierAdvances = advances?.filter(a => a.courier_id === courier.user_id) || [];
    const totalAdvances = courierAdvances.reduce((sum, a) => sum + Number(a.amount), 0);
    
    // Calculate totals
    const salary70 = totalServiceValue * 0.7;
    const dailyDiscounts = daysWorked * DAILY_DISCOUNT;
    const netPayable = Math.max(0, salary70 - dailyDiscounts - totalAdvances);
    
    // Check if all days are settled
    const courierSettlements = dailySettlements?.filter(s => s.courier_id === courier.user_id) || [];
    const allSettled = daysWorked > 0 && courierSettlements.filter(s => s.is_settled).length >= daysWorked;
    
    return {
      courier,
      daysWorked,
      completedCount,
      lostTripsCount,
      totalServiceValue,
      salary70,
      dailyDiscounts,
      totalAdvances,
      netPayable,
      allSettled,
    };
  }) || [];

  // Totals
  const totalPayroll = payrollData.reduce((sum, p) => sum + p.netPayable, 0);
  const totalServices = payrollData.reduce((sum, p) => sum + p.totalServiceValue, 0);
  const companyProfit = totalServices * 0.3;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary" />
          Nómina Semanal
        </h1>
        <p className="text-muted-foreground">
          Período: {new Date(weekStart).toLocaleDateString('es-CO')} - {new Date(weekEnd).toLocaleDateString('es-CO')}
        </p>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Servicios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalServices)}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-success/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Ganancia JS (30%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(companyProfit)}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-warning/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Nómina</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{formatCurrency(totalPayroll)}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Payroll Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            Detalle por Mensajero
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mensajero</TableHead>
                  <TableHead className="text-center">Días</TableHead>
                  <TableHead className="text-center">Entregas</TableHead>
                  <TableHead className="text-right">Servicios</TableHead>
                  <TableHead className="text-right">70%</TableHead>
                  <TableHead className="text-right">Descuentos</TableHead>
                  <TableHead className="text-right">Adelantos</TableHead>
                  <TableHead className="text-right">Neto</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollData.map(({ courier, daysWorked, completedCount, lostTripsCount, totalServiceValue, salary70, dailyDiscounts, totalAdvances, netPayable, allSettled }) => (
                  <TableRow key={courier.user_id}>
                    <TableCell className="font-medium">{courier.full_name}</TableCell>
                    <TableCell className="text-center">{daysWorked}</TableCell>
                    <TableCell className="text-center">
                      <span className="text-success">{completedCount}</span>
                      {lostTripsCount > 0 && <span className="text-warning"> + {lostTripsCount}</span>}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(totalServiceValue)}</TableCell>
                    <TableCell className="text-right text-success">{formatCurrency(salary70)}</TableCell>
                    <TableCell className="text-right text-destructive">-{formatCurrency(dailyDiscounts)}</TableCell>
                    <TableCell className="text-right text-destructive">{totalAdvances > 0 ? `-${formatCurrency(totalAdvances)}` : '-'}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(netPayable)}</TableCell>
                    <TableCell className="text-center">
                      {allSettled ? (
                        <Badge variant="default" className="bg-success"><CheckCircle2 className="w-3 h-3 mr-1" />Cuadrado</Badge>
                      ) : (
                        <Badge variant="outline" className="text-warning border-warning"><AlertCircle className="w-3 h-3 mr-1" />Pendiente</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {payrollData.map(({ courier, daysWorked, completedCount, lostTripsCount, totalServiceValue, salary70, dailyDiscounts, totalAdvances, netPayable, allSettled }) => (
              <div key={courier.user_id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{courier.full_name}</span>
                  {allSettled ? (
                    <Badge variant="default" className="bg-success"><CheckCircle2 className="w-3 h-3 mr-1" />Cuadrado</Badge>
                  ) : (
                    <Badge variant="outline" className="text-warning border-warning"><AlertCircle className="w-3 h-3 mr-1" />Pendiente</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">Días</span>
                    <span>{daysWorked}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">Entregas</span>
                    <span><span className="text-success">{completedCount}</span>{lostTripsCount > 0 && <span className="text-warning"> +{lostTripsCount}</span>}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">Servicios</span>
                    <span>{formatCurrency(totalServiceValue)}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">70%</span>
                    <span className="text-success">{formatCurrency(salary70)}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">Descuentos</span>
                    <span className="text-destructive">-{formatCurrency(dailyDiscounts)}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">Adelantos</span>
                    <span className="text-destructive">{totalAdvances > 0 ? `-${formatCurrency(totalAdvances)}` : '-'}</span>
                  </div>
                </div>
                <div className="flex justify-between p-2 bg-primary/5 rounded font-semibold">
                  <span>Neto a pagar</span>
                  <span>{formatCurrency(netPayable)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Legend */}
      <div className="text-sm text-muted-foreground space-y-1">
        <p>• Entregas completadas y "idas perdidas" cuentan para el cálculo del sueldo</p>
        <p>• Descuento diario: {formatCurrency(DAILY_DISCOUNT)} por día trabajado</p>
        <p>• Solo se puede pagar cuando todos los cuadres del período están cerrados</p>
      </div>
    </div>
  );
}
