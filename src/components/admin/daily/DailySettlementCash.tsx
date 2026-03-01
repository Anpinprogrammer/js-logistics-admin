import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Wallet, DollarSign, ArrowDownCircle, Plus, Loader2 } from 'lucide-react'

import CashSettlementCard from './CashSettlementCard';

interface CashSettlementData {
  moneyReceiver: string;
  initialAmount: string;
  moneyIn: string;
  moneyOut: string;
  balance: string;
}

const moneyReceivers = ['Caja', 'Bancolombia', 'Nequi']

const DailySettlementCash = () => {

  //Dialogs
  const [initialMoneyDialog, setInitialMoneyDialog] = useState(false)
  const [moneyInDialog, setMoneyInDialog] = useState(false)
  const [moneyOutDialog, setMoneyOutDialog] = useState(false)


  const [settlements, setSettlements] = useState<CashSettlementData[]>([])
  const [selectedMoneyReceiver, setSelectedMoneyReceiver] = useState('caja')
  const [initialMoneyAmount, setInitialMoneyAmount] = useState('')
  const [initialDescription, setInitialDescription] = useState('')
  const [moneyIn, setMoneyIn] = useState('')
  const [moneyInDescription, setMoneyInDescription] = useState('')
  const [moneyOut, setMoneyOut] = useState('')
  const [moneyOutDescription, setMoneyOutDescription] = useState('')
  const [isPending, setIsPending] = useState(false)

  const handleAssignInitialMoney = () => {
    console.log('Asignando el plante inicial')
    console.log('Se asigna a: ', selectedMoneyReceiver)
    console.log('La cantidad de: ', initialMoneyAmount)
    setSelectedMoneyReceiver('caja')
  }

  const handleMoneyIn = () => {
    console.log('Asignando el plante inicial')
    console.log('Se asigna a: ', selectedMoneyReceiver)
    console.log('La cantidad de: ', moneyIn)
    setSelectedMoneyReceiver('caja')
  }

  const handleMoneyOut = () => {
    console.log('Asignando el plante inicial')
    console.log('Se asigna a: ', selectedMoneyReceiver)
    console.log('La cantidad de: ', moneyOut)
    setSelectedMoneyReceiver('caja')
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
              <Dialog open={initialMoneyDialog} onOpenChange={setInitialMoneyDialog}>
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
                      <Select value={selectedMoneyReceiver} onValueChange={setSelectedMoneyReceiver}>
                        <SelectTrigger>
                          <SelectValue placeholder="Asigna a cuenta o caja" />
                        </SelectTrigger>
                        <SelectContent>
                          {moneyReceivers?.map((c, index) => (
                            <SelectItem key={index} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Monto</Label>
                      <Input
                        type="number"
                        value={initialMoneyAmount}
                        onChange={(e) => setInitialMoneyAmount(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <Input
                        value={initialDescription}
                        onChange={(e) => setInitialDescription(e.target.value)}
                        placeholder="Ej: Se aumenta el dinero en caja"
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleAssignInitialMoney}
                      disabled={isPending}
                    >
                      {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Asignar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={moneyInDialog} onOpenChange={setMoneyInDialog}>
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
                      <Select value={selectedMoneyReceiver} onValueChange={setSelectedMoneyReceiver}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona mensajero" />
                        </SelectTrigger>
                        <SelectContent>
                          {moneyReceivers?.map((c, index) => (
                            <SelectItem key={index} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Monto</Label>
                      <Input
                        type="number"
                        value={moneyIn}
                        onChange={(e) => setMoneyIn(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <Input
                        value={moneyInDescription}
                        onChange={(e) => setMoneyInDescription(e.target.value)}
                        placeholder="Ej: Se aumenta el dinero en caja"
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleMoneyIn}
                      disabled={isPending}
                    >
                      {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Registrar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={moneyOutDialog} onOpenChange={setMoneyOutDialog}>
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
                      <Select value={selectedMoneyReceiver} onValueChange={setSelectedMoneyReceiver}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona mensajero" />
                        </SelectTrigger>
                        <SelectContent>
                          {moneyReceivers?.map((c, index) => (
                            <SelectItem key={index} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Monto</Label>
                      <Input
                        type="number"
                        value={moneyOut}
                        onChange={(e) => setMoneyOut(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <Input
                        value={moneyOutDescription}
                        onChange={(e) => setMoneyOutDescription(e.target.value)}
                        placeholder="Ej: Se aumenta el dinero en caja"
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleMoneyIn}
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

          <CashSettlementCard />
      </div>
  )
}

export default DailySettlementCash