import { useAuditLog, AuditLogEntry } from '@/hooks/useDeliveries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Edit, Ban, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function AuditLog() {
  const { data: auditLogs, isLoading } = useAuditLog();

  const actionConfig = {
    created: { label: 'Creado', icon: Edit, color: 'bg-success/10 text-success' },
    updated: { label: 'Editado', icon: Edit, color: 'bg-primary/10 text-primary' },
    cancelled: { label: 'Anulado', icon: Ban, color: 'bg-destructive/10 text-destructive' },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <History className="w-6 h-6 text-primary" />
          Historial de Auditoría
        </h1>
        <p className="text-muted-foreground">
          Registro de todos los cambios realizados a las entregas
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cambios Recientes</CardTitle>
          <CardDescription>
            Solo administradores pueden ver y realizar cambios
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditLogs?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No hay registros de auditoría
            </p>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {auditLogs?.map((log: AuditLogEntry) => {
                  const action = actionConfig[log.action as keyof typeof actionConfig] || actionConfig.updated;
                  const ActionIcon = action.icon;
                  
                  const oldValues = log.old_values || {};
                  const newValues = log.new_values || {};
                  
                  return (
                    <div 
                      key={log.id}
                      className="p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className={cn("text-xs", action.color)}>
                              <ActionIcon className="w-3 h-3 mr-1" />
                              {action.label}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              por <strong>{log.admin_name}</strong>
                            </span>
                          </div>
                          
                          {log.reason && (
                            <p className="text-sm">
                              <span className="text-muted-foreground">Motivo:</span>{' '}
                              {log.reason}
                            </p>
                          )}

                          {/* Show changes for updates */}
                          {log.action === 'updated' && log.old_values && log.new_values && (
                            <div className="text-xs space-y-1 mt-2 p-2 rounded bg-muted">
                              {oldValues.amount !== newValues.amount && (
                                <p>
                                  Monto: <span className="line-through text-muted-foreground">${String(oldValues.amount)}</span>{' '}
                                  → <span className="text-primary font-medium">${String(newValues.amount)}</span>
                                </p>
                              )}
                              {oldValues.payment_method !== newValues.payment_method && (
                                <p>
                                  Pago: <span className="line-through text-muted-foreground">{String(oldValues.payment_method)}</span>{' '}
                                  → <span className="text-primary font-medium">{String(newValues.payment_method)}</span>
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="text-right text-xs text-muted-foreground">
                          <p>{format(new Date(log.created_at), 'd MMM yyyy', { locale: es })}</p>
                          <p>{format(new Date(log.created_at), 'HH:mm:ss')}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
