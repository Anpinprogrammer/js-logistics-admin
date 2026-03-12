import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContextTest';
import { toast } from 'sonner';

import { getTodayDate } from '@/utils';

export function useAssignLoan() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async ({ account, clientName, delivery, amount, notes }: {
            account: string;
            clientName: string;
            delivery: string;
            amount: number;
            notes: string;
        }) => {
            if(!user) throw new Error('No user logged in');

            //Update the delivery
            const { data: updatedDeliveryResponse } = await api.put(`/deliveries/${delivery}`, { loan: amount, notes })

            //Update the cash transactions for the company
            const { data: dailyTransationResponse } = await api.post('/daily-settlements/company/money-assignment', {
                account,
                type: 'expense',
                amount,
                notes: `Prestamo asignado para cliente ${clientName} en pedido ${delivery.substring(0, 8).toUpperCase()}`
            })

            return updatedDeliveryResponse

        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client-daily-loan'] })
            toast.success('Prestamo asignado al ciente')
        },
        onError: (error) => {
            toast.error('Error: ' + error.message);
        }
    }) 
}