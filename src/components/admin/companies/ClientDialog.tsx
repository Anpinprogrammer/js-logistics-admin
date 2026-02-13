import { useState, useEffect } from 'react'
import { UseMutationResult } from '@tanstack/react-query';
import { useClients, useCreateClient, useUpdateClient, Client } from '@/hooks/useClients';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Plus, Phone, MapPin, Loader2, Edit, AlertTriangle, FileText, DollarSign, Building2, IdCard, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import { MyClient } from '@/types';

interface ClientDialogProps {
    setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    formData: MyClient;
    setFormData: React.Dispatch<React.SetStateAction<MyClient>>;
    handler: (e: React.FormEvent<Element>) => Promise<void>;
    editing?: boolean;
    pending: boolean;
}

const ClientDialog = ({setDialogOpen, formData, setFormData, handler, editing, pending}: ClientDialogProps) => {
    const createClient = useCreateClient();
    const updateClient = useUpdateClient();

  return (
    <>
      <DialogContent className="sm:max-w-md z-[200] max-h-[85vh] overflow-hidden flex flex-col">
            <form onSubmit={handler} className="flex flex-col overflow-hidden h-full">
              <DialogHeader>
                <DialogTitle>
                  {editing ? 'Editar Cliente' : 'Nuevo Cliente'}
                </DialogTitle>
                <DialogDescription>
                  {editing ? 'Modifica los datos del cliente' : 'Añade un nuevo cliente al sistema'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4 overflow-y-auto flex-1 pr-2 pl-1">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nombre del cliente" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    Empresa
                  </Label>
                  <Input id="company" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="Nombre de la empresa" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="identification_number" className="flex items-center gap-2">
                    <IdCard className="w-4 h-4 text-muted-foreground" />
                    Número de Identificación
                  </Label>
                  <Input id="identification_number" value={formData.identification_number} onChange={(e) => setFormData({ ...formData, identification_number: e.target.value })} placeholder="NIT o cédula" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    Correo Electrónico
                  </Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="correo@ejemplo.com (opcional)" />
                  <p className="text-xs text-muted-foreground">Si se asigna un correo, el cliente podrá acceder a su portal</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    Teléfono
                  </Label>
                  <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Telefono del cliente" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className='flex items-center gap-2'>
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    Dirección
                  </Label>
                  <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Direccion del cliente" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Input id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                </div>
              </div>
              
              <DialogFooter className="pt-4 border-t mt-auto">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending && (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  )}
                  {editing ? 'Guardar Cambios' : 'Crear Cliente'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
    </>
  )
}

export default ClientDialog