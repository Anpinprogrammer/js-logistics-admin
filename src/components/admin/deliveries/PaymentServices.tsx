import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Settings2, DollarSign, CreditCard, ArrowLeftRight, XCircle, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCouriersTest } from '@/hooks/useCouriers';

const SERVICE_TYPES = [
  { id: 'Domi', label: 'Domi', description: 'Servicio regular de domicilios' },
  { id: 'caja',     label: 'Caja',     description: 'Caja registradora con sub-cuentas' },
  { id: 'drop',     label: 'Drop',     description: 'Entrega directa al destinatario' },
  { id: 'terminal', label: 'Terminal', description: 'Cobro por terminal de pago' },
]

const SUB_ACCOUNTS = [
  { id: 'efectivo',    label: 'Efectivo',    colorClass: 'bg-green-100 text-green-700'   },
  { id: 'bancolombia', label: 'Bancolombia', colorClass: 'bg-orange-100 text-orange-700' },
  { id: 'nequi',       label: 'Nequi',       colorClass: 'bg-purple-100 text-purple-700' },
]

const paymentMethods = [
  { value: 'cash', label: 'Efectivo', icon: DollarSign, color: 'text-cash' },
  { value: 'transfer_to_courier', label: 'Transferencia a JS', icon: CreditCard, color: 'text-transfer-courier' },
  { value: 'transfer_to_client', label: 'Transferencia Directa', icon: ArrowLeftRight, color: 'text-transfer-client' },
] as const;

const PAYMENT_METHODS = [
  { value: 'cash',               label: 'Efectivo',              icon: DollarSign,    colorClass: 'text-green-600'  },
  { value: 'transfer_to_courier', label: 'Transferencia a JS',   icon: CreditCard,    colorClass: 'text-orange-500' },
  { value: 'transfer_to_client',  label: 'Transferencia Directa', icon: ArrowLeftRight, colorClass: 'text-purple-500' },
]

interface PaymentServicesProps {
    deliveryFormData: {
    courierId: string;
    recipientName: string;
    totalToCollect: string;
    inAdvancedPayment: boolean;
    paymentMethod: string;
    notes: string;
  };
  setDeliveryFormData: React.Dispatch<React.SetStateAction<{
    courierId: string;
    recipientName: string;
    totalToCollect: string;
    inAdvancedPayment?: boolean;
    paymentMethod: string;
    notes: string;
  }>>;
  totalServices: string;
}

const PaymentServices = ({deliveryFormData, setDeliveryFormData, totalServices}: PaymentServicesProps) => {
  const { data: couriers, isLoading: loadingCouriers } = useCouriersTest();

  const [enabledServices, setEnabledServices]       = useState<string[]>([])
  const [enabledSubAccounts, setEnabledSubAccounts] = useState<string[]>([])
  const [enabledPayments, setEnabledPayments]       = useState<string[]>([])
  const [serviceAmounts, setServiceAmounts]         = useState<Record<string, string>>({})
  const [regularService, setRegularService]         = useState('')
  const [selectedServiceToAdd, setSelectedServiceToAdd] = useState('')

  const addService = () => {
    if (!selectedServiceToAdd) return
    setEnabledServices(prev => [...prev, selectedServiceToAdd])
    setSelectedServiceToAdd('')
  }

  const removeService = (id: string) => {
    setEnabledServices(prev => prev.filter(s => s !== id))
    setServiceAmounts(prev => { const next = { ...prev }; delete next[id]; return next })
    if (id === 'caja') setEnabledSubAccounts([])
  }

  const setAmount = (id: string, value: string) => {
    setServiceAmounts(prev => ({ ...prev, [id]: value }))
  }

  const totalAmount = enabledServices.reduce(
    (sum, id) => sum + (parseFloat(serviceAmounts[id] || '0') || 0), 0
  )

  const toggleSubAccount = (id: string) => {
    setEnabledSubAccounts(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const togglePayment = (value: string) => {
    setEnabledPayments(prev =>
      prev.includes(value) ? prev.filter(p => p !== value) : [...prev, value]
    )
  }

  const [paymentMethod, setPaymentMethod] = useState('cash')
    const [inAdvanced, setInAdvanced] = useState(false)
  
  
    const handlePaymentMethod = (value: string) => {
      setPaymentMethod(value)
      setDeliveryFormData({ ...deliveryFormData, paymentMethod: value })
    }

  const hasSelections = enabledServices.length > 0 || enabledPayments.length > 0

  return (

      <Card className="glass-card animate-slide-up h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            Servicios y Pagos
          </CardTitle>
          <CardDescription>
            Selecciona qué tipos de servicio y métodos de pago estarán disponibles en el formulario.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">

        {/* Service Value (manual) 
            <div className="space-y-2">
              <Label htmlFor='serviceValue' >Valor del Servicio *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id='serviceValue'
                  type="number"
                  min="0"
                  placeholder="0"
                  className="pl-9"
                  value={regularService}
                  onChange={(e) => setRegularService(e.target.value)}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">Valor neto que cobra la empresa por el domicilio. El 70% se paga al mensajero.</p>
            </div>
            */}
          {/* Courier selection */}
          <div className="space-y-2">
            <Label htmlFor="courier" className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-primary" />
                Mensajero *
            </Label>
            <Select
              value={deliveryFormData.courierId}
              onValueChange={(value) => setDeliveryFormData({ ...deliveryFormData, courierId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingCouriers ? "Cargando..." : (couriers?.length === 0 ? "No hay mensajeros" : "Selecciona un mensajero")} />
              </SelectTrigger>
              <SelectContent className="z-[200]">
                {loadingCouriers ? (
                  <div className="p-2 text-center text-muted-foreground">Cargando...</div>
                ) : couriers?.length === 0 ? (
                  <div className="p-2 text-center text-muted-foreground">No hay mensajeros disponibles</div>
                ) : (
                  couriers?.map((courier) => (
                    <SelectItem key={courier.user_id} value={courier.user_id}>
                      {courier.full_name}
                    </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
          </div>


          {/* Additional Services */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Servicios</Label>

            {/* Select + config panel for the pending service */}
            {SERVICE_TYPES.some(s => !enabledServices.includes(s.id)) && (
              <div className="space-y-2">
                <Select
                  value={selectedServiceToAdd}
                  onValueChange={(value) => setSelectedServiceToAdd(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Seleccionar servicio...' />
                  </SelectTrigger>
                  <SelectContent className="z-[200]">
                  {SERVICE_TYPES.filter(s => !enabledServices.includes(s.id)).map(service => (
                    <SelectItem key={service.id} value={service.id}>{service.label} — {service.description}</SelectItem>
                  ))}
                  </SelectContent>
                </Select>

                {selectedServiceToAdd && (
                  <div className="pl-3 border-l-2 border-primary/30 space-y-2">
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        type="number"
                        min="0"
                        placeholder="Valor del servicio"
                        className="pl-8 h-8 text-sm"
                        value={serviceAmounts[selectedServiceToAdd] ?? ''}
                        onChange={(e) => setAmount(selectedServiceToAdd, e.target.value)}
                      />
                    </div>

                    {selectedServiceToAdd === 'caja' && (
                      <div className="flex flex-wrap gap-1.5">
                        {SUB_ACCOUNTS.map((account) => {
                          const subEnabled = enabledSubAccounts.includes(account.id)
                          return (
                            <button
                              key={account.id}
                              type="button"
                              onClick={() => toggleSubAccount(account.id)}
                              className={cn(
                                "px-3 py-1 rounded-lg border text-xs font-medium transition-all duration-200",
                                subEnabled
                                  ? cn(account.colorClass, "border-transparent")
                                  : "border-border text-muted-foreground hover:border-primary/40"
                              )}
                            >
                              {account.label}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={addService}
                      className="w-full h-8 rounded-md bg-primary text-primary-foreground text-sm font-medium"
                    >
                      Agregar
                    </button>
                  </div>
                )}
              </div>
            )}
            {/* Added services — compact rows */}
            {enabledServices.length > 0 && (
              <div className="space-y-1.5">
                {enabledServices.map((serviceId) => {
                  const service = SERVICE_TYPES.find(s => s.id === serviceId)!
                  const amount = serviceAmounts[serviceId]
                  const subAccounts = serviceId === 'caja'
                    ? SUB_ACCOUNTS.filter(a => enabledSubAccounts.includes(a.id))
                    : []
                  return (
                    <div key={serviceId} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/30 bg-primary/5 text-sm">
                      <span className="font-medium">{service.label}</span>
                      {amount && <span className="text-muted-foreground">${amount}</span>}
                      {subAccounts.map(a => (
                        <span key={a.id} className={cn("px-2 py-0.5 rounded-md text-xs font-medium", a.colorClass)}>{a.label}</span>
                      ))}
                      <button
                        type="button"
                        onClick={() => removeService(serviceId)}
                        className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

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

          {/* Stats counters 
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
            */}

          <Separator />

          {/* Payment method */}
          <div className="space-y-3">
            <Label>Forma de Pago *</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {paymentMethods.map((method) => (
                    <button
                        key={method.value}
                        type="button"
                        onClick={() => { handlePaymentMethod(method.value) }}
                        className={cn(
                              "p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2",
                              deliveryFormData.paymentMethod === method.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            )}
                    >
                        <method.icon className={cn("w-5 h-5", method.color)} />
                         <span className="text-xs font-medium text-center">{method.label}</span>
                    </button>
                ))}
            </div>
          </div>

          {/* Total to Collect */}
          {(paymentMethod === 'cash' || paymentMethod === 'transfer_to_courier') && (
            <div className="space-y-2">
            <Label htmlFor="total_to_collect">Valor Total a Cobrar *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="total_to_collect"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="pl-9"
                value={deliveryFormData.totalToCollect}
                onChange={(e) => setDeliveryFormData({ ...deliveryFormData, totalToCollect: e.target.value })}
                required
              />
            </div>
            
            <div className="flex gap-2 pt-2">
              <Label>Pagó por adelantado</Label>

              <input 
                type="checkbox" 
                checked={deliveryFormData.inAdvancedPayment}
                onChange={e => setDeliveryFormData({ ...deliveryFormData, inAdvancedPayment: e.target.checked })}
              />
            </div>
            
          </div>
          )}

          {/* Payment Methods 
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Métodos de Pago</Label>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((method) => {
                const isEnabled = enabledPayments.includes(method.value)
                const Icon = method.icon
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => togglePayment(method.value)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-200",
                      isEnabled
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn("w-4 h-4", method.colorClass)} />
                      <span className="text-sm font-medium">{method.label}</span>
                    </div>
                    {isEnabled
                      ? <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      : <Circle       className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    }
                  </button>
                )
              })}
            </div>
          </div>
          */}

        </CardContent>
      </Card>
  )
}

export default PaymentServices
