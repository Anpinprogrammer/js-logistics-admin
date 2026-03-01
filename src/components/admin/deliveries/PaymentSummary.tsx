import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Settings2, DollarSign, CreditCard, ArrowLeftRight, Package, CheckCircle2, Circle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const SERVICE_TYPES = [
  { id: 'caja',     label: 'Caja',     description: 'Caja registradora con sub-cuentas' },
  { id: 'drop',     label: 'Drop',     description: 'Entrega directa al destinatario' },
  { id: 'terminal', label: 'Terminal', description: 'Cobro por terminal de pago' },
]

const SUB_ACCOUNTS = [
  { id: 'efectivo',    label: 'Efectivo',    colorClass: 'bg-green-100 text-green-700'   },
  { id: 'bancolombia', label: 'Bancolombia', colorClass: 'bg-orange-100 text-orange-700' },
  { id: 'nequi',       label: 'Nequi',       colorClass: 'bg-purple-100 text-purple-700' },
]

const PAYMENT_METHODS = [
  { value: 'cash',               label: 'Efectivo',              icon: DollarSign,    colorClass: 'text-green-600'  },
  { value: 'transfer_to_courier', label: 'Transferencia a JS',   icon: CreditCard,    colorClass: 'text-orange-500' },
  { value: 'transfer_to_client',  label: 'Transferencia Directa', icon: ArrowLeftRight, colorClass: 'text-purple-500' },
]

interface PaymentSummaryProps {
    enabledServices: string[];
    enabledPayments: string[];
    enabledSubAccounts: string[];
    serviceAmounts: Record<string, string>
}

const PaymentSummary = ({ enabledServices, enabledPayments, enabledSubAccounts, serviceAmounts }: PaymentSummaryProps) => {

 const totalAmount = enabledServices.reduce(
    (sum, id) => sum + (parseFloat(serviceAmounts[id] || '0') || 0), 0
 )

 const hasSelections = enabledServices.length > 0 || enabledPayments.length > 0

  return (
    <Card className="glass-card animate-slide-up h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Resumen de Selección
          </CardTitle>
          <CardDescription>
            Vista previa de los servicios y métodos de pago habilitados.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">

          {/* Services summary */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Servicios Habilitados</Label>

            {enabledServices.length === 0 ? (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed text-muted-foreground">
                <XCircle className="w-4 h-4" />
                <span className="text-sm">Ningún servicio seleccionado</span>
              </div>
            ) : (
              <div className="space-y-2">
                {SERVICE_TYPES.filter(s => enabledServices.includes(s.id)).map(service => {
                  const amount = parseFloat(serviceAmounts[service.id] || '0') || 0
                  return (
                    <div key={service.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          <p className="font-medium text-sm">{service.label}</p>
                        </div>
                        <span className="text-sm font-semibold">
                          ${amount.toLocaleString()}
                        </span>
                      </div>

                      {service.id === 'caja' && enabledSubAccounts.length > 0 && (
                        <div className="flex flex-wrap gap-1 pl-6">
                          {SUB_ACCOUNTS.filter(a => enabledSubAccounts.includes(a.id)).map(account => (
                            <span
                              key={account.id}
                              className={cn("px-2 py-0.5 rounded text-xs font-medium", account.colorClass)}
                            >
                              {account.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Total */}
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <span className="text-sm font-semibold">Total servicios</span>
                  <span className="text-sm font-bold text-primary">${totalAmount.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Payment methods summary */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Métodos de Pago Habilitados</Label>

            {enabledPayments.length === 0 ? (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed text-muted-foreground">
                <XCircle className="w-4 h-4" />
                <span className="text-sm">Ningún método de pago seleccionado</span>
              </div>
            ) : (
              <div className="space-y-2">
                {PAYMENT_METHODS.filter(p => enabledPayments.includes(p.value)).map(method => {
                  const Icon = method.icon
                  return (
                    <div key={method.value} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <Icon className={cn("w-4 h-4", method.colorClass)} />
                        <p className="font-medium text-sm">{method.label}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">Activo</Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Stats counters */}
          {hasSelections && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{enabledServices.length}</p>
                  <p className="text-xs text-muted-foreground">Servicios</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-lg font-bold text-primary">${totalAmount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </>
          )}

        </CardContent>
      </Card>
  )
}

export default PaymentSummary