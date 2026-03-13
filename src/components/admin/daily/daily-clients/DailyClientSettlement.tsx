import { useState } from 'react';
import { useClients, useUpdateClientBalance, useClientDailySummary } from '@/hooks/useClientsTest';
import { useDeliveriesTest } from '@/hooks/useDeliveries';
import { getTodayDate } from '@/utils';
import { useAssignLoan } from '@/hooks/useDailyClientsOperations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  Eye,
  DollarSign,
  Truck,
  Loader2,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ArrowDownCircle,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SUB_ACCOUNTS } from '@/utils';

// Sign convention (mirrors user description):
//   balance > 0  →  we owe the client  (we pay them)
//   balance < 0  →  client owes us     (they pay us)

export function DailyClientSettlement() {
  const today = getTodayDate();
  const { data: clients, isLoading: loadingClients } = useClients(1, 999);
  const [ page, setPage ] = useState(1)
  const { data: clientsSummary, isLoading: loadingClientsSummary } = useClientDailySummary(page, 10)
  const { data: deliveries, isLoading: loadingDeliveries } = useDeliveriesTest();
  const updateBalance = useUpdateClientBalance();
  const assignLoan = useAssignLoan();

  const [detailsDialog, setDetailsDialog] = useState(false);
  const [detailsClient, setDetailsClient] = useState<any>(null);

  const [loanMovements, setLoanMovements] = useState({
    account: 'cash',
    client: '',
    clientName: '',
    delivery: '',
    amount: '',
    notes: '',
  })

  const [loansDialog, setLoansDialog] = useState(false)
  const [loanAmount, setLoanAmount] = useState('')
  const [chargeDialog, setChargeDialog] = useState(false)
  const [chargeAmount, setChargeAmount] = useState('')
  const [debtDialog, setDebtDialog] = useState(false)
  const [debtAmount, setDebtAmount] = useState('')
  const [debtDesc, setDebtDesc] = useState('')
  const [selectedClient, setSelectedClient] = useState('')
  const [chargeClient, setChargeClient] = useState('')
  const [isPending, setIsPneding] = useState(false)

  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentClient, setPaymentClient] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState<'from_client' | 'to_client'>('from_client');

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const isLoading = loadingClientsSummary || loadingDeliveries;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const allClientDeliveries = deliveries?.filter( d => {
    const deliveryDate = new Date(d.delivery_date).toISOString().split('T')[0];
    return (
      deliveryDate === today
    )
  }) || [];

  // Only completed or not_delivered_collected deliveries count financially
  const todayDeliveries = deliveries?.filter(d => {
    const deliveryDate = new Date(d.delivery_date).toISOString().split('T')[0];
    return (
      deliveryDate === today &&
      (d.status === 'completed' || d.status === 'not_delivered_collected')
    );
  }) || [];

  const clientSummariesTest = clientsSummary?.data ?? [];
  const totalPages = Number(clientsSummary?.pagination.totalPages);
  console.log(totalPages)

  // Build per-client summaries — include clients with activity OR with a non-zero balance
  /**
   * 
  
  const clientSummaries = (clients.data ?? [])
    .map(client => {
      const clientDeliveries = todayDeliveries.filter(d => d.client_id === client.id);
      const currentBalance = Number(client.balance) || 0;

      // Only include if there is something to show today or an outstanding balance
      if (clientDeliveries.length === 0 && currentBalance === 0) return null;

      let totalCollected = 0;
      let totalServices = 0;
      let totalLoans = 0;

      clientDeliveries.forEach(d => {
        // Money collected from recipients on client's behalf
        if (d.payment_method === 'cash' || d.payment_method === 'transfer_to_courier') {
          totalCollected += Number(d.received_amount) || 0;
        }
        // Service fee charged to client (only on fully completed deliveries)
        if (d.status === 'completed') {
          totalServices += Number(d.service_value) || 0;
        }

        //Calculate the total of loans whether the service has been delivered or rejected by the final recepient
        if(d.status === 'completed' || d.status === 'not_delivered_collected') {
          totalLoans += Number(d.loan)
        }
      });

      // Positive → we owe client; negative → client owes us
      const dailyNet = totalCollected - totalServices;

      return {
        client,
        clientDeliveries,
        totalCollected,
        totalServices,
        totalLoans,
        dailyNet,
        currentBalance,
        hasActivityToday: clientDeliveries.length > 0,
      };
    })
    .filter(Boolean) as NonNullable<ReturnType<typeof buildSummary>>[];

  // Sort: clients with activity today first, then by abs(balance) descending
  clientSummaries.sort((a, b) => {
    if (a.hasActivityToday !== b.hasActivityToday) return a.hasActivityToday ? -1 : 1;
    return Math.abs(b.currentBalance) - Math.abs(a.currentBalance);
  });
   */

  const handleRegisterPayment = async () => {
    if (!paymentClient || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    const current = paymentClient.currentBalance;

    // "from_client": client pays us → reduces what they are owed or adds to their debt
    //   positive balance (we owe them) decreases; negative balance (they owe us) decreases in abs value
    // "to_client": we pay them → reduces our payable (positive balance decreases)
    //   or adds to their owed amount if balance was already negative
    const newBalance =
      paymentType === 'from_client'
        ? current - amount   // client pays us → we owe them less (or they owe us more)
        : current + amount;  // we pay them → credit increases / their debt decreases

    await updateBalance.mutateAsync({ id: paymentClient.client.id, balance: newBalance });
    setPaymentDialog(false);
    setPaymentClient(null);
    setPaymentAmount('');
  };

  const handleAssignLoan = async () => {
    const { account, client, clientName, delivery, amount, notes } = loanMovements
    try {
      await assignLoan.mutateAsync({
        account,
        clientName,
        delivery,
        amount: parseFloat(amount),
        notes
      })
    } catch (error) {
      console.log(error)
    }
    setLoansDialog(!loansDialog)
    setLoanMovements({
      account: 'cash',
      client: '',
      clientName: '',
      delivery: '',
      amount: '',
      notes: ''
    })
  }

  // Totals for the summary header
  /** 
  const totalNetToday = clientSummaries.reduce((s, c) => s + c.dailyNet, 0);
  const totalOutstanding = clientSummaries.reduce((s, c) => s + c.currentBalance, 0);
  */

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Cuadres Diarios
          </h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('es-CO', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

         <div className="flex flex-wrap gap-2">
                  <Dialog open={loansDialog} onOpenChange={() => {
                    setLoansDialog(!loansDialog)
                    setLoanMovements({
                      account: 'cash',
                      client: '',
                      clientName: '',
                      delivery: '',
                      amount: '',
                      notes: ''
                    })
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <DollarSign className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Agregar</span> Prestamo 
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Asignar Prestamo</DialogTitle>
                        <DialogDescription>
                          Asigna dinero prestado a un cliente durante el dia
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        
                        <div className="space-y-2">
                          <Label>Cliente</Label>
                          <Select value={loanMovements.client} onValueChange={(value) => setLoanMovements({ ...loanMovements, client: value, clientName: clients.data.find( c => c.id === value ).name })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona cliente" />
                            </SelectTrigger>
                            <SelectContent>
                              {clients.data?.map(c => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {loanMovements?.client && (

                        <div className="space-y-2">
                          <Label>Pedido a asignar prestamo: </Label>
                          <Select value={loanMovements.delivery} onValueChange={(value) =>  setLoanMovements({ ...loanMovements, delivery: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona pedido" />
                            </SelectTrigger>
                            <SelectContent>
                              { allClientDeliveries?.filter( d => d.client_id === loanMovements.client )
                                .map(c => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.id.substring(0, 8).toUpperCase()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        )}
                        
                        <div className="space-y-2">
                          <Label>Monto</Label>
                          <Input
                            type="number"
                            value={loanMovements.amount}
                            onChange={(e) => setLoanMovements({ ...loanMovements, amount: e.target.value })}
                            placeholder="0"
                          />
                        </div>
                        <div className='space-y-2'>
                          <Label>Dinero sale de: </Label>
                          <div className='flex gap-1'>
                            {SUB_ACCOUNTS.map((account) => (
                              <button
                                key={account.id}
                                type="button"
                                onClick={() => setLoanMovements({ ...loanMovements, account: account.id })}
                                className={cn(
                                  "px-3 py-1 rounded-lg border text-xs font-medium transition-all duration-200",
                                  loanMovements.account === account.id
                                    ? cn(account.colorClass, "border-transparent")
                                    : "border-border text-muted-foreground hover:border-primary/40"
                                )}
                              >
                                {account.label}
                              </button>
                     
                              ))
                            }
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Descripción</Label>
                          <Input
                            value={loanMovements.notes}
                            onChange={(e) => setLoanMovements({
                              ...loanMovements,
                              notes: e.target.value
                            })}
                            placeholder="Explicar el motivo del prestamo"
                          />
                        </div>
                        <Button 
                          className="w-full" 
                          onClick={handleAssignLoan}
                          disabled={isPending}
                        >
                          {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Asignar
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
        </div>

        {/* Quick totals 
        <div className="flex gap-3 flex-wrap">
          <div className="text-center px-4 py-2 rounded-lg bg-muted/50 border border-border text-sm">
            <p className="text-muted-foreground text-xs">Neto hoy</p>
            <p className={cn('font-semibold', totalNetToday >= 0 ? 'text-success' : 'text-destructive')}>
              {formatCurrency(totalNetToday)}
            </p>
          </div>
          <div className="text-center px-4 py-2 rounded-lg bg-muted/50 border border-border text-sm">
            <p className="text-muted-foreground text-xs">Saldo acumulado</p>
            <p className={cn('font-semibold', totalOutstanding >= 0 ? 'text-success' : 'text-destructive')}>
              {formatCurrency(totalOutstanding)}
            </p>
          </div>
        </div>
        */}
      </div>

      {/* ─── Main table ─── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            Resumen por Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clientsSummary.data.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Sin actividad de clientes hoy
            </p>
          ) : (
            <>
              {/* ── Desktop table ── */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-center">Entregas</TableHead>
                      <TableHead className="text-right">Prestamos</TableHead>
                      <TableHead className="text-right">Servicios</TableHead>
                      <TableHead className="text-right">Ingresos JS</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientSummariesTest.map(
                      ({ client, deliveries, totalCollected, totalServices, totalLoans,dailyNet, currentBalance }) => (
                        <TableRow key={client.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{client.name}</p>
                              {client.company && (
                                <p className="text-xs text-muted-foreground">{client.company}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {deliveries.length > 0 ? (
                              <Badge variant="outline">{deliveries.length}</Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-red-500">
                            {formatCurrency(totalLoans)}
                          </TableCell>
                          <TableCell className="text-right text-destructive">
                            {formatCurrency(totalServices)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              'text-right font-semibold',
                              totalCollected >= 0 ? 'text-success' : 'text-destructive',
                            )}
                          >
                            {formatCurrency(totalCollected)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              'text-right font-semibold',
                              currentBalance >= 0 ? 'text-success' : 'text-destructive',
                            )}
                          >
                            {formatCurrency(currentBalance)}
                          </TableCell>
                          <TableCell className="text-center">
                            <BalanceBadge balance={currentBalance} />
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {deliveries.length > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const summary = clientSummariesTest.find(s => s.client.id === client.id);
                                    setDetailsClient(summary);
                                    setDetailsDialog(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Ver
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => {
                                  const summary = clientSummariesTest.find(s => s.client.id === client.id);
                                  console.log(summary)
                                  setPaymentClient(summary);
                                  setPaymentAmount('');
                                  setPaymentType(currentBalance < 0 ? 'from_client' : 'to_client');
                                  setPaymentDialog(true);
                                }}
                              >
                                <DollarSign className="w-4 h-4 mr-1" />
                                Registrar Pago
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* ── Mobile cards ── */}
              <div className="md:hidden space-y-3">
                {clientSummariesTest.map(
                  ({ client, deliveries, totalCollected, totalServices, dailyNet, currentBalance }) => (
                    <div key={client.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{client.name}</p>
                          {client.company && (
                            <p className="text-xs text-muted-foreground">{client.company}</p>
                          )}
                        </div>
                        <BalanceBadge balance={currentBalance} />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between p-2 bg-muted/50 rounded">
                          <span className="text-muted-foreground">Entregas</span>
                          <span>{deliveries.length}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/50 rounded">
                          <span className="text-muted-foreground">Cobrado</span>
                          <span className="text-success">{formatCurrency(totalCollected)}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/50 rounded">
                          <span className="text-muted-foreground">Servicios</span>
                          <span className="text-destructive">{formatCurrency(totalServices)}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/50 rounded">
                          <span className="text-muted-foreground">Neto hoy</span>
                          <span className={cn('font-semibold', dailyNet >= 0 ? 'text-success' : 'text-destructive')}>
                            {formatCurrency(dailyNet)}
                          </span>
                        </div>
                        <div className="col-span-2 flex justify-between p-2 bg-muted/50 rounded">
                          <span className="text-muted-foreground">Saldo acumulado</span>
                          <span className={cn('font-semibold', currentBalance >= 0 ? 'text-success' : 'text-destructive')}>
                            {formatCurrency(currentBalance)}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {deliveries.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              const summary = clientSummariesTest.find(s => s.client.id === client.id);
                              setDetailsClient(summary);
                              setDetailsDialog(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver Detalles
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="default"
                          className="flex-1"
                          onClick={() => {
                            const summary = clientSummariesTest.find(s => s.client.id === client.id);
                            setPaymentClient(summary);
                            setPaymentAmount('');
                            setPaymentType(currentBalance < 0 ? 'from_client' : 'to_client');
                            setPaymentDialog(true);
                          }}
                        >
                          <DollarSign className="w-4 h-4 mr-1" />
                          Registrar Pago
                        </Button>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </>
          )}
          { totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() =>   setPage(p => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )
          }
        </CardContent>
      </Card>

      {/* ─── Details Dialog ─── */}
      <Dialog open={detailsDialog} onOpenChange={setDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Detalle del día — {detailsClient?.client.name}
            </DialogTitle>
            <DialogDescription>
              Todas las transacciones registradas hoy para este cliente
            </DialogDescription>
          </DialogHeader>

          {detailsClient && (
            <div className="space-y-6 py-2">
              {/* Summary strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                  <p className="text-muted-foreground text-xs mb-1">Entregas</p>
                  <p className="font-semibold">{detailsClient.deliveries.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                  <p className="text-muted-foreground text-xs mb-1">Cobrado</p>
                  <p className="font-semibold text-success">{formatCurrency(detailsClient.totalCollected)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                  <p className="text-muted-foreground text-xs mb-1">Servicio</p>
                  <p className="font-semibold text-destructive">{formatCurrency(detailsClient.totalServices)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                  <p className="text-muted-foreground text-xs mb-1">Neto hoy</p>
                  <p className={cn('font-semibold', detailsClient.dailyNet >= 0 ? 'text-success' : 'text-destructive')}>
                    {formatCurrency(detailsClient.dailyNet)}
                  </p>
                </div>
              </div>

              {/* Balance note */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border text-sm">
                <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Saldo acumulado:</span>
                <span
                  className={cn(
                    'font-semibold ml-auto',
                    detailsClient.currentBalance >= 0 ? 'text-success' : 'text-destructive',
                  )}
                >
                  {formatCurrency(detailsClient.currentBalance)}
                </span>
                <BalanceBadge balance={detailsClient.currentBalance} />
              </div>

              {/* Deliveries table */}
              <div>
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" />
                  Entregas del día
                </h3>
                {detailsClient.deliveries.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    Sin entregas registradas hoy
                  </p>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Destinatario</TableHead>
                          <TableHead className="text-right">A cobrar</TableHead>
                          <TableHead className="text-right">Recibido</TableHead>
                          <TableHead className="text-right">Servicio</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Notas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailsClient.deliveries.map((d: any) => (
                          <TableRow key={d.id}>
                            <TableCell className="font-medium">
                              {d.recipient_name || '—'}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(Number(d.total_to_collect) || 0)}
                            </TableCell>
                            <TableCell className="text-right text-success">
                              {d.received_amount != null
                                ? formatCurrency(Number(d.received_amount))
                                : '—'}
                            </TableCell>
                            <TableCell className="text-right text-destructive">
                              {formatCurrency(Number(d.service_value) || 0)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm">
                              {d.payment_method === 'cash' && 'Efectivo'}
                              {d.payment_method === 'transfer_to_courier' && 'Transfer. mensajero'}
                              {d.payment_method === 'transfer_to_client' && 'Transfer. cliente'}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={d.status} />
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs max-w-[140px] truncate">
                              {d.notes || '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Payment Dialog ─── */}
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
                  value={paymentType}
                  onValueChange={(v) => setPaymentType(v as 'from_client' | 'to_client')}
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
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>
              </div>

              {/* Preview new balance */}
              {paymentAmount !== '' && (() => {
                const amount = parseFloat(paymentAmount) || 0;
                const newBalance =
                  paymentType === 'from_client'
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
                disabled={updateBalance.isPending || paymentAmount === ''}
              >
                {updateBalance.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Registrar Pago
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Small helper components ───────────────────────────────────────────────

function BalanceBadge({ balance }: { balance: number }) {
  if (balance > 0) {
    return (
      <Badge variant="default" className="bg-success whitespace-nowrap">
        <TrendingUp className="w-3 h-3 mr-1" />
        A pagar
      </Badge>
    );
  }
  if (balance < 0) {
    return (
      <Badge variant="destructive" className="whitespace-nowrap">
        <TrendingDown className="w-3 h-3 mr-1" />
        A cobrar
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="whitespace-nowrap">
      <CheckCircle2 className="w-3 h-3 mr-1" />
      Al día
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'completed') {
    return (
      <Badge variant="default" className="bg-success text-xs">
        Entregado
      </Badge>
    );
  }
  if (status === 'not_delivered_collected') {
    return (
      <Badge variant="outline" className="text-xs">
        No entregado
      </Badge>
    );
  }
  return <Badge variant="secondary" className="text-xs">{status}</Badge>;
}

// Needed so TypeScript can infer the summary type via typeof
function buildSummary(_: any) { return null as any; }
