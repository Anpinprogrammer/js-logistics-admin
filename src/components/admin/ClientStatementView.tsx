import { useState } from 'react';
import { useClientStatement } from '@/hooks/useClientStatement';
import { ClientReportPDF } from './ClientReportPDF';
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
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientStatementViewProps {
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

export function ClientStatementView({ clientId, open, onOpenChange }: ClientStatementViewProps) {
  const { data: statement, isLoading } = useClientStatement(clientId);
  const [showPDF, setShowPDF] = useState(false);
  
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Estado de Cuenta
          </DialogTitle>
          <DialogDescription>
            Detalle completo del cliente y sus pedidos
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : statement ? (
          <div className="space-y-6">
            {/* Client Info */}
            <Card>
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
                <div className="text-xl font-bold text-warning">
                  {formatCurrency(statement.totalLostTrips)}
                </div>
              </Card>
              <Card className={cn(
                "p-4",
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
                        <TableHead>Fecha</TableHead>
                        <TableHead>Destinatario</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Pago</TableHead>
                        <TableHead className="text-right">Servicio</TableHead>
                        <TableHead className="text-right">Cobro</TableHead>
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
                              {new Date(delivery.delivery_date).toLocaleDateString('es-CO')}
                            </TableCell>
                            <TableCell>
                              {delivery.recipient_name || '-'}
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
                              {formatCurrency(delivery.total_to_collect)}
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
  );
}
