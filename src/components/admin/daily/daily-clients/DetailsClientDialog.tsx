import React from 'react'
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Eye,
  DollarSign,
  Truck,
  Package,
} from 'lucide-react';
import { formatCurrency } from '@/utils';
import { cn } from '@/lib/utils';

export interface DayDelivery {
  id: string;
  client_name: string;
  recipient_name: string;
  total_to_collect: number;
  received_amount: number | null;
  service_value: number;
  payment_method: 'cash' | 'transfer_to_courier' | 'transfer_to_client';
  status: 'completed' | 'not_delivered_collected' | 'pending';
  notes: string;
}

export interface DayDetailData {
  date: string;
  totalCollected: number;
  totalServices: number;
  totalLoans: number;
  net: number;
  deliveries: DayDelivery[];
}

interface DetailsClientDialogProps {
  detailsDialog: boolean;
  setDetailsDialog: React.Dispatch<React.SetStateAction<boolean>>;
  detailsClient: DayDetailData | null;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'completed') {
    return <Badge variant="default" className="bg-success text-xs whitespace-nowrap">Entregado</Badge>;
  }
  if (status === 'not_delivered_collected') {
    return <Badge variant="outline" className="text-xs whitespace-nowrap">No entregado</Badge>;
  }
  if (status === 'pending') {
    return <Badge variant="secondary" className="text-xs whitespace-nowrap">Pendiente</Badge>;
  }
  return <Badge variant="secondary" className="text-xs">{status}</Badge>;
}

function PaymentMethodLabel({ method }: { method: string }) {
  if (method === 'cash') return <span className="text-xs">Efectivo</span>;
  if (method === 'transfer_to_courier') return <span className="text-xs">Transfer. mensajero</span>;
  if (method === 'transfer_to_client') return <span className="text-xs">Transfer. cliente</span>;
  return <span className="text-xs text-muted-foreground">—</span>;
}

const DetailsClientDialog = ({ detailsDialog, setDetailsDialog, detailsClient }: DetailsClientDialogProps) => {
  if (!detailsClient) return null;

  const formattedDate = new Date(detailsClient.date + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const completed = detailsClient.deliveries.filter(d => d.status === 'completed').length;
  const notDelivered = detailsClient.deliveries.filter(d => d.status === 'not_delivered_collected').length;
  const pending = detailsClient.deliveries.filter(d => d.status === 'pending').length;

  return (
    <Dialog open={detailsDialog} onOpenChange={setDetailsDialog}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Detalle del día
          </DialogTitle>
          <DialogDescription className="capitalize">{formattedDate}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Summary strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
              <p className="text-muted-foreground text-xs mb-1">Total entregas</p>
              <p className="font-semibold">{detailsClient.deliveries.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {completed} entregadas · {notDelivered} no entregadas
                {pending > 0 && ` · ${pending} pendientes`}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
              <p className="text-muted-foreground text-xs mb-1">Total cobrado</p>
              <p className="font-semibold text-success">{formatCurrency(detailsClient.totalCollected)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
              <p className="text-muted-foreground text-xs mb-1">Servicios</p>
              <p className="font-semibold text-destructive">{formatCurrency(detailsClient.totalServices)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
              <p className="text-muted-foreground text-xs mb-1">Neto del día</p>
              <p className={cn('font-semibold', detailsClient.net >= 0 ? 'text-success' : 'text-destructive')}>
                {formatCurrency(detailsClient.net)}
              </p>
            </div>
          </div>

          {/* Loans note if any */}
          {detailsClient.totalLoans > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border text-sm">
              <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Préstamos del día:</span>
              <span className="font-semibold text-destructive ml-auto">
                {formatCurrency(detailsClient.totalLoans)}
              </span>
            </div>
          )}

          {/* Deliveries table */}
          <div>
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" />
              Entregas del día
            </h3>

            {detailsClient.deliveries.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <Package className="w-8 h-8" />
                <p className="text-sm">Sin entregas registradas este día</p>
              </div>
            ) : (
              <>
                {/* Desktop */}
                <div className="hidden md:block rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
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
                      {detailsClient.deliveries.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {d.client_name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {d.recipient_name || '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(d.total_to_collect)}
                          </TableCell>
                          <TableCell className="text-right text-success">
                            {d.received_amount != null ? formatCurrency(d.received_amount) : '—'}
                          </TableCell>
                          <TableCell className="text-right text-destructive">
                            {formatCurrency(d.service_value)}
                          </TableCell>
                          <TableCell>
                            <PaymentMethodLabel method={d.payment_method} />
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

                {/* Mobile */}
                <div className="md:hidden space-y-3">
                  {detailsClient.deliveries.map((d) => (
                    <div key={d.id} className="border rounded-lg p-3 space-y-2 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{d.client_name}</p>
                          <p className="text-xs text-muted-foreground">{d.recipient_name || '—'}</p>
                        </div>
                        <StatusBadge status={d.status} />
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-muted/50 rounded p-2 text-center">
                          <p className="text-muted-foreground">A cobrar</p>
                          <p className="font-medium">{formatCurrency(d.total_to_collect)}</p>
                        </div>
                        <div className="bg-muted/50 rounded p-2 text-center">
                          <p className="text-muted-foreground">Recibido</p>
                          <p className="font-medium text-success">
                            {d.received_amount != null ? formatCurrency(d.received_amount) : '—'}
                          </p>
                        </div>
                        <div className="bg-muted/50 rounded p-2 text-center">
                          <p className="text-muted-foreground">Servicio</p>
                          <p className="font-medium text-destructive">{formatCurrency(d.service_value)}</p>
                        </div>
                      </div>
                      {d.notes && (
                        <p className="text-xs text-muted-foreground italic">{d.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DetailsClientDialog;
