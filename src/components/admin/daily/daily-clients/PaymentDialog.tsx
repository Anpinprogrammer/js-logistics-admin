import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/utils';
import {
  DollarSign,
  Loader2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClients, useUpdateClientBalance, useClientDailySummary } from '@/hooks/useClientsTest';

interface PaymentDialogProps {
    paymentDialog: boolean;
    setPaymentDialog: React.Dispatch<React.SetStateAction<boolean>>;
    paymentClient: any;
    setPaymentClient: React.Dispatch<React.SetStateAction<any>>;
}

const PaymentDialog = ({ paymentDialog, setPaymentDialog, paymentClient, setPaymentClient } : PaymentDialogProps) => {

    const updateBalance = useUpdateClientBalance()
    const [paymentDetail, setPaymentDetail] = useState({
        paymentType: 'to-client',
        amount: '',
        desc: ''
    })

  const handleRegisterPayment = async () => {
    if (!paymentClient || !paymentDetail.amount) return;
    const amount = parseFloat(paymentDetail.amount);
    const current = paymentClient.currentBalance;

    // "from_client": client pays us → reduces what they are owed or adds to their debt
    //   positive balance (we owe them) decreases; negative balance (they owe us) decreases in abs value
    // "to_client": we pay them → reduces our payable (positive balance decreases)
    //   or adds to their owed amount if balance was already negative
    const newBalance =
      paymentDetail.paymentType === 'from_client'
        ? current - amount   // client pays us → we owe them less (or they owe us more)
        : current + amount;  // we pay them → credit increases / their debt decreases

    await updateBalance.mutateAsync({ id: paymentClient.client.id, balance: newBalance });
    setPaymentDialog(false);
    setPaymentClient(null);
    setPaymentDetail({
         paymentType: 'to-client',
        amount: '',
        desc: ''
    });
  };

  return (
     <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              {paymentClient && `Ajuste de saldo para ${paymentClient.client.name}`}
            </DialogDescription>
          </DialogHeader>

          {paymentClient && (
            <div className="space-y-4 py-2">
              {/* Current state summary */}
              <div className="space-y-2 p-3 rounded-lg bg-muted/50 border border-border text-sm">
                {paymentClient.hasActivityToday && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cobrado hoy:</span>
                      <span className="text-success">{formatCurrency(paymentClient.totalCollected)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prestamos hoy:</span>
                      <span className="text-destructive">{formatCurrency(paymentClient.totalLoans)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Servicio hoy:</span>
                      <span className="text-destructive">{formatCurrency(paymentClient.totalServices)}</span>
                    </div>
                    {/** 
                    <div className="flex justify-between font-medium">
                      <span className="text-muted-foreground">Neto del día:</span>
                      <span className={paymentClient.dailyNet >= 0 ? 'text-success' : 'text-destructive'}>
                        {formatCurrency(paymentClient.dailyNet)}
                      </span>
                    </div>
                    */}
                    <Separator />
                  </>
                )}
                <div className="flex justify-between font-semibold">
                  <span>Saldo acumulado:</span>
                  <span className={paymentClient.currentBalance >= 0 ? 'text-success' : 'text-destructive'}>
                    {formatCurrency(paymentClient.currentBalance)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {paymentClient.currentBalance > 0
                    ? 'Saldo a favor del cliente (nosotros debemos pagar)'
                    : paymentClient.currentBalance < 0
                    ? 'Saldo a cargo del cliente (ellos deben pagar)'
                    : 'Sin saldo pendiente'}
                </div>
              </div>

              {/* Payment type */}
              <div className="space-y-2">
                <Label>Tipo de pago</Label>
                <Select
                  value={paymentDetail.paymentType}
                  onValueChange={(v) => setPaymentDetail({ ...paymentDetail, paymentType: v as 'from_client' | 'to_client' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="from_client">
                      <span className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-success" />
                        Cliente nos paga
                      </span>
                    </SelectItem>
                    <SelectItem value="to_client">
                      <span className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Nosotros pagamos al cliente
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label>Monto *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    className="pl-9"
                    value={paymentDetail.amount}
                    onChange={(e) => setPaymentDetail({ ...paymentDetail, amount: e.target.value })}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input
                    value={paymentDetail.desc}
                        onChange={(e) => setPaymentDetail({ ...paymentDetail, desc: e.target.value })}
                        placeholder="Ej: Se aumenta el dinero en caja"
                      />
                </div>

              {/* Preview new balance */}
              {paymentDetail.amount !== '' && (() => {
                const amount = parseFloat(paymentDetail.amount) || 0;
                const newBalance =
                  paymentDetail.paymentType === 'from_client'
                    ? paymentClient.currentBalance - amount
                    : paymentClient.currentBalance + amount;
                return (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border text-sm">
                    <span className="text-muted-foreground">Nuevo saldo:</span>
                    <span className={cn('font-semibold', newBalance >= 0 ? 'text-success' : 'text-destructive')}>
                      {formatCurrency(newBalance)}
                    </span>
                  </div>
                );
              })()}

              <Button
                className="w-full"
                onClick={handleRegisterPayment}
                disabled={updateBalance.isPending || paymentDetail.amount === ''}
              >
                {updateBalance.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Registrar Pago
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
  )
}

export default PaymentDialog