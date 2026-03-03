import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import api from '@/services/api';

export interface ClientStatement {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  balance: number;
  totalLostTrips: number;
  totalCollected: number;
  totalServices: number;
  totalLoans: number;
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
  lost_trips: number;
  total_to_collect: number;
  received_amount: number | null;
  loan: number | null;
  notes: string | null;
  courier_id: string;
  courier_name?: string;
}

export function useClientStatement(clientId: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['client-statement', clientId, startDate, endDate],
    queryFn: async (): Promise<ClientStatement> => {
      if(!clientId) throw Error('No clientId provided');

      // Get client info
      const {data: clientResponse} = await api.get<{ data: any }>(`/clients/${clientId}`)
      const client = clientResponse.data 

      if(!client) throw Error('Cliente no encontrado')
      
      // Get deliveries for this client
      const params: Record<string, string> = {} //Record<KeyType, ValueType>
      if(startDate) params.startDate = startDate
      if(endDate) params.endDate = endDate
      const { data: deliveriesResponse } = await api.get<{ data: ClientDelivery[] }>('/deliveries', { params: { client_id: clientId, ...params } })
      const deliveries = deliveriesResponse.data || []
      
      // Get courier names
      const courierIds = [...new Set(deliveries?.map(d => d.courier_id) || [])];
      let courierMap = new Map<string, string>();

      if(courierIds.length > 0){
        const { data: profilesResponse } = await api.get('/couriers')
        const profiles = profilesResponse.data || []
      
        courierMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      }
      
      
      // Calculate totals
      let totalCollected = 0;
      let totalServices = 0;
      let totalLoans = 0;
      
      const enrichedDeliveries: ClientDelivery[] = (deliveries || [])
      .map(d => {
        // Only count completed deliveries and lost trips with collection
        if (d.status === 'completed' || d.status === 'not_delivered_collected') {
          totalServices += Number(d.service_value) || 0;
          totalLoans += Number(d.loan) || 0;

          /**
           * if (d.status === 'not_delivered_collected') {
            totalLostTrips += Number(d.total_to_collect) || 0;
          }
           */
          
          
          
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
          lost_trips: Number(d.lost_trips) || 0,
          total_to_collect: Number(d.total_to_collect) || 0,
          received_amount: d.received_amount ? Number(d.received_amount) : null,
          loan: d.loan ? Number(d.loan) : null,
          notes: d.notes,
          courier_id: d.courier_id,
          courier_name: courierMap.get(d.courier_id) || 'Desconocido',
        };
      });
      
      // Calculate accounts based on transactions
      // Net = totalCollected - totalServices - totalLostTrips
      // If positive: client has credit (saldo a favor / accountsPayable)
      // If negative: client owes us (cuenta por cobrar / accountsReceivable)
      const netFromDeliveries = totalCollected - totalServices - totalLoans - Number(client.service_lost_trips || 0)
      //const netFromDeliveries = totalCollected - totalServices - totalLostTrips;
      
      // Also consider existing balance from direct transfers
      //El balance del cliente lo consideraremos para tener un apartado que de visibilidad a la cantidad que fue transferida al cliente, mas el resultado del estado de cuenta dependera de la resta entre el total recogido por JS Logistics comparado con el total que debia recoger que en nuestro caso es la variable totalServices
      const clientBalance = Number(client.balance) || 0;
      
      
      // Combined: positive means client has money in their favor
      const combinedBalance = netFromDeliveries - clientBalance;
      
      const accountsPayable = netFromDeliveries > 0 ? netFromDeliveries : 0;
      const accountsReceivable = netFromDeliveries < 0 ? Math.abs(netFromDeliveries) : 0;
      
      const statement: ClientStatement = {
        id: client.id,
        name: client.name,
        phone: client.phone,
        address: client.address,
        balance: clientBalance,
        totalLostTrips: client.service_lost_trips,
        totalCollected,
        totalServices,
        totalLoans,
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
      const { data: response } = await api.get<{ data: any[] }>('/clients', {
        params: { minBalance: 1, orderBy: 'balance', order: 'desc' },
      });
      console.log(response.data)
      return response.data;
    },
  });
}
