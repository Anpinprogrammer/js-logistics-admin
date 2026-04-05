import { useState } from 'react';
import { useClients } from '@/hooks/useClientsTest';
import { useDeliveriesTest } from '@/hooks/useDeliveries';
import { getTodayDate } from '@/utils';
import { useAssignLoan } from '@/hooks/useDailyClientsOperations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PaymentDialog from './PaymentDialog';
import { ClientDailySummaryDialog, type MockClient } from './ClientDailySummaryDialog';
import {
  Users,
  CalendarDays,
  DollarSign,
  Truck,
  Loader2,
  TrendingUp,
  TrendingDown,
  FlaskConical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SUB_ACCOUNTS } from '@/utils';

// ─── Mock data ────────────────────────────────────────────────────────────────
// Will be replaced with real API calls once the backend endpoints are ready.

const MOCK_CLIENTS: MockClient[] = [
  {
    id: 'c01',
    name: 'Tienda ABC',
    company: 'ABC S.A.S.',
    currentBalance: 350_000,
    dailySummaries: [
      {
        date: '2026-04-02',
        totalCollected: 480_000,
        totalServices: 56_000,
        totalLoans: 50_000,
        net: 374_000,
        deliveries: [
          { id: 'd01', client_name: 'Tienda ABC', recipient_name: 'María García', total_to_collect: 120_000, received_amount: 120_000, service_value: 12_000, payment_method: 'cash', status: 'completed', notes: '' },
          { id: 'd02', client_name: 'Tienda ABC', recipient_name: 'Carlos López', total_to_collect: 85_000, received_amount: 85_000, service_value: 8_000, payment_method: 'cash', status: 'completed', notes: 'Edificio piso 3' },
          { id: 'd03', client_name: 'Tienda ABC', recipient_name: 'Roberto Cano', total_to_collect: 275_000, received_amount: 275_000, service_value: 28_000, payment_method: 'transfer_to_client', status: 'completed', notes: '' },
          { id: 'd04', client_name: 'Tienda ABC', recipient_name: 'Felipe Acosta', total_to_collect: 0, received_amount: null, service_value: 8_000, payment_method: 'cash', status: 'not_delivered_collected', notes: 'No había nadie en casa' },
        ],
      },
      {
        date: '2026-04-01',
        totalCollected: 135_000,
        totalServices: 14_000,
        totalLoans: 0,
        net: 121_000,
        deliveries: [
          { id: 'd05', client_name: 'Tienda ABC', recipient_name: 'Valentina Díaz', total_to_collect: 75_000, received_amount: 75_000, service_value: 8_000, payment_method: 'cash', status: 'completed', notes: '' },
          { id: 'd06', client_name: 'Tienda ABC', recipient_name: 'Camilo Ruiz', total_to_collect: 60_000, received_amount: 60_000, service_value: 6_000, payment_method: 'cash', status: 'completed', notes: '' },
        ],
      },
      {
        date: '2026-03-31',
        totalCollected: 680_000,
        totalServices: 68_000,
        totalLoans: 0,
        net: 612_000,
        deliveries: [
          { id: 'd07', client_name: 'Tienda ABC', recipient_name: 'Esteban Mora', total_to_collect: 450_000, received_amount: 450_000, service_value: 45_000, payment_method: 'transfer_to_client', status: 'completed', notes: '' },
          { id: 'd08', client_name: 'Tienda ABC', recipient_name: 'Juliana Ospina', total_to_collect: 230_000, received_amount: 230_000, service_value: 23_000, payment_method: 'cash', status: 'completed', notes: '' },
        ],
      },
      {
        date: '2026-03-28',
        totalCollected: 95_000,
        totalServices: 9_500,
        totalLoans: 0,
        net: 85_500,
        deliveries: [
          { id: 'd09', client_name: 'Tienda ABC', recipient_name: 'Felipe Acosta', total_to_collect: 95_000, received_amount: 95_000, service_value: 9_500, payment_method: 'cash', status: 'completed', notes: '' },
        ],
      },
    ],
  },
  {
    id: 'c02',
    name: 'Distribuidora Norte',
    company: undefined,
    currentBalance: -180_000,
    dailySummaries: [
      {
        date: '2026-04-02',
        totalCollected: 200_000,
        totalServices: 35_000,
        totalLoans: 0,
        net: 165_000,
        deliveries: [
          { id: 'd10', client_name: 'Distribuidora Norte', recipient_name: 'Pedro Ramírez', total_to_collect: 200_000, received_amount: 200_000, service_value: 20_000, payment_method: 'transfer_to_client', status: 'completed', notes: '' },
          { id: 'd11', client_name: 'Distribuidora Norte', recipient_name: 'Ana Martínez', total_to_collect: 150_000, received_amount: null, service_value: 15_000, payment_method: 'cash', status: 'not_delivered_collected', notes: 'Dirección incorrecta' },
        ],
      },
      {
        date: '2026-04-01',
        totalCollected: 340_000,
        totalServices: 34_000,
        totalLoans: 0,
        net: 306_000,
        deliveries: [
          { id: 'd12', client_name: 'Distribuidora Norte', recipient_name: 'Marcela Vargas', total_to_collect: 340_000, received_amount: 340_000, service_value: 34_000, payment_method: 'transfer_to_client', status: 'completed', notes: '' },
        ],
      },
      {
        date: '2026-03-31',
        totalCollected: 975_000,
        totalServices: 97_500,
        totalLoans: 120_000,
        net: 757_500,
        deliveries: [
          { id: 'd13', client_name: 'Distribuidora Norte', recipient_name: 'Hernán Castro', total_to_collect: 600_000, received_amount: 600_000, service_value: 60_000, payment_method: 'transfer_to_courier', status: 'completed', notes: 'Cliente recurrente' },
          { id: 'd14', client_name: 'Distribuidora Norte', recipient_name: 'Patricia Leal', total_to_collect: 375_000, received_amount: 375_000, service_value: 37_500, payment_method: 'cash', status: 'completed', notes: '' },
        ],
      },
    ],
  },
  {
    id: 'c03',
    name: 'Moda Express',
    company: 'Moda Express Ltda.',
    currentBalance: 0,
    dailySummaries: [
      {
        date: '2026-04-02',
        totalCollected: 415_000,
        totalServices: 42_000,
        totalLoans: 0,
        net: 373_000,
        deliveries: [
          { id: 'd15', client_name: 'Moda Express', recipient_name: 'Laura Sánchez', total_to_collect: 320_000, received_amount: 320_000, service_value: 32_000, payment_method: 'transfer_to_courier', status: 'completed', notes: '' },
          { id: 'd16', client_name: 'Moda Express', recipient_name: 'Jorge Torres', total_to_collect: 95_000, received_amount: 95_000, service_value: 10_000, payment_method: 'cash', status: 'completed', notes: '' },
        ],
      },
      {
        date: '2026-04-01',
        totalCollected: 185_000,
        totalServices: 31_500,
        totalLoans: 0,
        net: 153_500,
        deliveries: [
          { id: 'd17', client_name: 'Moda Express', recipient_name: 'Sergio Castro', total_to_collect: 185_000, received_amount: 185_000, service_value: 18_500, payment_method: 'cash', status: 'completed', notes: 'Entregar a portería' },
          { id: 'd18', client_name: 'Moda Express', recipient_name: 'Natalia Gómez', total_to_collect: 130_000, received_amount: null, service_value: 13_000, payment_method: 'cash', status: 'not_delivered_collected', notes: 'Zona de difícil acceso' },
        ],
      },
      {
        date: '2026-03-28',
        totalCollected: 370_000,
        totalServices: 37_000,
        totalLoans: 0,
        net: 333_000,
        deliveries: [
          { id: 'd19', client_name: 'Moda Express', recipient_name: 'Pilar Salcedo', total_to_collect: 160_000, received_amount: 160_000, service_value: 16_000, payment_method: 'transfer_to_courier', status: 'completed', notes: '' },
          { id: 'd20', client_name: 'Moda Express', recipient_name: 'Tomás Vélez', total_to_collect: 210_000, received_amount: 210_000, service_value: 21_000, payment_method: 'cash', status: 'completed', notes: '' },
        ],
      },
    ],
  },
  {
    id: 'c04',
    name: 'TechParts',
    company: 'TechParts Colombia S.A.S.',
    currentBalance: 920_000,
    dailySummaries: [
      {
        date: '2026-04-02',
        totalCollected: 510_000,
        totalServices: 71_000,
        totalLoans: 0,
        net: 439_000,
        deliveries: [
          { id: 'd21', client_name: 'TechParts', recipient_name: 'Andrés Moreno', total_to_collect: 510_000, received_amount: 510_000, service_value: 51_000, payment_method: 'transfer_to_client', status: 'completed', notes: 'Pago inmediato' },
          { id: 'd22', client_name: 'TechParts', recipient_name: 'Sofía Herrera', total_to_collect: 0, received_amount: null, service_value: 20_000, payment_method: 'cash', status: 'pending', notes: 'Reprogramar para mañana' },
        ],
      },
      {
        date: '2026-04-01',
        totalCollected: 190_000,
        totalServices: 30_500,
        totalLoans: 0,
        net: 159_500,
        deliveries: [
          { id: 'd23', client_name: 'TechParts', recipient_name: 'Diego Peña', total_to_collect: 190_000, received_amount: 190_000, service_value: 19_000, payment_method: 'transfer_to_courier', status: 'completed', notes: '' },
          { id: 'd24', client_name: 'TechParts', recipient_name: 'Isabela Ríos', total_to_collect: 0, received_amount: null, service_value: 11_500, payment_method: 'cash', status: 'not_delivered_collected', notes: 'Devolución' },
        ],
      },
      {
        date: '2026-03-31',
        totalCollected: 215_000,
        totalServices: 21_500,
        totalLoans: 0,
        net: 193_500,
        deliveries: [
          { id: 'd25', client_name: 'TechParts', recipient_name: 'Gloria Niño', total_to_collect: 215_000, received_amount: 215_000, service_value: 21_500, payment_method: 'transfer_to_client', status: 'completed', notes: '' },
        ],
      },
      {
        date: '2026-03-28',
        totalCollected: 175_000,
        totalServices: 25_500,
        totalLoans: 0,
        net: 149_500,
        deliveries: [
          { id: 'd26', client_name: 'TechParts', recipient_name: 'Catalina Reyes', total_to_collect: 175_000, received_amount: 175_000, service_value: 17_500, payment_method: 'transfer_to_client', status: 'completed', notes: '' },
          { id: 'd27', client_name: 'TechParts', recipient_name: 'Manuel Quiroga', total_to_collect: 0, received_amount: null, service_value: 8_000, payment_method: 'cash', status: 'not_delivered_collected', notes: 'Devuelto al cliente' },
        ],
      },
    ],
  },
];

// ─── Sign convention ──────────────────────────────────────────────────────────
//   balance > 0  →  we owe the client  (we pay them)
//   balance < 0  →  client owes us     (they pay us)

export function DailyClientSettlement() {
  const today = getTodayDate();
  const { data: clients } = useClients(1, 999);
  const { data: deliveries } = useDeliveriesTest();
  const assignLoan = useAssignLoan();

  // ── Loan dialog state ──
  const [loansDialog, setLoansDialog] = useState(false);
  const [loanMovements, setLoanMovements] = useState({
    account: 'cash',
    client: '',
    clientName: '',
    delivery: '',
    amount: '',
    notes: '',
  });
  const [isPending] = useState(false);

  // ── Client history dialog ──
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<MockClient | null>(null);

  // ── Payment dialog ──
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentClient, setPaymentClient] = useState<any>(null);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);


  
  const clientsWithDeliveries =
  clients?.data.filter((client) =>
    deliveries?.some((d) => d.client_id === client.id)
  ) || [];
 

  const allClientDeliveries =
    deliveries?.filter((d) => {
      const deliveryDate = d.delivery_date;
      return deliveryDate === today;
    }) || [];

  

  const handleAssignLoan = async () => {
    const { account, clientName, delivery, amount, notes } = loanMovements;
    try {
      await assignLoan.mutateAsync({ account, clientName, delivery, amount: parseFloat(amount), notes });
    } catch (error) {
      console.log(error);
    }
    setLoansDialog(false);
    setLoanMovements({ account: 'cash', client: '', clientName: '', delivery: '', amount: '', notes: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Cuadres de Clientes
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
          {/* Loan dialog */}
          <Dialog
            open={loansDialog}
            onOpenChange={() => {
              setLoansDialog(!loansDialog);
              setLoanMovements({ account: 'cash', client: '', clientName: '', delivery: '', amount: '', notes: '' });
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <DollarSign className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Agregar</span> Prestamo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Asignar Prestamo</DialogTitle>
                <DialogDescription>Asigna dinero prestado a un cliente durante el dia</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select
                    value={loanMovements.client}
                    onValueChange={(value) =>
                      setLoanMovements({
                        ...loanMovements,
                        client: value,
                        clientName: clients?.data.find((c) => c.id === value)?.name ?? '',
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.data.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {loanMovements.client && (
                  <div className="space-y-2">
                    <Label>Pedido a asignar prestamo:</Label>
                    <Select
                      value={loanMovements.delivery}
                      onValueChange={(value) => setLoanMovements({ ...loanMovements, delivery: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona pedido" />
                      </SelectTrigger>
                      <SelectContent>
                        {allClientDeliveries
                          .filter((d) => d.client_id === loanMovements.client)
                          .map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.id.substring(0, 8).toUpperCase()}
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

                <div className="space-y-2">
                  <Label>Dinero sale de:</Label>
                  <div className="flex gap-1 flex-wrap">
                    {SUB_ACCOUNTS.map((account) => (
                      <button
                        key={account.id}
                        type="button"
                        onClick={() => setLoanMovements({ ...loanMovements, account: account.id })}
                        className={cn(
                          'px-3 py-1 rounded-lg border text-xs font-medium transition-all duration-200',
                          loanMovements.account === account.id
                            ? cn(account.colorClass, 'border-transparent')
                            : 'border-border text-muted-foreground hover:border-primary/40',
                        )}
                      >
                        {account.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Input
                    value={loanMovements.notes}
                    onChange={(e) => setLoanMovements({ ...loanMovements, notes: e.target.value })}
                    placeholder="Explicar el motivo del prestamo"
                  />
                </div>

                <Button className="w-full" onClick={handleAssignLoan} disabled={isPending}>
                  {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Asignar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ─── Mock data notice ─── 
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-yellow-400/40 bg-yellow-400/10 text-yellow-700 dark:text-yellow-300 text-xs">
        <FlaskConical className="w-4 h-4 shrink-0" />
        Mostrando datos de ejemplo — se conectará a datos reales cuando el backend esté listo.
      </div>
      */}

      {/* ─── Client list table ─── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-center">Días sin liquidar</TableHead>
                  <TableHead className="text-center">Total entregas</TableHead>
                  <TableHead className="text-right">Saldo actual</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientsWithDeliveries.map((client) => {
                   const totalDeliveries = deliveries?.filter( (d) =>  d.client_id === client.id ) || []
                   const grouped = totalDeliveries?.reduce((acc, d) => {
                        const date = d.delivery_date;

                        if(!acc[date]) {
                          acc[date] = 0
                        }

                        acc[date]++

                        return acc

                      }, {})

                      let result = []
                      if(grouped) {
                        result = Object.entries(grouped).map(([date, total]) => ({
                        date,
                        total
                      }))
                      }
                  return (
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
                        <Badge variant="outline">{result?.length} </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{totalDeliveries?.length}</Badge>
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-semibold',
                          client.balance > 0
                            ? 'text-success'
                            : client.balance < 0
                            ? 'text-destructive'
                            : 'text-muted-foreground',
                        )}
                      >
                        {formatCurrency(client.balance)}
                      </TableCell>
                      <TableCell className="text-center">
                        <BalanceBadge balance={client.balance} />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              /**
                               * 
                               
                              setSelectedClient(client);
                              setSummaryOpen(true);
                              */
                            }}
                          >
                            <CalendarDays className="w-4 h-4 mr-1" />
                            Ver historial
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              /**
                               * 
                               
                              setPaymentClient({
                                client: { id: client.id, name: client.name },
                                currentBalance: client.currentBalance,
                                totalCollected: client.dailySummaries[0]?.totalCollected ?? 0,
                                totalLoans: client.dailySummaries[0]?.totalLoans ?? 0,
                                totalServices: client.dailySummaries[0]?.totalServices ?? 0,
                                hasActivityToday: client.dailySummaries[0]?.date === today,
                                dailySummaries: client.dailySummaries,
                              });
                              setPaymentDialog(true);
                              */
                            }}
                          >
                            <DollarSign className="w-4 h-4 mr-1" />
                            Registrar Pago
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              
              {/**
               * 
               
              <TableBody>
                {MOCK_CLIENTS.map((client) => {
                  const totalDeliveries = client.dailySummaries.reduce((s, d) => s + d.deliveries.length, 0);
                  return (
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
                        <Badge variant="outline">{client.dailySummaries.length}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{totalDeliveries}</Badge>
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-semibold',
                          client.currentBalance > 0
                            ? 'text-success'
                            : client.currentBalance < 0
                            ? 'text-destructive'
                            : 'text-muted-foreground',
                        )}
                      >
                        {formatCurrency(client.currentBalance)}
                      </TableCell>
                      <TableCell className="text-center">
                        <BalanceBadge balance={client.currentBalance} />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedClient(client);
                              setSummaryOpen(true);
                            }}
                          >
                            <CalendarDays className="w-4 h-4 mr-1" />
                            Ver historial
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              setPaymentClient({
                                client: { id: client.id, name: client.name },
                                currentBalance: client.currentBalance,
                                totalCollected: client.dailySummaries[0]?.totalCollected ?? 0,
                                totalLoans: client.dailySummaries[0]?.totalLoans ?? 0,
                                totalServices: client.dailySummaries[0]?.totalServices ?? 0,
                                hasActivityToday: client.dailySummaries[0]?.date === today,
                                dailySummaries: client.dailySummaries,
                              });
                              setPaymentDialog(true);
                            }}
                          >
                            <DollarSign className="w-4 h-4 mr-1" />
                            Registrar Pago
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              */}
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {MOCK_CLIENTS.map((client) => {
              const totalDeliveries = client.dailySummaries.reduce((s, d) => s + d.deliveries.length, 0);
              return (
                <div key={client.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{client.name}</p>
                      {client.company && (
                        <p className="text-xs text-muted-foreground">{client.company}</p>
                      )}
                    </div>
                    <BalanceBadge balance={client.currentBalance} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="flex flex-col items-center p-2 bg-muted/50 rounded text-center">
                      <span className="text-muted-foreground text-xs">Días</span>
                      <span className="font-medium">{client.dailySummaries.length}</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-muted/50 rounded text-center">
                      <span className="text-muted-foreground text-xs">Entregas</span>
                      <span className="font-medium">{totalDeliveries}</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-muted/50 rounded text-center">
                      <span className="text-muted-foreground text-xs">Saldo</span>
                      <span
                        className={cn(
                          'font-semibold text-xs',
                          client.currentBalance > 0
                            ? 'text-success'
                            : client.currentBalance < 0
                            ? 'text-destructive'
                            : 'text-muted-foreground',
                        )}
                      >
                        {formatCurrency(client.currentBalance)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedClient(client);
                        setSummaryOpen(true);
                      }}
                    >
                      <CalendarDays className="w-4 h-4 mr-1" />
                      Ver historial
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1"
                      onClick={() => {
                        setPaymentClient({
                          client: { id: client.id, name: client.name },
                          currentBalance: client.currentBalance,
                          totalCollected: client.dailySummaries[0]?.totalCollected ?? 0,
                          totalLoans: client.dailySummaries[0]?.totalLoans ?? 0,
                          totalServices: client.dailySummaries[0]?.totalServices ?? 0,
                          hasActivityToday: client.dailySummaries[0]?.date === today,
                          dailySummaries: client.dailySummaries,
                        });
                        setPaymentDialog(true);
                      }}
                    >
                      <DollarSign className="w-4 h-4 mr-1" />
                      Pago
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ─── Client daily summary dialog ─── */}
      <ClientDailySummaryDialog
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        client={selectedClient}
      />

      {/* ─── Payment dialog ─── */}
      <PaymentDialog
        paymentDialog={paymentDialog}
        setPaymentDialog={setPaymentDialog}
        paymentClient={paymentClient}
        setPaymentClient={setPaymentClient}
      />
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
      Al día
    </Badge>
  );
}
