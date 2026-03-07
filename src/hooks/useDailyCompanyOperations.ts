import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContextTest';
import { toast } from 'sonner';

export interface CompanyDaily {
    account: string;           // cash, bancolombia, nequi
    opening_balance: number;   // plante inicial
    total_income: number;      // sumatoria de ingresos
    total_expense: number;     // sumatoria de egresos
    balance: number;           // balance final
    notes: string | null;
    date: string
}

export interface CompanyDailyResponse {
    data: CompanyDaily[]
}

// Get today's date in YYYY-MM-DD format
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function useDailyCompany(date?: string) {
    const targetDate = date || getTodayDate();

    return useQuery({
        queryKey: ['daily-company-money', targetDate],
        queryFn: async () => {
            const response = await api.get<CompanyDailyResponse>('/daily-settlements/company',
                {
                    params: {
                        date: targetDate
                    }
                }
            );

            return response.data.data;
        }
    })
}

export function useAssignInitialMoney() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async ({ account, type, amount, notes, date } : {
            account: string;
            type: string;
            amount: number;
            notes?: string;
            date?: string;
        }) => {
            if (!user) throw new Error("No user logged in")

            const targetDate = date || getTodayDate();

            const { data } = await api.post('/daily-settlements/company/money-assignment', {
                account,
                type,
                amount,
                notes: notes || null,
                date: targetDate
            })

            return type
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['daily-company-money'] });
            if(variables.type === 'opening_balance' ) {
                toast.success('Plante inicial asignado');
            } else if (variables.type === 'income') {
                toast.success('Ingreso registrado');
            } else {
                toast.success('Gasto o salida registrado');
            }
            
        },
        onError: (error) => {
            toast.error('Error: ' + error.message);
        },
    });
}

export function useUpdateOpeningBalance() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async ({ account, newAmount }: {
            account: string;
            newAmount: string;
        }) => {
            if(!user) throw new Error('No user logged in')

            const targetDate = getTodayDate();

            const { data } = await api.put('/daily-settlements/company/movements/opening-balance', { account, newAmount, date: targetDate })

            return data

        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['daily-company-money'] })
            toast.success(data.message)
        }, 
        onError: (error) => {
            toast.error(error.message)
        }
    })
}

export function useFetchTransactions() {
    const { user } = useAuth()

    return useMutation({
        mutationFn: async ({ account } : { account: string }) => {
            if (!user) throw new Error('No user logged in')
            
            const targetDate = getTodayDate()

            const { data } = await api.get(`/daily-settlements/company/transactions/${account}`, { date: targetDate })
            
            console.log(data.data)
            
        }
    })
}