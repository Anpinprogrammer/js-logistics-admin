import { useState } from 'react';
import { useCouriers } from '@/hooks/useCouriers';
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
import { useDeliveries } from '@/hooks/useDeliveries';
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
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function DailySettlements() {
  const today = getTodayDate();
  const { data: couriers, isLoading: loadingCouriers } = useCouriers();
  const { data: baseMoney, isLoading: loadingBase } = useDailyBaseMoney(today);
  const { data: partials, isLoading: loadingPartials } = usePartialDeliveries(today);
  const { data: charges, isLoading: loadingCharges } = useOperationalCharges(today);
  const { data: settlements, isLoading: loadingSettlements } = useDailySettlements(today);
  const { data: deliveries } = useDeliveries();
  
  const assignBaseMoney = useAssignBaseMoney();
  const registerPartial = useRegisterPartialDelivery();
  const addCharge = useAddOperationalCharge();
  const settleDaily = useSettleDaily();
  
  const [selectedCourier, setSelectedCourier] = useState('');
  const [baseMoneyAmount, setBaseMoneyAmount] = useState('');
  const [partialAmount, setPartialAmount] = useState('');
  const [partialCourier, setPartialCourier] = useState('');
  const [chargeDesc, setChargeDesc] = useState('');
  const [chargeAmount, setChargeAmount] = useState('70000');
  
  const [baseMoneyDialog, setBaseMoneyDialog] = useState(false);
  const [partialDialog, setPartialDialog] = useState(false);
  const [chargeDialog, setChargeDialog] = useState(false);
  
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
    const courierDeliveries = deliveries?.filter(d => 
      d.courier_id === courier.user_id && 
      d.delivery_date === today &&
      (d.status === 'completed' || d.status === 'not_delivered_collected')
    ) || [];
    
    let totalCollected = 0;
    courierDeliveries.forEach(d => {
      if (d.payment_method === 'cash' || d.payment_method === 'transfer_to_courier') {
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
    };
  }) || [];

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
        
        <div className="flex gap-2">
          <Dialog open={baseMoneyDialog} onOpenChange={setBaseMoneyDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <DollarSign className="w-4 h-4 mr-1" />
                Dinero Base
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mensajero</TableHead>
                <TableHead className="text-right">Base</TableHead>
                <TableHead className="text-right">Cobrado</TableHead>
                <TableHead className="text-right">Entregado</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="text-center">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courierSummaries.map(({ courier, baseAmount, totalCollected, partialsSum, expectedBalance, isSettled }) => (
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
    </div>
  );
}
