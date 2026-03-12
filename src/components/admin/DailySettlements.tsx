import { useState } from 'react';
import { useCouriers, useCouriersTest } from '@/hooks/useCouriers';
import { 
  useDailyBaseMoney, 
  usePartialDeliveries, 
  useOperationalCharges,
  useDailySettlements,
  useAssignBaseMoney,
  useRegisterPartialDelivery,
  useAddOperationalCharge,
  useSettleDaily,
  getTodayDate
} from '@/hooks/useDailyOperations';
import { useDeliveriesTest } from '@/hooks/useDeliveries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Wallet,
  Plus,
  DollarSign,
  Truck,
  ArrowDownCircle,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

export function DailySettlements() {
  const today = getTodayDate();
  const { data: couriers, isLoading: loadingCouriers } = useCouriersTest();
  const { data: baseMoney, isLoading: loadingBase } = useDailyBaseMoney(today);
  const { data: partials, isLoading: loadingPartials } = usePartialDeliveries(today);
  const { data: charges, isLoading: loadingCharges } = useOperationalCharges(today);
  const { data: settlements, isLoading: loadingSettlements } = useDailySettlements(today);
  const { data: deliveries } = useDeliveriesTest();
  
  const assignBaseMoney = useAssignBaseMoney();
  const registerPartial = useRegisterPartialDelivery();
  const addCharge = useAddOperationalCharge();
  const settleDaily = useSettleDaily();
  
  const [selectedCourier, setSelectedCourier] = useState('');
  const [baseMoneyAmount, setBaseMoneyAmount] = useState('');
  const [partialAmount, setPartialAmount] = useState('');
  const [partialCourier, setPartialCourier] = useState('');
  const [partialDesc, setPartialDesc] = useState('');
  const [chargeDesc, setChargeDesc] = useState('');
  const [chargeAmount, setChargeAmount] = useState('70000');
  
  const [baseMoneyDialog, setBaseMoneyDialog] = useState(false);
  const [partialDialog, setPartialDialog] = useState(false);
  const [chargeDialog, setChargeDialog] = useState(false);
  const [settleDialog, setSettleDialog] = useState(false);
  const [settleCourier, setSettleCourier] = useState<any>(null);
  const [actualBalance, setActualBalance] = useState('');
  const [settleNotes, setSettleNotes] = useState('');

  const [detailsDialog, setDetailsDialog] = useState(false);
  const [detailsCourier, setDetailsCourier] = useState<any>(null);
  
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const isLoading = loadingCouriers || loadingBase || loadingPartials || loadingCharges || loadingSettlements;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Calculate totals per courier
  const courierSummaries = couriers?.map(courier => {
    const courierBase = baseMoney?.find(b => b.courier_id === courier.user_id);
    const courierPartials = partials?.filter(p => p.courier_id === courier.user_id) || [];
    const courierSettlement = settlements?.find(s => s.courier_id === courier.user_id);
    
    // Get today's completed deliveries for this courier
    const courierDeliveries = deliveries?.filter(d => {
      const deliveryDate = new Date(d.delivery_date)
                                    .toISOString()
                                    .split('T')[0]
    
      return (
        d.courier_id === courier.user_id && 
        deliveryDate === today &&
        (d.status === 'completed' || d.status === 'not_delivered_collected')
      )
    }) || [];
    
    let totalCollected = 0;
    courierDeliveries.forEach(d => {
      if (d.payment_method === 'cash') {
        totalCollected += Number(d.received_amount) || 0;
      }
    });
    
    const baseAmount = Number(courierBase?.amount) || 0;
    const partialsSum = courierPartials.reduce((sum, p) => sum + Number(p.amount), 0);
    const expectedBalance = baseAmount + totalCollected - partialsSum;
    
    return {
      courier,
      baseAmount,
      totalCollected,
      partialsSum,
      expectedBalance,
      isSettled: courierSettlement?.is_settled || false,
      settlement: courierSettlement,
      deliveries: courierDeliveries,
      partials: courierPartials,
    };
  }) || [];

  const filteredCouriers = courierSummaries.filter(courier => courier.baseAmount !== 0 || courier.totalCollected !== 0 || courier.partialsSum !== 0) || [];

  const totalCharges = charges?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;

  const handleAssignBaseMoney = async () => {
    if (!selectedCourier || !baseMoneyAmount) return;
    await assignBaseMoney.mutateAsync({
      courierId: selectedCourier,
      amount: parseFloat(baseMoneyAmount),
    });
    setBaseMoneyDialog(false);
    setSelectedCourier('');
    setBaseMoneyAmount('');
  };

  const handleRegisterPartial = async () => {
    if (!partialCourier || !partialAmount) return;
    await registerPartial.mutateAsync({
      courierId: partialCourier,
      amount: parseFloat(partialAmount),
    });
    setPartialDialog(false);
    setPartialCourier('');
    setPartialAmount('');
  };

  const handleAddCharge = async () => {
    if (!chargeDesc || !chargeAmount) return;
    await addCharge.mutateAsync({
      description: chargeDesc,
      amount: parseFloat(chargeAmount),
    });
    setChargeDialog(false);
    setChargeDesc('');
    setChargeAmount('70000');
  };

  const handleSettleCourier = async () => {
    if (!settleCourier || actualBalance === '') return;
    await settleDaily.mutateAsync({
      courierId: settleCourier.courier.user_id,
      baseMoney: settleCourier.baseAmount,
      totalCollected: settleCourier.totalCollected,
      partialDeliveriesSum: settleCourier.partialsSum,
      actualBalance: parseFloat(actualBalance),
      notes: settleNotes || undefined,
    });
    setSettleDialog(false);
    setSettleCourier(null);
    setActualBalance('');
    setSettleNotes('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" />
            Cuadres del Día
          </h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('es-CO', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Dialog open={baseMoneyDialog} onOpenChange={setBaseMoneyDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <DollarSign className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Dinero</span> Base
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Asignar Dinero Base</DialogTitle>
                <DialogDescription>
                  Asigna el dinero base inicial del día a un mensajero
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Mensajero</Label>
                  <Select value={selectedCourier} onValueChange={setSelectedCourier}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona mensajero" />
                    </SelectTrigger>
                    <SelectContent>
                      {couriers?.map(c => (
                        <SelectItem key={c.user_id} value={c.user_id}>
                          {c.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Monto</Label>
                  <Input
                    type="number"
                    value={baseMoneyAmount}
                    onChange={(e) => setBaseMoneyAmount(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleAssignBaseMoney}
                  disabled={assignBaseMoney.isPending}
                >
                  {assignBaseMoney.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Asignar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={partialDialog} onOpenChange={setPartialDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <ArrowDownCircle className="w-4 h-4 mr-1" />
                Entrega Parcial
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Entrega Parcial</DialogTitle>
                <DialogDescription>
                  Registra dinero entregado por un mensajero durante el día
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Mensajero</Label>
                  <Select value={partialCourier} onValueChange={setPartialCourier}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona mensajero" />
                    </SelectTrigger>
                    <SelectContent>
                      {couriers?.map(c => (
                        <SelectItem key={c.user_id} value={c.user_id}>
                          {c.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Monto</Label>
                  <Input
                    type="number"
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Input
                    value={partialDesc}
                    onChange={(e) => setPartialDesc(e.target.value)}
                    placeholder="Ej: Entrega de la ruta de la mañana"
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleRegisterPartial}
                  disabled={registerPartial.isPending}
                >
                  {registerPartial.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Registrar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={chargeDialog} onOpenChange={setChargeDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Cargo Operativo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Cargo Operativo</DialogTitle>
                <DialogDescription>
                  Registra gastos operativos del día (ej. recogedores)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Input
                    value={chargeDesc}
                    onChange={(e) => setChargeDesc(e.target.value)}
                    placeholder="Ej: Recogedor zona norte"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Monto</Label>
                  <Input
                    type="number"
                    value={chargeAmount}
                    onChange={(e) => setChargeAmount(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleAddCharge}
                  disabled={addCharge.isPending}
                >
                  {addCharge.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Agregar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Couriers Summary Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            Cuadre por Mensajero
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mensajero</TableHead>
                  <TableHead className="text-center">Base</TableHead>
                  <TableHead className="text-right">Cobrado</TableHead>
                  <TableHead className="text-right">Entregado</TableHead>
                  <TableHead className="text-center">Saldo</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCouriers?.map(({ courier, baseAmount, totalCollected, partialsSum, expectedBalance, isSettled }) => (
                  <TableRow key={courier.user_id}>
                    <TableCell className="font-medium">{courier.full_name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(baseAmount)}</TableCell>
                    <TableCell className="text-right text-success">{formatCurrency(totalCollected)}</TableCell>
                    <TableCell className="text-right text-primary">{formatCurrency(partialsSum)}</TableCell>
                    <TableCell className={cn(
                      "text-right font-semibold",
                      expectedBalance >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {formatCurrency(expectedBalance)}
                    </TableCell>
                    <TableCell className="text-center">
                      {isSettled ? (
                        <Badge variant="default" className="bg-success">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Cuadrado
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Pendiente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const summary = courierSummaries.find(s => s.courier.user_id === courier.user_id);
                            setDetailsCourier(summary);
                            setDetailsDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                        {!isSettled && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              const summary = courierSummaries.find(s => s.courier.user_id === courier.user_id);
                              setSettleCourier(summary);
                              setActualBalance('');
                              setSettleNotes('');
                              setSettleDialog(true);
                            }}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Cerrar Cuadre
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filteredCouriers?.map(({ courier, baseAmount, totalCollected, partialsSum, expectedBalance, isSettled }) => (
              <div key={courier.user_id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{courier.full_name}</span>
                  {isSettled ? (
                    <Badge variant="default" className="bg-success">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Cuadrado
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Pendiente
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">Base</span>
                    <span>{formatCurrency(baseAmount)}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">Cobrado</span>
                    <span className="text-success">{formatCurrency(totalCollected)}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">Entregado</span>
                    <span className="text-primary">{formatCurrency(partialsSum)}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">Saldo</span>
                    <span className={cn("font-semibold", expectedBalance >= 0 ? "text-success" : "text-destructive")}>
                      {formatCurrency(expectedBalance)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      const summary = courierSummaries.find(s => s.courier.user_id === courier.user_id);
                      setDetailsCourier(summary);
                      setDetailsDialog(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver Detalles
                  </Button>
                  {!isSettled && (
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1"
                      onClick={() => {
                        const summary = courierSummaries.find(s => s.courier.user_id === courier.user_id);
                        setSettleCourier(summary);
                        setActualBalance('');
                        setSettleNotes('');
                        setSettleDialog(true);
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Cerrar Cuadre
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Operational Charges */}
      {charges && charges.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Cargos Operativos</CardTitle>
            <CardDescription>Total: {formatCurrency(totalCharges)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {charges.map(charge => (
                <div key={charge.id} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span>{charge.description}</span>
                  <span className="font-medium">{formatCurrency(Number(charge.amount))}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details Dialog */}
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

              {/* Partial deliveries */}
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
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Settle Dialog */}
      <Dialog open={settleDialog} onOpenChange={setSettleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar Cuadre</DialogTitle>
            <DialogDescription>
              {settleCourier && `Cuadre de ${settleCourier.courier.full_name}`}
            </DialogDescription>
          </DialogHeader>
          {settleCourier && (
            <div className="space-y-4 py-2">
              <div className="space-y-2 p-3 rounded-lg bg-muted/50 border border-border text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base:</span>
                  <span>{formatCurrency(settleCourier.baseAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cobrado:</span>
                  <span className="text-success">{formatCurrency(settleCourier.totalCollected)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entregado:</span>
                  <span className="text-primary">{formatCurrency(settleCourier.partialsSum)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Saldo esperado:</span>
                  <span>{formatCurrency(settleCourier.expectedBalance)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Monto entregado por el mensajero *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    className="pl-9"
                    value={actualBalance}
                    onChange={(e) => setActualBalance(e.target.value)}
                  />
                </div>
              </div>

              {actualBalance !== '' && (() => {
                const actual = parseFloat(actualBalance) || 0;
                const diff = actual - settleCourier.expectedBalance;
                if (diff < 0) {
                  return (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                      <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-destructive">Faltante: {formatCurrency(Math.abs(diff))}</p>
                        <p className="text-muted-foreground">Se registrará como adelanto de sueldo</p>
                      </div>
                    </div>
                  );
                } else if (diff > 0) {
                  return (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/30">
                      <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-success">Sobrante: {formatCurrency(diff)}</p>
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/30">
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                    <p className="text-sm font-medium text-success">Cuadre exacto ✓</p>
                  </div>
                );
              })()}

              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Textarea
                  placeholder="Observaciones..."
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleSettleCourier}
                disabled={settleDaily.isPending || actualBalance === ''}
              >
                {settleDaily.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Cerrar Cuadre
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
