import { useState } from 'react';
import { type Client } from '@/hooks/useClientsTest';
import { useClientStatement } from '@/hooks/useClientStatement';
import { ClientReportPDF } from './ClientReportPDF';
import PaymentDialog from '../daily/daily-clients/PaymentDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  User, 
  Phone, 
  MapPin, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  FileText,
  Loader2,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Printer,
  BadgeCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientStatementViewProps {
  client: Client;
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusLabels: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pending: { label: 'Pendiente', color: 'text-warning', icon: Package },
  completed: { label: 'Entregado', color: 'text-success', icon: CheckCircle2 },
  not_delivered_collected: { label: 'Ida Perdida', color: 'text-warning', icon: AlertTriangle },
  not_delivered_no_collection: { label: 'No Entregado', color: 'text-destructive', icon: XCircle },
  cancelled: { label: 'Cancelado', color: 'text-muted-foreground', icon: XCircle },
};

const paymentLabels: Record<string, string> = {
  cash: 'Efectivo',
  transfer_to_courier: 'Trans. JS',
  transfer_to_client: 'Trans. Directa',
};

export function ClientStatementView({ client, clientId, open, onOpenChange }: ClientStatementViewProps) {
  console.log(client)
  const { data: statement, isLoading } = useClientStatement(clientId);
  const [showPDF, setShowPDF] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentClient, setPaymentClient] = useState<any>(null);
  
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Estado de Cuenta
                </DialogTitle>
                <DialogDescription>
                  Detalle completo del cliente y sus pedidos
                </DialogDescription>
              </div>
              {statement && (
                <div className='flex gap-1'>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowPDF(true)}
                  className="flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </Button>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setShowPaymentDialog(true)
                    setPaymentClient({
                      client: { id: client.id, name: client.name },
                      currentBalance: client.balance,
                      totalCollected: /**client.dailySummaries[0]?.totalCollected ??*/ 0,
                      totalLoans: /**client.dailySummaries[0]?.totalLoans ??*/ 0,
                      totalServices: /**client.dailySummaries[0]?.totalServices ??*/ 0,
                      hasActivityToday: true/**client.dailySummaries[0]?.date === today*/,
                      //dailySummaries: client.dailySummaries,
                    });
                  }}
                  className="flex items-center gap-2"
                >
                  <BadgeCheck className="w-4 h-4" />
                  Liquidar
                </Button>
                </div>
              )}
            </div>
          </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : statement ? (
          <div className="space-y-6">
            {/* Client Info */}
           <div className='flex gap-4 w-full'>
            <Card className='flex-1'>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5" />
                  {statement.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {statement.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    {statement.phone}
                  </div>
                )}
                {statement.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    {statement.address}
                  </div>
                )}
              </CardContent>
            </Card>

             <Card className={cn(
                "flex-1 p-4",
                statement.accountsReceivable > 0 ? "bg-destructive/10" : "bg-success/10"
              )}>
                <div className="text-sm text-muted-foreground">
                  {statement.accountsReceivable > 0 ? 'Debe' : 'A Favor'}
                </div>
                <div className={cn(
                  "text-xl font-bold",
                  statement.accountsReceivable > 0 ? "text-destructive" : "text-success"
                )}>
                  {formatCurrency(statement.accountsReceivable > 0 
                    ? statement.accountsReceivable 
                    : statement.accountsPayable)}
                </div>
              </Card>
             </div>
            
            {/* Financial Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Recaudado</div>
                <div className="text-xl font-bold text-success">
                  {formatCurrency(statement.totalCollected)}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Servicios</div>
                <div className="text-xl font-bold">
                  {formatCurrency(statement.totalServices)}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Idas Perdidas</div>
                <div className="text-xl font-bold text-red-600">
                  {formatCurrency(statement.totalLostTrips)}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Prestamos JS</div>
                <div className="text-xl font-bold text-warning">
                  {formatCurrency(statement.totalLoans)}
                </div>
              </Card>
            </div>
            
            {/* Deliveries Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Historial de Pedidos</CardTitle>
                <CardDescription>
                  {statement.deliveries.length} pedidos registrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='text-center'>Fecha</TableHead>
                        <TableHead>Destinatario</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Pago</TableHead>
                        <TableHead className="text-right">Servicios</TableHead>
                        <TableHead className="text-right">Prestamos</TableHead>
                        <TableHead className="text-right">Recibido</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statement.deliveries.map(delivery => {
                        const status = statusLabels[delivery.status] || statusLabels.pending;
                        const StatusIcon = status.icon;
                        
                        return (
                          <TableRow key={delivery.id}>
                            <TableCell className="whitespace-nowrap">
                              <div className='flex flex-col items-center gap-1'>
                                {new Date(delivery.delivery_date).toLocaleDateString('es-CO')}
                                <span
                                  className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono bg-muted text-muted-foreground mx-auto"
                                  title={delivery.id}
                                >
                                  #{delivery.id.slice(0, 8).toUpperCase()}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className='flex flex-col text-center gap-1'>
                                <p>
                                  {delivery.recipient_name || '-'}
                                </p>
                                { delivery.lost_trips > 0 &&
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-700">
                                    Devolucion: {delivery.lost_trips}
                                  </span>
                                }
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className={cn("flex items-center gap-1", status.color)}>
                                <StatusIcon className="w-4 h-4" />
                                <span className="text-xs">{status.label}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {paymentLabels[delivery.payment_method] || delivery.payment_method}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(delivery.service_value)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(delivery.loan)}
                            </TableCell>
                            <TableCell className="text-right">
                              {delivery.received_amount !== null 
                                ? formatCurrency(delivery.received_amount)
                                : '-'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No se pudo cargar la información del cliente
          </div>
        )}
        </DialogContent>
      </Dialog>

      {/* PDF Report Dialog */}
      <ClientReportPDF 
        clientId={clientId}
        open={showPDF}
        onOpenChange={setShowPDF}
      />

      {/**Payment Dialog */}
      <PaymentDialog 
        paymentDialog={showPaymentDialog}
        setPaymentDialog={setShowPaymentDialog}
        paymentClient={paymentClient}
        setPaymentClient={setPaymentClient}
      />
    </>
  );
}
