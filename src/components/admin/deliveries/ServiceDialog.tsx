import { useState } from 'react'
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Plus } from 'lucide-react';

interface AddedService {
  name: string
  amount: string
}

interface ServiceDialogProps {
    setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    services: AddedService[];
    setServices: React.Dispatch<React.SetStateAction<AddedService[]>>;
    editing?: boolean;
}

const servicesName = [
    'caja', 'drop', 'terminal'
]



const ServiceDialog = ({ setDialogOpen, services, setServices, editing }: ServiceDialogProps) => {

    const [serviceObj, setserviceObj] = useState({
        name: '',
        amount: ''
    })

const handleAddService = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setServices([...services, serviceObj])
        setDialogOpen(false)
        setserviceObj({
            name: '',
            amount: ''
        })
}


  return (
    <>
        <DialogContent className="sm:max-w-md z-[200] max-h-[85vh] overflow-hidden flex flex-col">
            <form action="" onSubmit={handleAddService}>
                <DialogHeader>
                    <DialogTitle>
                        Agrega Servicio Adicional 
                    </DialogTitle>
                    <DialogDescription>
                        Selecciona el servicio adicional que usará el cliente
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4 overflow-y-auto flex-1 pr-2 pl-1">

                {/* Courier selection */}
                <div className="space-y-2">
                    <Label htmlFor="courier" className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-primary" />
                        Servicio Adicional *
                    </Label>
                    <Select
                        value={serviceObj.name}
                        onValueChange={(value) => setserviceObj({...serviceObj, name: value})}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={servicesName?.length === 0 ? "No hay servicios" : "Selecciona un servicio"} />
                        </SelectTrigger>
                        <SelectContent className="z-[200]">
                            {servicesName.length === 0 ? (
                                <div className="p-2 text-center text-muted-foreground">No hay servicios disponibles</div>
                            ) : (
                                servicesName.map((serviceName, index) => (
                                    <SelectItem key={index} value={serviceName}>
                                        {serviceName}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {/**Added Service Value */}
                <div className='space-y-2'>
                    <Label htmlFor="added_service_value">Valor Servicio Adicional *</Label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            id="added_service_value"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="pl-9"
                            value={serviceObj.amount}
                            onChange={(e) => setserviceObj({...serviceObj, amount: e.target.value})}
                            required
                        />
                    </div>
                </div>

                </div>

                <DialogFooter className="pt-4 border-t mt-auto">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancelar
                    </Button>
                    <Button type="submit">
                  
                        {editing ? 'Guardar Cambios' : 'Agregar Servicio'}
                    </Button>
                </DialogFooter>
                
            </form>
        </DialogContent>
    </>
  )
}

export default ServiceDialog