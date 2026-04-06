import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency, SUB_ACCOUNTS } from '@/utils';
import {
  DollarSign,
  Loader2,
  TrendingDown,
  TrendingUp,
  CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUpdateClientBalance } from '@/hooks/useClientsTest';

interface DailySummary {
  date: string;
  totalCollected: number;
  totalServices: number;
  totalLoans: number;
  net: number;
}

interface PaymentDialogProps {
    paymentDialog: boolean;
    setPaymentDialog: React.Dispatch<React.SetStateAction<boolean>>;
    paymentClient: any;
    setPaymentClient?: React.Dispatch<React.SetStateAction<any>>;
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const PaymentDialog = ({ paymentDialog, setPaymentDialog, paymentClient, setPaymentClient } : PaymentDialogProps) => {

    const updateBalance = useUpdateClientBalance()
    const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())
    const [paymentDetail, setPaymentDetail] = useState({
        paymentType: paymentClient?.currentBalance > 0 ? 'to_client' : 'from_client',
        account: 'cash',
        amount: '',
        desc: ''
    })

    const dailySummaries: DailySummary[] = paymentClient?.dailySummaries ?? []

    // When the dialog opens, reset selections
    useEffect(() => {
      if (paymentDialog) {
        setSelectedDates(new Set())
        setPaymentDetail({ paymentType: paymentClient?.currentBalance > 0 ? 'to_client' : 'from_client', account: 'cash', amount: '', desc: '' })
      }
    }, [paymentDialog])

    // Auto-fill amount from selected days
    useEffect(() => {
      if (selectedDates.size === 0) {
        setPaymentDetail(prev => ({ ...prev, amount: '' }))
      } else {
        const total = dailySummaries
          .filter(d => selectedDates.has(d.date))
          .reduce((sum, d) => sum + d.net, 0)
        setPaymentDetail(prev => ({ ...prev, amount: String(total) }))
      }
    }, [selectedDates])

    const allSelected = dailySummaries.length > 0 && selectedDates.size === dailySummaries.length

    const toggleDate = (date: string) => {
      setSelectedDates(prev => {
        const next = new Set(prev)
        if (next.has(date)) next.delete(date)
        else next.add(date)
        return next
      })
    }

    const toggleAll = () => {
      if (allSelected) {
        setSelectedDates(new Set())
      } else {
        setSelectedDates(new Set(dailySummaries.map(d => d.date)))
      }
    }

  const handleRegisterPayment = async () => {
    if (!paymentClient || !paymentDetail.amount) return;
    const amount = parseFloat(paymentDetail.amount);
    const current = paymentClient.currentBalance;

    const newBalance =
      paymentDetail.paymentType === 'from_client'
        ? current - amount
        : current + amount;

    await updateBalance.mutateAsync({ id: paymentClient.client.id, balance: newBalance });
    setPaymentDialog(false);
    setPaymentClient(null);
  };

  return (
     <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              {paymentClient && `Ajuste de saldo para ${paymentClient.client.name}`}
            </DialogDescription>
          </DialogHeader>

          {paymentClient && (
            <div className="space-y-4 py-2">
              {/* Unpaid days list */}
              {dailySummaries.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4" />
                      Días sin liquidar ({dailySummaries.length})
                    </Label>
                    <button
                      type="button"
                      onClick={toggleAll}
                      className="text-xs text-primary underline-offset-2 hover:underline"
                    >
                      {allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
                    </button>
                  </div>

                  <div className="border rounded-lg divide-y overflow-hidden">
                    {dailySummaries.map((day) => {
                      const isChecked = selectedDates.has(day.date)
                      return (
                        <label
                          key={day.date}
                          className={cn(
                            'flex items-start gap-3 p-3 cursor-pointer transition-colors text-sm',
                            isChecked ? 'bg-primary/5' : 'hover:bg-muted/50'
                          )}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleDate(day.date)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium capitalize">{formatDate(day.date)}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
                              <span>Cobrado: <span className="text-foreground">{formatCurrency(day.totalCollected)}</span></span>
                              <span>Servicio: <span className="text-foreground">{formatCurrency(day.totalServices)}</span></span>
                              {day.totalLoans > 0 && (
                                <span>Préstamos: <span className="text-foreground">{formatCurrency(day.totalLoans)}</span></span>
                              )}
                            </div>
                          </div>
                          <span className={cn('font-semibold shrink-0', day.net >= 0 ? 'text-success' : 'text-destructive')}>
                            {formatCurrency(day.net)}
                          </span>
                        </label>
                      )
                    })}
                  </div>

                  {selectedDates.size > 0 && (
                    <div className="flex justify-between text-sm font-semibold px-1">
                      <span className="text-muted-foreground">{selectedDates.size} día{selectedDates.size > 1 ? 's' : ''} seleccionado{selectedDates.size > 1 ? 's' : ''}:</span>
                      <span className="text-primary">
                        {formatCurrency(
                          dailySummaries
                            .filter(d => selectedDates.has(d.date))
                            .reduce((s, d) => s + d.net, 0)
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Current balance summary */}
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50 border border-border text-sm font-semibold">
                <span>Saldo acumulado:</span>
                <span className={paymentClient.currentBalance >= 0 ? 'text-success' : 'text-destructive'}>
                  {formatCurrency(Math.abs(paymentClient.currentBalance))}
                </span>
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

              {/**Account where money comes in and out */}
              <div className='space-y-2'>
                <Label>Dinero { paymentDetail.paymentType === 'from_client' ? 'ingresa a: ' : 'sale de:' } </Label>
                <div className='flex gap-1'>
                  {SUB_ACCOUNTS.map((account) => (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => setPaymentDetail({ ...paymentDetail, account: account.id })}
                      className={cn(
                        "px-3 py-1 rounded-lg border text-xs font-medium transition-all duration-200",
                        paymentDetail.account === account.id
                        ? cn(account.colorClass, "border-transparent")
                        : "border-border text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {account.label}
                    </button>
                  ))}
                </div>
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
                {selectedDates.size > 0 && (
                  <p className="text-xs text-muted-foreground">Monto calculado automáticamente según los días seleccionados. Puedes ajustarlo manualmente.</p>
                )}
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
                    ? Number(paymentClient.currentBalance) + amount
                    : Number(paymentClient.currentBalance) - amount;
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
