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
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Por favor permite las ventanas emergentes para imprimir');
      return;
    }
    
    const styles = `
      <style>
        * { font-family: system-ui, -apple-system, sans-serif; box-sizing: border-box; }
        body { padding: 20px; margin: 0; background: white; color: black; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 11px; }
        th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
        th { background-color: #e5e5e5; font-weight: 600; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 22px; color: black; }
        .header p { margin: 5px 0; color: #333; }
        .summary { display: flex; justify-content: space-between; gap: 10px; margin: 20px 0; flex-wrap: wrap; }
        .summary-item { background: #f0f0f0; padding: 12px; border-radius: 4px; text-align: center; flex: 1; min-width: 120px; border: 1px solid #ccc; }
        .summary-item .label { font-size: 10px; color: #333; display: block; margin-bottom: 4px; }
        .summary-item .value { font-size: 14px; font-weight: bold; color: black; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-success { color: #166534 !important; }
        .text-warning { color: #a16207 !important; }
        .text-destructive { color: #dc2626 !important; }
        .separator { border-top: 2px solid #333; margin: 15px 0; }
        .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #333; font-size: 10px; color: #333; text-align: center; }
        h3 { margin: 20px 0 10px; font-size: 14px; color: black; }
        @media print { 
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } 
          @page { margin: 1cm; }
        }
      </style>
    `;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Estado de Cuenta - ${statement?.name || 'Cliente'}</title>
          ${styles}
        </head>
        <body>
          <div class="header">
            <h1>Estado de Cuenta</h1>
            <p style="font-size: 16px; font-weight: bold; margin-top: 10px;">${statement?.name || ''}</p>
            ${statement?.phone ? `<p>Tel: ${statement.phone}</p>` : ''}
            ${statement?.address ? `<p>${statement.address}</p>` : ''}
            <p style="font-size: 11px; margin-top: 10px;">Generado: ${format(new Date(), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}</p>
          </div>
          
          <div class="separator"></div>
          
          <div class="summary">
            <div class="summary-item">
              <span class="label">Total Recaudado</span>
              <span class="value text-success">${formatCurrency(statement?.totalCollected || 0)}</span>
            </div>
            <div class="summary-item">
              <span class="label">Total Servicios</span>
              <span class="value">${formatCurrency(statement?.totalServices || 0)}</span>
            </div>
            <div class="summary-item">
              <span class="label">Idas Perdidas</span>
              <span class="value text-warning">${formatCurrency(statement?.totalLostTrips || 0)}</span>
            </div>
            <div class="summary-item">
              <span class="label">${(statement?.accountsReceivable || 0) > 0 ? 'Saldo Deudor' : 'Saldo a Favor'}</span>
              <span class="value ${(statement?.accountsReceivable || 0) > 0 ? 'text-destructive' : 'text-success'}">
                ${formatCurrency((statement?.accountsReceivable || 0) > 0 ? statement?.accountsReceivable || 0 : statement?.accountsPayable || 0)}
              </span>
            </div>
          </div>
          
          <div class="separator"></div>
          
          <h3>Detalle de Pedidos (${statement?.deliveries?.length || 0})</h3>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Destinatario</th>
                <th class="text-center">Estado</th>
                <th class="text-center">Pago</th>
                <th class="text-right">Servicio</th>
                <th class="text-right">Cobro</th>
                <th class="text-right">Recibido</th>
              </tr>
            </thead>
            <tbody>
              ${(statement?.deliveries || []).map(delivery => `
                <tr>
                  <td>${format(new Date(delivery.delivery_date), 'dd/MM/yyyy')}</td>
                  <td>${delivery.recipient_name || '-'}</td>
                  <td class="text-center">${statusLabels[delivery.status] || delivery.status}</td>
                  <td class="text-center">${paymentLabels[delivery.payment_method] || delivery.payment_method}</td>
                  <td class="text-right">${formatCurrency(delivery.service_value)}</td>
                  <td class="text-right">${formatCurrency(delivery.total_to_collect)}</td>
                  <td class="text-right">${delivery.received_amount !== null ? formatCurrency(delivery.received_amount) : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p><strong>JS Logística</strong> - Sistema de Gestión de Entregas</p>
            <p>Este documento es un resumen informativo. Para aclaraciones contacte a administración.</p>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 300);
    };
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
