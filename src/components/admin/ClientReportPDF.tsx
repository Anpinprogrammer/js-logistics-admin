import { useRef } from 'react';
import { useClientStatement } from '@/hooks/useClientStatement';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileDown, Loader2, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ClientReportPDFProps {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startDate?: string;
  endDate?: string;
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  completed: 'Entregado',
  not_delivered_collected: 'Ida Perdida',
  not_delivered_no_collection: 'No Entregado',
  cancelled: 'Cancelado',
};

const paymentLabels: Record<string, string> = {
  cash: 'Efectivo',
  transfer_to_courier: 'Trans. JS',
  transfer_to_client: 'Trans. Directa',
};

export function ClientReportPDF({ clientId, open, onOpenChange, startDate, endDate }: ClientReportPDFProps) {
  const { data: statement, isLoading } = useClientStatement(clientId, startDate, endDate);
  const printRef = useRef<HTMLDivElement>(null);
  
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const styles = `
      <style>
        * { font-family: system-ui, -apple-system, sans-serif; }
        body { padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: 600; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 5px 0; color: #666; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 20px 0; }
        .summary-item { background: #f9f9f9; padding: 10px; border-radius: 4px; text-align: center; }
        .summary-item .label { font-size: 11px; color: #666; }
        .summary-item .value { font-size: 16px; font-weight: bold; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-success { color: #22c55e; }
        .text-warning { color: #f59e0b; }
        .text-destructive { color: #ef4444; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 11px; color: #666; text-align: center; }
        @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
      </style>
    `;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Estado de Cuenta - ${statement?.name}</title>
          ${styles}
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-primary" />
            Reporte Imprimible
          </DialogTitle>
          <DialogDescription>
            Vista previa del estado de cuenta para imprimir o guardar como PDF
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : statement ? (
          <>
            <Button onClick={handlePrint} className="mb-4">
              <FileDown className="w-4 h-4 mr-2" />
              Imprimir / Guardar PDF
            </Button>
            
            {/* Printable Content */}
            <div ref={printRef} className="bg-white text-black p-6 rounded border">
              {/* Header */}
              <div className="header text-center mb-6">
                <h1 className="text-2xl font-bold">Estado de Cuenta</h1>
                <p className="text-lg font-medium mt-2">{statement.name}</p>
                {statement.phone && <p className="text-muted-foreground">{statement.phone}</p>}
                {statement.address && <p className="text-muted-foreground">{statement.address}</p>}
                <p className="text-sm text-muted-foreground mt-2">
                  Generado el {format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>
              
              <Separator className="my-4" />
              
              {/* Summary */}
              <div className="summary grid grid-cols-4 gap-3 my-6">
                <div className="summary-item p-3 bg-muted/50 rounded text-center">
                  <div className="label text-xs text-muted-foreground">Total Recaudado</div>
                  <div className="value text-lg font-bold text-success">{formatCurrency(statement.totalCollected)}</div>
                </div>
                <div className="summary-item p-3 bg-muted/50 rounded text-center">
                  <div className="label text-xs text-muted-foreground">Total Servicios</div>
                  <div className="value text-lg font-bold">{formatCurrency(statement.totalServices)}</div>
                </div>
                <div className="summary-item p-3 bg-muted/50 rounded text-center">
                  <div className="label text-xs text-muted-foreground">Idas Perdidas</div>
                  <div className="value text-lg font-bold text-warning">{formatCurrency(statement.totalLostTrips)}</div>
                </div>
                <div className="summary-item p-3 bg-muted/50 rounded text-center">
                  <div className="label text-xs text-muted-foreground">
                    {statement.accountsReceivable > 0 ? 'Saldo Deudor' : 'Saldo a Favor'}
                  </div>
                  <div className={`value text-lg font-bold ${statement.accountsReceivable > 0 ? 'text-destructive' : 'text-success'}`}>
                    {formatCurrency(statement.accountsReceivable > 0 ? statement.accountsReceivable : statement.accountsPayable)}
                  </div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              {/* Deliveries Table */}
              <h3 className="font-semibold mb-3">Detalle de Pedidos ({statement.deliveries.length})</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Destinatario</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead className="text-center">Pago</TableHead>
                      <TableHead className="text-right">Servicio</TableHead>
                      <TableHead className="text-right">Cobro</TableHead>
                      <TableHead className="text-right">Recibido</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statement.deliveries.map(delivery => (
                      <TableRow key={delivery.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(delivery.delivery_date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>{delivery.recipient_name || '-'}</TableCell>
                        <TableCell className="text-center">
                          {statusLabels[delivery.status] || delivery.status}
                        </TableCell>
                        <TableCell className="text-center">
                          {paymentLabels[delivery.payment_method] || delivery.payment_method}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(delivery.service_value)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(delivery.total_to_collect)}</TableCell>
                        <TableCell className="text-right">
                          {delivery.received_amount !== null ? formatCurrency(delivery.received_amount) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Footer */}
              <div className="footer mt-8 pt-4 border-t text-center text-xs text-muted-foreground">
                <p>LogísticaPro - Sistema de Gestión de Entregas</p>
                <p>Este documento es un resumen informativo. Para aclaraciones contacte a administración.</p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No se pudo cargar la información del cliente
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
