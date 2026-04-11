import { useState, useEffect } from 'react'
import api from '@/services/api';
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
  Receipt,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PendingSummary {
  id: string;
  date: string;
  total_collected: number;
  total_services: number;
  total_loans: number;
  net: number;
  created_at: string;
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

    const [summaries, setSummaries] = useState<PendingSummary[]>([])
    const [loadingSummaries, setLoadingSummaries] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [submitting, setSubmitting] = useState(false)
    const [paymentDetail, setPaymentDetail] = useState({
        paymentType: paymentClient?.currentBalance > 0 ? 'to_client' : 'from_client',
        account: 'cash',
        amount: '',
        desc: ''
    })

    // Fetch unsettled summaries whenever the dialog opens
    useEffect(() => {
      if (!paymentDialog || !paymentClient?.client?.id) return;

      setSelectedIds(new Set())
      setPaymentDetail({
        paymentType: paymentClient?.currentBalance > 0 ? 'to_client' : 'from_client',
        account: 'cash',
        amount: '',
        desc: ''
      })

      const fetchSummaries = async () => {
        setLoadingSummaries(true)
        try {
          const res = await api.get(`/daily-settlements/client/${paymentClient.client.id}/unsettled`)
          console.log(res.data)
          setSummaries(res.data)
        } catch {
          setSummaries([])
          toast.error('No se pudieron cargar los períodos pendientes')
        } finally {
          setLoadingSummaries(false)
        }
      }

      fetchSummaries()
    }, [paymentDialog, paymentClient?.client?.id])

    // Auto-fill amount from selected summaries
    useEffect(() => {
      if (selectedIds.size === 0) {
        setPaymentDetail(prev => ({ ...prev, amount: '' }))
      } else {
        const total = summaries
          .filter(s => selectedIds.has(s.id))
          .reduce((sum, s) => sum + Number(s.net), 0)
        setPaymentDetail(prev => ({ ...prev, amount: String(Math.abs(total)) }))
      }
    }, [selectedIds, summaries])

    const allSelected = summaries.length > 0 && selectedIds.size === summaries.length

    const toggleSummary = (id: string) => {
      setSelectedIds(prev => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
    }

    const toggleAll = () => {
      if (allSelected) {
        setSelectedIds(new Set())
      } else {
        setSelectedIds(new Set(summaries.map(s => s.id)))
      }
    }

    // Build a label for a summary — if multiple summaries share the same date,
    // append an index so the user can distinguish them.
    const buildLabel = (summary: PendingSummary, index: number) => {
      const transformedDate = new Date(summary.date).toISOString().split('T')[0]
      const sameDayCount = summaries.filter(s => s.date === summary.date).length
      if (sameDayCount <= 1) return transformedDate
      const dayIndex = summaries.filter(s => s.date === summary.date && summaries.indexOf(s) < index).length + 1
      return `${formatDate(summary.date)} — Cuadre ${dayIndex}`
    }

  const handleRegisterPayment = async () => {
    if (!paymentClient || !paymentDetail.amount) return;
    const amount = parseFloat(paymentDetail.amount);

    setSubmitting(true)
    try {
      await api.post(`/daily-settlements/client/${paymentClient.client.id}`, {
        paymentMethod: paymentDetail.account,
        type: paymentDetail.paymentType === 'from_client' ? 'income' : 'expense',
        amount,
        notes: paymentDetail.desc,
        summaryIds: Array.from(selectedIds),
      })
      toast.success('Pago registrado correctamente')
    } catch (error) {
      toast.error('Error al registrar el pago')
      console.log(error)
    } finally {
      setSubmitting(false)
    }
    setPaymentDialog(false);
    if (setPaymentClient) setPaymentClient(null);
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
              {/* Pending summaries list */}
              {loadingSummaries ? (
                <div className="flex items-center justify-center py-6 text-muted-foreground text-sm gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando períodos pendientes…
                </div>
              ) : summaries.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5">
                      <Receipt className="w-4 h-4" />
                      Períodos pendientes ({summaries.length})
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
                    {summaries.map((summary, index) => {
                      const isChecked = selectedIds.has(summary.id)
                      return (
                        <label
                          key={summary.id}
                          className={cn(
                            'flex items-start gap-3 p-3 cursor-pointer transition-colors text-sm',
                            isChecked ? 'bg-primary/5' : 'hover:bg-muted/50'
                          )}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleSummary(summary.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium capitalize">{buildLabel(summary, index)}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
                              <span>Cobrado: <span className="text-foreground">{formatCurrency(summary.total_collected)}</span></span>
                              <span>Servicio: <span className="text-foreground">{formatCurrency(summary.total_services)}</span></span>
                              {summary.total_loans > 0 && (
                                <span>Préstamos: <span className="text-foreground">{formatCurrency(summary.total_loans)}</span></span>
                              )}
                            </div>
                          </div>
                          <span className={cn('font-semibold shrink-0', Number(summary.net) >= 0 ? 'text-success' : 'text-destructive')}>
                            {formatCurrency(Number(Math.abs(summary.net)))}
                          </span>
                        </label>
                      )
                    })}
                  </div>

                  {selectedIds.size > 0 && (
                    <div className="flex justify-between text-sm font-semibold px-1">
                      <span className="text-muted-foreground">
                        {selectedIds.size} período{selectedIds.size > 1 ? 's' : ''} seleccionado{selectedIds.size > 1 ? 's' : ''}:
                      </span>
                      <span className="text-primary">
                        {formatCurrency(
                          Math.abs(
                            summaries
                            .filter(s => selectedIds.has(s.id))
                            .reduce((sum, s) => sum + Number(s.net), 0)
                          )
                        )}
                      </span>
                    </div>
                  )}
                </div>
              ) : null}

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
                {selectedIds.size > 0 && (
                  <p className="text-xs text-muted-foreground">Monto calculado automáticamente. Puedes ajustarlo manualmente.</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input
                    value={paymentDetail.desc}
                    onChange={(e) => setPaymentDetail({ ...paymentDetail, desc: e.target.value })}
                    placeholder="Ej: Cuadre de la mañana"
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
                disabled={submitting || paymentDetail.amount === ''}
              >
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Registrar Pago
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
  )
}

export default PaymentDialog
