import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, CalendarDays, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/utils';
import { cn } from '@/lib/utils';
import DetailsClientDialog, { type DayDetailData } from './DetailsClientDialog';

export interface MockClient {
  id: string;
  name: string;
  company?: string;
  currentBalance: number;
  dailySummaries: DayDetailData[];
}

interface ClientDailySummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: MockClient | null;
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
  return <Badge variant="outline" className="whitespace-nowrap">Al día</Badge>;
}

export function ClientDailySummaryDialog({ open, onOpenChange, client }: ClientDailySummaryDialogProps) {
  const [dayDetailsOpen, setDayDetailsOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayDetailData | null>(null);

  if (!client) return null;

  const totalDeliveries = client.dailySummaries.reduce((s, d) => s + d.deliveries.length, 0);
  const totalCollected = client.dailySummaries.reduce((s, d) => s + d.totalCollected, 0);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] w-full sm:max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              Historial de {client.name}
            </DialogTitle>
            <DialogDescription>
              {client.company && <span className="mr-2">{client.company} ·</span>}
              Resumen de actividad por día
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Client summary strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
              <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                <p className="text-muted-foreground text-xs mb-1">Días activos</p>
                <p className="font-semibold">{client.dailySummaries.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                <p className="text-muted-foreground text-xs mb-1">Total entregas</p>
                <p className="font-semibold">{totalDeliveries}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                <p className="text-muted-foreground text-xs mb-1">Total cobrado</p>
                <p className="font-semibold text-success">{formatCurrency(totalCollected)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                <p className="text-muted-foreground text-xs mb-1">Saldo actual</p>
                <p className={cn('font-semibold', client.currentBalance >= 0 ? 'text-success' : 'text-destructive')}>
                  {formatCurrency(client.currentBalance)}
                </p>
              </div>
            </div>

            {/* Balance badge */}
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm">
              <span className="text-muted-foreground">Estado del saldo:</span>
              <BalanceBadge balance={client.currentBalance} />
            </div>

            {/* Per-day summary table */}
            <div>
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                Días con actividad
              </h3>

              {/* Desktop */}
              <div className="hidden md:block rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-center">Entregas</TableHead>
                      <TableHead className="text-right">Cobrado</TableHead>
                      <TableHead className="text-right">Servicios</TableHead>
                      <TableHead className="text-right">Préstamos</TableHead>
                      <TableHead className="text-right">Neto</TableHead>
                      <TableHead className="text-center">Detalle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.dailySummaries.map((day) => {
                      const completed = day.deliveries.filter((d) => d.status === 'completed').length;
                      return (
                        <TableRow key={day.date}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {new Date(day.date + 'T12:00:00').toLocaleDateString('es-CO', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <Badge variant="outline">{day.deliveries.length}</Badge>
                              <span className="text-xs text-muted-foreground">{completed} completadas</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-success font-medium">
                            {formatCurrency(day.totalCollected)}
                          </TableCell>
                          <TableCell className="text-right text-destructive">
                            {formatCurrency(day.totalServices)}
                          </TableCell>
                          <TableCell className="text-right text-orange-500">
                            {day.totalLoans > 0 ? formatCurrency(day.totalLoans) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell
                            className={cn(
                              'text-right font-semibold',
                              day.net >= 0 ? 'text-success' : 'text-destructive',
                            )}
                          >
                            {formatCurrency(day.net)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedDay(day);
                                setDayDetailsOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile */}
              <div className="md:hidden space-y-3">
                {client.dailySummaries.map((day) => (
                    <div key={day.date} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm capitalize">
                          {new Date(day.date + 'T12:00:00').toLocaleDateString('es-CO', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}
                        </p>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {day.deliveries.length} entregas
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-xs">
                        <div className="bg-muted/50 rounded p-2 text-center">
                          <p className="text-muted-foreground">Cobrado</p>
                          <p className="font-medium text-success">{formatCurrency(day.totalCollected)}</p>
                        </div>
                        <div className="bg-muted/50 rounded p-2 text-center">
                          <p className="text-muted-foreground">Servicios</p>
                          <p className="font-medium text-destructive">{formatCurrency(day.totalServices)}</p>
                        </div>
                        <div className="bg-muted/50 rounded p-2 text-center">
                          <p className="text-muted-foreground">Neto</p>
                          <p className={cn('font-medium', day.net >= 0 ? 'text-success' : 'text-destructive')}>
                            {formatCurrency(day.net)}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setSelectedDay(day);
                          setDayDetailsOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver entregas de este día
                      </Button>
                    </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Day deliveries detail — nested dialog */}
      <DetailsClientDialog
        detailsDialog={dayDetailsOpen}
        setDetailsDialog={setDayDetailsOpen}
        detailsClient={selectedDay}
      />
    </>
  );
}
