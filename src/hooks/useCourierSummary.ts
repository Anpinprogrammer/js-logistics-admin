import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
//import { useAuth } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContextTest';
import { getTodayDate } from './useDailyOperations';
import { getCurrentWeekDates } from './useDeliveries';

export interface CourierDaySummary {
  deliveriesToday: number;
  pendingToday: number;
  completedToday: number;
  totalToCollect: number;
  totalCollected: number;
  serviceValueToday: number;
  salaryGenerated: number; // 70% of service value
  dailyDiscount: number; // 20,000 COP
  advances: number;
  netEstimated: number;
  baseMoney: number;
  partialDeliveries: number;
  balanceToSettle: number;
}

export interface CourierWeeklySummary {
  totalDeliveries: number;
  completedDeliveries: number;
  lostTripsWithCollection: number;
  totalServiceValue: number;
  totalSalary: number; // 70% of service
  totalDailyDiscounts: number; // 20,000 * days worked
  totalAdvances: number;
  netPayable: number;
  weekStart: string;
  weekEnd: string;
}

const DAILY_DISCOUNT = 20000; // 20,000 COP per day

export function useCourierDaySummary(courierId?: string, date?: string) {
  const { user } = useAuth();
  const targetCourierId = courierId || user?.id;
  const targetDate = date || getTodayDate();
  
  return useQuery({
    queryKey: ['courier-day-summary', targetCourierId, targetDate],
    queryFn: async () => {
      if (!targetCourierId) throw new Error('No courier ID');
      
      // Get today's deliveries for this courier
      const { data: deliveries, error: deliveriesError } = await supabase
        .from('deliveries')
        .select('*')
        .eq('courier_id', targetCourierId)
        .eq('delivery_date', targetDate);
      
      if (deliveriesError) throw deliveriesError;
      
      // Get base money for today
      const { data: baseMoney } = await supabase
        .from('daily_base_money')
        .select('amount')
        .eq('courier_id', targetCourierId)
        .eq('date', targetDate)
        .maybeSingle();
      
      // Get partial deliveries for today
      const { data: partials } = await supabase
        .from('partial_deliveries')
        .select('amount')
        .eq('courier_id', targetCourierId)
        .eq('date', targetDate);
      
      // Get advances for this week
      const { weekStart, weekEnd } = getCurrentWeekDates();
      const { data: advances } = await supabase
        .from('salary_advances')
        .select('amount')
        .eq('courier_id', targetCourierId)
        .gte('created_at', weekStart)
        .lte('created_at', weekEnd);
      
      // Calculate totals
      const allDeliveries = deliveries || [];
      const pendingDeliveries = allDeliveries.filter(d => d.status === 'pending');
      const completedDeliveries = allDeliveries.filter(d => 
        d.status === 'completed' || d.status === 'not_delivered_collected'
      );
      
      let totalToCollect = 0;
      let totalCollected = 0;
      let serviceValueToday = 0;
      
      allDeliveries.forEach(d => {
        if (d.status === 'pending') {
          totalToCollect += Number(d.total_to_collect) || 0;
        }
        
        if (d.status === 'completed' || d.status === 'not_delivered_collected') {
          serviceValueToday += Number(d.service_value) || 0;
          
          if (d.payment_method === 'cash' || d.payment_method === 'transfer_to_courier') {
            totalCollected += Number(d.received_amount) || 0;
          }
        }
      });
      
      const baseMoneyAmount = Number(baseMoney?.amount) || 0;
      const partialDeliveriesSum = (partials || []).reduce((sum, p) => sum + Number(p.amount), 0);
      const advancesSum = (advances || []).reduce((sum, a) => sum + Number(a.amount), 0);
      
      const salaryGenerated = serviceValueToday * 0.7;
      const netEstimated = salaryGenerated - DAILY_DISCOUNT - advancesSum;
      const balanceToSettle = baseMoneyAmount + totalCollected - partialDeliveriesSum;
      
      const summary: CourierDaySummary = {
        deliveriesToday: allDeliveries.length,
        pendingToday: pendingDeliveries.length,
        completedToday: completedDeliveries.length,
        totalToCollect,
        totalCollected,
        serviceValueToday,
        salaryGenerated,
        dailyDiscount: DAILY_DISCOUNT,
        advances: advancesSum,
        netEstimated: Math.max(0, netEstimated),
        baseMoney: baseMoneyAmount,
        partialDeliveries: partialDeliveriesSum,
        balanceToSettle,
      };
      
      return summary;
    },
    enabled: !!targetCourierId,
  });
}

export function useCourierWeeklySummary(courierId?: string) {
  const { user } = useAuth();
  const targetCourierId = courierId || user?.id;
  const { weekStart, weekEnd } = getCurrentWeekDates();
  
  return useQuery({
    queryKey: ['courier-weekly-summary', targetCourierId, weekStart, weekEnd],
    queryFn: async () => {
      if (!targetCourierId) throw new Error('No courier ID');
      
      // Get week's deliveries
      const { data: deliveries, error: deliveriesError } = await supabase
        .from('deliveries')
        .select('*')
        .eq('courier_id', targetCourierId)
        .gte('delivery_date', weekStart)
        .lte('delivery_date', weekEnd)
        .in('status', ['completed', 'not_delivered_collected', 'not_delivered_no_collection']);
      
      if (deliveriesError) throw deliveriesError;
      
      // Get advances for this week
      const { data: advances } = await supabase
        .from('salary_advances')
        .select('amount')
        .eq('courier_id', targetCourierId)
        .gte('created_at', weekStart)
        .lte('created_at', weekEnd);
      
      // Get unique days worked
      const daysWorked = new Set(
        (deliveries || [])
          .filter(d => d.status === 'completed' || d.status === 'not_delivered_collected')
          .map(d => d.delivery_date)
      ).size;
      
      // Calculate totals
      const allDeliveries = deliveries || [];
      const completed = allDeliveries.filter(d => d.status === 'completed');
      const lostTrips = allDeliveries.filter(d => d.status === 'not_delivered_collected');
      
      let totalServiceValue = 0;
      
      [...completed, ...lostTrips].forEach(d => {
        totalServiceValue += Number(d.service_value) || 0;
      });
      
      const totalSalary = totalServiceValue * 0.7;
      const totalDailyDiscounts = daysWorked * DAILY_DISCOUNT;
      const advancesSum = (advances || []).reduce((sum, a) => sum + Number(a.amount), 0);
      const netPayable = Math.max(0, totalSalary - totalDailyDiscounts - advancesSum);
      
      const summary: CourierWeeklySummary = {
        totalDeliveries: allDeliveries.length,
        completedDeliveries: completed.length,
        lostTripsWithCollection: lostTrips.length,
        totalServiceValue,
        totalSalary,
        totalDailyDiscounts,
        totalAdvances: advancesSum,
        netPayable,
        weekStart,
        weekEnd,
      };
      
      return summary;
    },
    enabled: !!targetCourierId,
  });
}
