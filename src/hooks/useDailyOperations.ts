import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import api from '@/services/api';
//import { useAuth } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContextTest';
import { toast } from 'sonner';

// Types
export interface DailyBaseMoney {
  id: string;
  courier_id: string;
  date: string;
  amount: number;
  assigned_by: string;
  notes: string | null;
  created_at: string;
}

export interface DailyBaseMoneyResponse {
  data: DailyBaseMoney[]
}

export interface PartialDelivery {
  id: string;
  courier_id: string;
  date: string;
  amount: number;
  received_by: string;
  notes: string | null;
  created_at: string;
}

export interface PartialDeliveryResponse {
  data: PartialDelivery[]
}

export interface OperationalCharge {
  id: string;
  date: string;
  description: string;
  amount: number;
  created_by: string;
  created_at: string;
}

export interface DailySettlement {
  id: string;
  courier_id: string;
  date: string;
  base_money: number;
  total_collected: number;
  partial_deliveries_sum: number;
  expected_balance: number;
  actual_balance: number | null;
  difference: number | null;
  is_settled: boolean;
  settled_by: string | null;
  settled_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface DailySettlementResponse {
  data: DailySettlement[]
}

export interface SystemSetting {
  id: string;
  key: string;
  value: { amount: number };
  updated_at: string;
  updated_by: string | null;
}

// Reopen a settled daily settlement for a courier (e.g. when a new delivery is assigned)
export async function reopenDailySettlement(courierId: string, date?: string) {
  const targetDate = date || getTodayDate();
  const { data } = await supabase
    .from('daily_settlements')
    .select('id, is_settled')
    .eq('courier_id', courierId)
    .eq('date', targetDate)
    .eq('is_settled', true)
    .maybeSingle();

  if (data) {
    await supabase
      .from('daily_settlements')
      .update({ is_settled: false, settled_by: null, settled_at: null, actual_balance: null, difference: null })
      .eq('id', data.id);
  }
}

// Get today's date in YYYY-MM-DD format
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Hook: System Settings
export function useSystemSettings() {
  return useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');
      if (error) throw error;
      return data as SystemSetting[];
    },
  });
}

export function useGetSetting(key: string) {
  const { data: settings } = useSystemSettings();
  return settings?.find(s => s.key === key)?.value?.amount ?? null;
}

// Hook: Daily Base Money
export function useDailyBaseMoney(date?: string, courierId?: string) {
  const targetDate = date || getTodayDate();

  return useQuery({
    queryKey: ['daily-base-money', targetDate, courierId],
    queryFn: async () => {
      const response = await api.get<DailyBaseMoneyResponse>(
        '/daily-settlements/get-base-money',
        {
          params: {
            date: targetDate,
            courierId,
          },
        }
      );

      return response.data.data;
    },
  });
}

export function useAssignBaseMoney() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ courierId, courierName, account, amount, notes, date }: { 
      courierId: string; 
      courierName: string;
      amount: number; 
      account: string;
      notes?: string;
      date?: string;
    }) => {
      if (!user) throw new Error('No user logged in');
      
      const targetDate = date || getTodayDate();
      
      const { data: dailyBaseMoneyResponse } = await api.post('/daily-settlements/base-money', {
        courier_id: courierId,
          date: targetDate,
          amount,
          assigned_by: user.id,
          notes: notes || null,
      }) 

      const { data: dailyTransactionsResponse } = await api.post('/daily-settlements/company/money-assignment', {
        account,
        type: 'expense',
        amount,
        notes: `Base para mensajero: ${courierName}`
      })

      return dailyBaseMoneyResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-base-money'] });
      toast.success('Dinero base asignado');
    },
    onError: (error) => {
      toast.error('Error: ' + error.message);
    },
  });
}

// Hook: update base money
export function useUpdateBase() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ courierId, amount } : {
      courierId: string;
      amount: string
    }) => {
      if(!user) throw new Error('No user logged in')
      
      const { data } = await api.put(`/daily-settlements/update-courier-base/${courierId}`, { amount })

      return data
      
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['daily-base-money'] })
      toast.success(data.message)
    },
    onError: (error) => {
      toast.error('Error: ' + error.message);
    }
  })
}

// Hook: Partial Deliveries
export function usePartialDeliveries(date?: string, courierId?: string) {
  const targetDate = date || getTodayDate();
  
  return useQuery({
    queryKey: ['partial-deliveries', targetDate, courierId],
    queryFn: async () => {
      const response = await api.get<PartialDeliveryResponse>(
        '/daily-settlements/get-partial-deliveries', 
        {
          params: {
            date: targetDate,
            courierId,
          },
        }
      )
      
      return response.data.data as PartialDelivery[];
    },
  });

}

export function useRegisterPartialDelivery() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ courierId, courierName, amount, notes, date }: { 
      courierId: string; 
      courierName: string;
      amount: number;
      notes?: string;
      date?: string;
    }) => {
      if (!user) throw new Error('No user logged in');
      
      const targetDate = date || getTodayDate();

      const { data : partialMovementResponse } = await api.post('/daily-settlements/partial-delivery', {
          courier_id: courierId,
          date: targetDate,
          amount,
          received_by: user.id,
          notes: notes || null,
        }
      )

      const { data: partialDailyTransactionResponse } = await api.post('/daily-settlements/company/money-assignment', {
        account: 'cash',
        type: 'income',
        amount,
        notes: `Entrega parcial de mensajero: ${courierName}`
      })
      
      return partialMovementResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partial-deliveries'] });
      toast.success('Entrega parcial registrada');
    },
    onError: (error) => {
      toast.error('Error: ' + error.message);
    },
  });
}

// Hook: Operational Charges
export function useOperationalCharges(date?: string) {
  const targetDate = date || getTodayDate();
  
  return useQuery({
    queryKey: ['operational-charges', targetDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operational_charges')
        .select('*')
        .eq('date', targetDate)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as OperationalCharge[];
    },
  });
}

export function useAddOperationalCharge() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ description, amount, date }: { 
      description: string; 
      amount: number; 
      date?: string;
    }) => {
      if (!user) throw new Error('No user logged in');
      
      const targetDate = date || getTodayDate();
      
      const { data, error } = await supabase
        .from('operational_charges')
        .insert({
          date: targetDate,
          description,
          amount,
          created_by: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operational-charges'] });
      toast.success('Cargo operativo registrado');
    },
    onError: (error) => {
      toast.error('Error: ' + error.message);
    },
  });
}

// Hook: Daily Settlements
export function useDailySettlements(date?: string, courierId?: string) {
  const targetDate = date || getTodayDate();
  
  return useQuery({
    queryKey: ['daily-settlements', targetDate, courierId],
    queryFn: async () => {
      const response = await api.get<DailySettlementResponse>(
        '/daily-settlements',
        {
          params: {
            date: targetDate,
            courierId,
          }
        }
      )

      return response.data.data as DailySettlement[]
    },
    });
}

export function useSettleDaily() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      courierId, 
      date,
      baseMoney,
      totalCollected,
      partialDeliveriesSum,
      actualBalance,
      notes,
    }: { 
      courierId: string; 
      date?: string;
      baseMoney: number;
      totalCollected: number;
      partialDeliveriesSum: number;
      actualBalance: number;
      notes?: string;
    }) => {
      if (!user) throw new Error('No user logged in');
      
      const targetDate = date || getTodayDate();
      const expectedBalance = baseMoney + totalCollected - partialDeliveriesSum;
      const difference = actualBalance - expectedBalance;


      const { data } = await api.post('/daily-settlements', {
        courier_id: courierId,
        date: targetDate,
        base_money: baseMoney,
        total_collected: totalCollected,
        partial_deliveries_sum: partialDeliveriesSum,
        expected_balance: expectedBalance,
        actual_balance: actualBalance,
        difference,
        is_settled: true,
        settled_by: user.id,
        settled_at: new Date().toISOString(),
        notes: notes || null,
      })
      

      // If there's a shortfall (difference < 0), create a salary advance
      let advanceCreated = 0;
      if (difference < 0) {
        const shortfall = Math.abs(difference);
        // Get current week dates for the advance
        const now = new Date();
        const dayOfWeek = now.getDay();
        // Week: Saturday to Friday
        const satOffset = dayOfWeek === 6 ? 0 : -(dayOfWeek + 1);
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() + satOffset);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const formatDate = (d: Date) => d.toISOString().split('T')[0];

        const { error: advanceError } = await supabase
          .from('salary_advances')
          .insert({
            courier_id: courierId,
            amount: shortfall,
            reason: `Faltante cuadre diario ${targetDate}`,
            created_by: user.id,
            week_start: formatDate(weekStart),
            week_end: formatDate(weekEnd),
          });

        if (advanceError) {
          console.error('Error creating advance from settlement:', advanceError);
        } else {
          advanceCreated = shortfall;
        }
      }

      return { settlement: data, advanceCreated, difference };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['daily-settlements'] });
      queryClient.invalidateQueries({ queryKey: ['salary-advances'] });
      
      if (result.advanceCreated > 0) {
        toast.success(`Cuadre cerrado. Faltante de $${result.advanceCreated.toLocaleString()} registrado como adelanto.`);
      } else if (result.difference > 0) {
        toast.success(`Cuadre cerrado. Sobrante de $${result.difference.toLocaleString()}.`);
      } else {
        toast.success('Cuadre cerrado correctamente.');
      }
    },
    onError: (error) => {
      toast.error('Error: ' + error.message);
    },
  });
}
