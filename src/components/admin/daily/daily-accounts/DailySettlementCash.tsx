import { useState } from 'react'

import { getTodayDate } from '@/hooks/useDailyOperations';
import { useDailyCompany, useAssignInitialMoney } from '@/hooks/useDailyCompanyOperations';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, DollarSign, ArrowDownCircle, Plus, Loader2 } from 'lucide-react'
import { ACCOUNT_LABELS } from '@/utils';

import CashSettlementCard from './CashSettlementCard';

interface CashSettlementData {
  moneyReceiver: string;
  initialAmount: string;
  moneyIn: string;
  moneyOut: string;
  balance: string;
}

const moneyReceivers = [
  { id: 'cash', label: 'Caja' },
  { id: 'bancolombia', label: 'Bancolombia' },
  { id: 'nequi', label: 'Nequi' },
]

const DailySettlementCash = () => {

  const today = getTodayDate()
  const { data: dailyCashSettlementData, isLoading: loadingDailyCash } = useDailyCompany(today)

  const initialMoneyReceivers = dailyCashSettlementData?.filter( d => Number(d.opening_balance) === 0)

  const assignInitialMoney = useAssignInitialMoney();

  const [accountAdjustment, setAccountAdjustment] = useState({
    account: 'cash',
    type: '',
    amount: '',
    description: '',
    initialMoneyDialog: false,
    moneyInDialog: false,
    moneyOutDialog: false
  })
  const [isPending, setIsPending] = useState(false)

  const handleAssignMoney = async () => {
    if (!accountAdjustment.account || !accountAdjustment.amount) return;
    await assignInitialMoney.mutateAsync({
      account: accountAdjustment.account,
      type: accountAdjustment.type,
      amount: parseFloat(accountAdjustment.amount),
      notes: accountAdjustment.description
    })
    setAccountAdjustment({
      account: 'cash',
      type: '',
      amount: '',
      description: '',
      initialMoneyDialog: false,
      moneyInDialog: false,
      moneyOutDialog: false
    })
  }

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
              { initialMoneyReceivers?.length > 0 &&
              <Dialog open={accountAdjustment.initialMoneyDialog} onOpenChange={() => setAccountAdjustment({ ...accountAdjustment, initialMoneyDialog: !accountAdjustment.initialMoneyDialog, type: 'opening_balance' })}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <DollarSign className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Plante</span> Inicial
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Asignar Plante Inicial</DialogTitle>
                    <DialogDescription>
                      Asigna el dinero base con el que inicias el dia en tus cuentas y caja
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Asignar A: </Label>
                      <Select value={accountAdjustment.account} onValueChange={(value) => setAccountAdjustment({ ...accountAdjustment, account: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Asigna a cuenta o caja" />
                        </SelectTrigger>
                        <SelectContent>
                          {initialMoneyReceivers?.map(c => (
                            <SelectItem key={c.account} value={c.account}>
                              {ACCOUNT_LABELS[c.account] || c.account}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Monto</Label>
                      <Input
                        type="number"
                        value={accountAdjustment.amount}
                        onChange={(e) => setAccountAdjustment({ ...accountAdjustment, amount: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    {/**
                     * 
                     
                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <Input
                        value={initialDescription}
                        onChange={(e) => setInitialDescription(e.target.value)}
                        placeholder="Ej: Se aumenta el dinero en caja"
                      />
                    </div>
                    */}
                    <Button 
                      className="w-full" 
                      onClick={handleAssignMoney}
                      disabled={isPending}
                    >
                      {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Asignar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              }
              
              <Dialog open={accountAdjustment.moneyInDialog} onOpenChange={() => setAccountAdjustment({ ...accountAdjustment, moneyInDialog: !accountAdjustment.moneyInDialog, type: 'income' })}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Registrar Ingreso
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Registrar Ingreso</DialogTitle>
                    <DialogDescription>
                      Registra dinero que ingresa durante el día
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Destino</Label>
                      <Select value={accountAdjustment.account} onValueChange={value =>  setAccountAdjustment({ ...accountAdjustment, account: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona mensajero" />
                        </SelectTrigger>
                        <SelectContent>
                          {dailyCashSettlementData?.map(c => (
                            <SelectItem key={c.account} value={c.account}>
                              {ACCOUNT_LABELS[c.account] || c.account}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Monto</Label>
                      <Input
                        type="number"
                        value={accountAdjustment.amount}
                        onChange={(e) => setAccountAdjustment({ ...accountAdjustment, amount: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <Input
                        value={accountAdjustment.description}
                        onChange={(e) => setAccountAdjustment({ ...accountAdjustment, description: e.target.value })}
                        placeholder="Ej: Se aumenta el dinero en caja"
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleAssignMoney}
                      disabled={isPending}
                    >
                      {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Registrar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={accountAdjustment.moneyOutDialog} onOpenChange={() => setAccountAdjustment({ ...accountAdjustment, moneyOutDialog: !accountAdjustment.moneyOutDialog, type: 'expense' })}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ArrowDownCircle className="w-4 h-4 mr-1" />
                    Registrar Salida
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Registrar Salida de Dinero</DialogTitle>
                    <DialogDescription>
                      Registra salidas de dinero durante el dia
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Desde</Label>
                      <Select value={accountAdjustment.account} onValueChange={value =>  setAccountAdjustment({ ...accountAdjustment, account: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona mensajero" />
                        </SelectTrigger>
                        <SelectContent>
                          {dailyCashSettlementData?.map(c => (
                            <SelectItem key={c.account} value={c.account}>
                              {ACCOUNT_LABELS[c.account] || c.account}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Monto</Label>
                      <Input
                        type="number"
                        value={accountAdjustment.amount}
                        onChange={(e) => setAccountAdjustment({ ...accountAdjustment, amount: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <Input
                        value={accountAdjustment.description}
                        onChange={(e) => setAccountAdjustment({ ...accountAdjustment, description: e.target.value })}
                        placeholder="Ej: Se aumenta el dinero en caja"
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleAssignMoney}
                      disabled={isPending}
                    >
                      {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Registrar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <CashSettlementCard 
          dailyCashSettlementData={dailyCashSettlementData}
          />

          {dailyCashSettlementData && (() => {
            const formatCurrency = (value: number) =>
              new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

            const totalBase     = dailyCashSettlementData.reduce((sum, d) => sum + Number(d.opening_balance), 0);
            const totalIngresos = dailyCashSettlementData.reduce((sum, d) => sum + Number(d.total_income), 0);
            const totalSalidas  = dailyCashSettlementData.reduce((sum, d) => sum + Number(d.total_expense), 0);
            const totalBalance  = dailyCashSettlementData.reduce((sum, d) => sum + Number(d.balance), 0);

            return (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-primary" />
                    Totales Generales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-lg border p-4 space-y-1">
                      <p className="text-sm text-muted-foreground">Base Total</p>
                      <p className="text-xl font-semibold">{formatCurrency(totalBase)}</p>
                    </div>
                    <div className="rounded-lg border p-4 space-y-1">
                      <p className="text-sm text-muted-foreground">Ingresos Total</p>
                      <p className="text-xl font-semibold text-success">{formatCurrency(totalIngresos)}</p>
                    </div>
                    <div className="rounded-lg border p-4 space-y-1">
                      <p className="text-sm text-muted-foreground">Salidas Total</p>
                      <p className="text-xl font-semibold text-primary">{formatCurrency(totalSalidas)}</p>
                    </div>
                    <div className="rounded-lg border p-4 space-y-1">
                      <p className="text-sm text-muted-foreground">Balance Total</p>
                      <p className={`text-xl font-semibold ${totalBalance >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(totalBalance)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}


      </div>
  )
}

export default DailySettlementCash