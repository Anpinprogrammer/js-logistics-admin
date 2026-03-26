import React, { Dispatch } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ArrowDownCircle,
  Eye,
  Truck,
  HandCoins
} from 'lucide-react';
import { formatCurrency } from '@/utils';
import { cn } from '@/lib/utils';

interface DetailsCourierProps {
    detailsDialog: boolean;
    setDetailsDialog: Dispatch<React.SetStateAction<boolean>>;
    detailsCourier: any;
}

const DetailsCourier = (
    {
        detailsDialog,
        setDetailsDialog,
        detailsCourier,
    } : DetailsCourierProps
) => {
  return (
    <Dialog open={detailsDialog} onOpenChange={setDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Detalle del día — {detailsCourier?.courier.full_name}
            </DialogTitle>
            <DialogDescription>
              Todas las transacciones registradas hoy
            </DialogDescription>
          </DialogHeader>

          {detailsCourier && (
            <div className="space-y-6 py-2">
              {/* Summary strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                  <p className="text-muted-foreground text-xs mb-1">Base</p>
                  <p className="font-semibold">{formatCurrency(detailsCourier.baseAmount)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                  <p className="text-muted-foreground text-xs mb-1">Cobrado</p>
                  <p className="font-semibold text-success">{formatCurrency(detailsCourier.totalCollected)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                  <p className="text-muted-foreground text-xs mb-1">Entregado</p>
                  <p className="font-semibold text-primary">{formatCurrency(detailsCourier.partialsSum)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                  <p className="text-muted-foreground text-xs mb-1">Saldo esperado</p>
                  <p className={cn("font-semibold", detailsCourier.expectedBalance >= 0 ? "text-success" : "text-destructive")}>
                    {formatCurrency(detailsCourier.expectedBalance)}
                  </p>
                </div>
              </div>

              {/** Tabs */}
              <Tabs defaultValue="base">
                <TabsList className='w-full'>
                    <TabsTrigger value='base' className='flex-1 gap-1.5'>
                        <HandCoins className="w-3.5 h-3.5" />
                        Movimientos Base
                    </TabsTrigger>
                    <TabsTrigger value='deliveries' className='flex-1 gap-1.5'>
                        <Truck className="w-3.5 h-3.5" />
                        Entregas Dia
                    </TabsTrigger>
                    <TabsTrigger value='partials' className='flex-1 gap-1.5'>
                        <ArrowDownCircle className="w-3.5 h-3.5" />
                        Entregas Parciales
                    </TabsTrigger>
                </TabsList>
              

              {/**Base movements */}
              <TabsContent value='base'>
                <div>
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <HandCoins className="w-4 h-4 text-primary" />
                  Todos los movimientos de la base
                </h3>
                {detailsCourier.partials.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">Sin entregas parciales</p>
                ) : (
                  <div className="space-y-2">
                    {detailsCourier.partials.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border text-sm">
                        <div>
                          <p className="font-medium text-primary">{formatCurrency(Number(p.amount))}</p>
                          {p.notes && <p className="text-muted-foreground text-xs mt-0.5">{p.notes}</p>}
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {new Date(p.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              </TabsContent>

              {/**Daily deliveries  */}
              <TabsContent value='deliveries'>

              {/* Deliveries */}
              <div>
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" />
                  Entregas del día ({detailsCourier.deliveries.length})
                </h3>
                {detailsCourier.deliveries.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">Sin entregas registradas</p>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pedido ID</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead className="text-right">A cobrar</TableHead>
                          <TableHead className="text-right">Recibido</TableHead>
                          <TableHead>Método</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailsCourier.deliveries.map((d: any) => (
                          <TableRow key={d.id}>
                            <TableCell className="text-muted-foreground text-xs max-w-[160px] truncate">
                              {d.id.substring(0, 8).toUpperCase() || '—'}
                            </TableCell>
                            <TableCell className="font-medium">
                              {d.client?.name || '—'}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(Number(d.total_to_collect) || 0)}
                            </TableCell>
                            <TableCell className="text-right text-success">
                              {d.received_amount != null ? formatCurrency(Number(d.received_amount)) : '—'}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {d.payment_method === 'cash' && 'Efectivo'}
                              {d.payment_method === 'transfer_to_courier' && 'Transfer. JS'}
                              {d.payment_method === 'transfer_to_client' && 'Transfer. cliente'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              </TabsContent>

              {/* Partial deliveries */}
              <TabsContent value='partials'>

              
              <div>
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <ArrowDownCircle className="w-4 h-4 text-primary" />
                  Entregas parciales ({detailsCourier.partials.length})
                </h3>
                {detailsCourier.partials.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">Sin entregas parciales</p>
                ) : (
                  <div className="space-y-2">
                    {detailsCourier.partials.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border text-sm">
                        <div>
                          <p className="font-medium text-primary">{formatCurrency(Number(p.amount))}</p>
                          {p.notes && <p className="text-muted-foreground text-xs mt-0.5">{p.notes}</p>}
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {new Date(p.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

  )
}

export default DetailsCourier