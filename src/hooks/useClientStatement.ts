import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientStatement {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  balance: number;
  totalCollected: number;
  totalServices: number;
  totalLostTrips: number;
  accountsPayable: number; // Saldo a favor (what we owe client)
  accountsReceivable: number; // Deudas (what client owes us)
  deliveries: ClientDelivery[];
}

export interface ClientDelivery {
  id: string;
  delivery_date: string;
  recipient_name: string | null;
  status: string;
  payment_method: string;
  service_value: number;
  total_to_collect: number;
  received_amount: number | null;
  notes: string | null;
  courier_name?: string;
}

export function useClientStatement(clientId: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['client-statement', clientId, startDate, endDate],
    queryFn: async () => {
      // Get client info
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
      
      if (clientError) throw clientError;
      
      // Get deliveries for this client
      let query = supabase
        .from('deliveries')
        .select('*')
        .eq('client_id', clientId)
        .order('delivery_date', { ascending: false });
      
      if (startDate) {
        query = query.gte('delivery_date', startDate);
      }
      if (endDate) {
        query = query.lte('delivery_date', endDate);
      }
      
      const { data: deliveries, error: deliveriesError } = await query;
      if (deliveriesError) throw deliveriesError;
      
      // Get courier names
      const courierIds = [...new Set(deliveries?.map(d => d.courier_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', courierIds);
      
      const courierMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      
      // Calculate totals
      let totalCollected = 0;
      let totalServices = 0;
      let totalLostTrips = 0;
      
      const enrichedDeliveries: ClientDelivery[] = (deliveries || []).map(d => {
        // Only count completed deliveries and lost trips with collection
        if (d.status === 'completed' || d.status === 'not_delivered_collected') {
          totalServices += Number(d.service_value) || 0;
          
          if (d.status === 'not_delivered_collected') {
            totalLostTrips += Number(d.total_to_collect) || 0;
          }
          
          // Collected amount (cash or transfer to courier)
          if (d.payment_method === 'cash' || d.payment_method === 'transfer_to_courier') {
            totalCollected += Number(d.received_amount) || 0;
          }
        }
        
        return {
          id: d.id,
          delivery_date: d.delivery_date,
          recipient_name: d.recipient_name,
          status: d.status,
          payment_method: d.payment_method,
          service_value: Number(d.service_value) || 0,
          total_to_collect: Number(d.total_to_collect) || 0,
          received_amount: d.received_amount ? Number(d.received_amount) : null,
          notes: d.notes,
          courier_name: courierMap.get(d.courier_id) || 'Desconocido',
        };
      });
      
      // Calculate accounts
      // Accounts Payable = excess collected (client's favor)
      // Accounts Receivable = balance (client owes us) - from direct transfers + lost trips
      const clientBalance = Number(client.balance) || 0;
      const accountsReceivable = clientBalance > 0 ? clientBalance : 0;
      const accountsPayable = clientBalance < 0 ? Math.abs(clientBalance) : 0;
      
      const statement: ClientStatement = {
        id: client.id,
        name: client.name,
        phone: client.phone,
        address: client.address,
        balance: clientBalance,
        totalCollected,
        totalServices,
        totalLostTrips,
        accountsPayable,
        accountsReceivable,
        deliveries: enrichedDeliveries,
      };
      
      return statement;
    },
    enabled: !!clientId,
  });
}

export function useClientsWithDebt() {
  return useQuery({
    queryKey: ['clients-with-debt'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .gt('balance', 0)
        .order('balance', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}
