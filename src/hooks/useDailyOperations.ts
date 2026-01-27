import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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

export interface PartialDelivery {
  id: string;
  courier_id: string;
  date: string;
  amount: number;
  received_by: string;
  notes: string | null;
  created_at: string;
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

export interface SystemSetting {
  id: string;
  key: string;
  value: { amount: number };
  updated_at: string;
  updated_by: string | null;
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
      let query = supabase
        .from('daily_base_money')
        .select('*')
        .eq('date', targetDate);
      
      if (courierId) {
        query = query.eq('courier_id', courierId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as DailyBaseMoney[];
    },
  });
}

export function useAssignBaseMoney() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ courierId, amount, notes, date }: { 
      courierId: string; 
      amount: number; 
      notes?: string;
      date?: string;
    }) => {
      if (!user) throw new Error('No user logged in');
      
      const targetDate = date || getTodayDate();
      
      const { data, error } = await supabase
        .from('daily_base_money')
        .upsert({
          courier_id: courierId,
          date: targetDate,
          amount,
          assigned_by: user.id,
          notes: notes || null,
        }, {
          onConflict: 'courier_id,date',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
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

// Hook: Partial Deliveries
export function usePartialDeliveries(date?: string, courierId?: string) {
  const targetDate = date || getTodayDate();
  
  return useQuery({
    queryKey: ['partial-deliveries', targetDate, courierId],
    queryFn: async () => {
      let query = supabase
        .from('partial_deliveries')
        .select('*')
        .eq('date', targetDate)
        .order('created_at', { ascending: false });
      
      if (courierId) {
        query = query.eq('courier_id', courierId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as PartialDelivery[];
    },
  });
}

export function useRegisterPartialDelivery() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ courierId, amount, notes, date }: { 
      courierId: string; 
      amount: number; 
      notes?: string;
      date?: string;
    }) => {
      if (!user) throw new Error('No user logged in');
      
      const targetDate = date || getTodayDate();
      
      const { data, error } = await supabase
        .from('partial_deliveries')
        .insert({
          courier_id: courierId,
          date: targetDate,
          amount,
          received_by: user.id,
          notes: notes || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
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
      let query = supabase
        .from('daily_settlements')
        .select('*')
        .eq('date', targetDate);
      
      if (courierId) {
        query = query.eq('courier_id', courierId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as DailySettlement[];
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
      
      const { data, error } = await supabase
        .from('daily_settlements')
        .upsert({
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
        }, {
          onConflict: 'courier_id,date',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-settlements'] });
      toast.success('Cuadre diario guardado');
    },
    onError: (error) => {
      toast.error('Error: ' + error.message);
    },
  });
}
