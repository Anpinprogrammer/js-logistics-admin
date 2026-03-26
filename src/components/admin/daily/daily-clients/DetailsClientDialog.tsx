import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,  
  Users,
  Eye,
  DollarSign,
  Truck
} from 'lucide-react';
import { formatCurrency } from '@/utils';
import { cn } from '@/lib/utils';

interface DetailsClientDialogProps {
    detailsDialog: boolean;
    setDetailsDialog: React.Dispatch<React.SetStateAction<boolean>>;
    detailsClient: any;
}

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


const DetailsClientDialog = ({ detailsDialog, setDetailsDialog, detailsClient } : DetailsClientDialogProps) => {
  return (
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
  )
}

export default DetailsClientDialog