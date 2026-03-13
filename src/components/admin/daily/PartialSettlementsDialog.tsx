import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  ArrowDownCircle,
  Loader2,
} from 'lucide-react';
import { Courier } from '@/hooks/useCouriers';
import { UseMutationResult } from '@tanstack/react-query';

interface PartialSettlementsDialogProps {
    partialDialog: boolean;
    setPartialDialog: React.Dispatch<React.SetStateAction<boolean>>;
    partialMovements: {
        courier: string;
        courierName: string;
        amount: string;
        description: string;
    };
    setPartialMovements: React.Dispatch<React.SetStateAction<{
        courier: string;
        courierName: string;
        amount: string;
        description: string;
    }>>;
    handleRegisterPartial : () => Promise<void>;
    registerPartial: UseMutationResult<any, Error, {
        courierId: string;
        courierName: string;
        amount: number;
        notes?: string;
        date?: string;
    }, unknown>
}

const PartialSettlementsDialog = ({
    partialDialog,
    setPartialDialog,
    partialMovements,
    setPartialMovements,
    handleRegisterPartial,
    registerPartial
}: PartialSettlementsDialogProps) => {


  return (
    <div>
        <Dialog open={partialDialog} onOpenChange={setPartialDialog}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Registrar Entrega Parcial </DialogTitle>
                        <DialogDescription>
                          Registra dinero entregado por un mensajero durante el día
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="flex flex-row items-baseline justify-center gap-2 py-1.5 px-4 rounded-lg bg-green-200 border border-primary/20">
                          <span className="text-xs font-medium text-primary/70 uppercase tracking-wide">Mensajero</span>
                          <span className="text-sm font-semibold text-primary">{partialMovements.courierName}</span>
                        </div>
                        <div className="space-y-2">
                          <Label>Monto</Label>
                          <Input
                            type="number"
                            value={partialMovements.amount}
                            onChange={(e) => setPartialMovements({ ...partialMovements, amount: e.target.value })}
                            placeholder="0"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Descripción</Label>
                          <Input
                            value={partialMovements.description}
                            onChange={(e) => setPartialMovements({ ...partialMovements, description: e.target.value })}
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
    </div>
  )
}

export default PartialSettlementsDialog