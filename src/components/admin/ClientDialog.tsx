import { useState, useEffect } from 'react'
import { useClients, useCreateClient, useUpdateClient, Client } from '@/hooks/useClients';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Plus, Phone, MapPin, Loader2, Edit, AlertTriangle, FileText, DollarSign, Building2, IdCard, ChevronLeft, ChevronRight } from 'lucide-react';
import { MyClient } from '@/types';

interface ClientDialogProps {
    dialogOpen : boolean;
    setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    busqueda: string;
    handleClientSelect: (client: Client) => void;
}

const ClientDialog = ({dialogOpen, setDialogOpen, busqueda, handleClientSelect}: ClientDialogProps) => {

    const { data: clients, isLoading } = useClients();
    const createClient = useCreateClient();
    const updateClient = useUpdateClient();
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    const [formData, setFormData] = useState<MyClient>({
        name: '',
        phone: '',
        address: '',
        notes: '',
        company: '',
        identification_number: '',
        email: '',
    });

  useEffect(() => {
    if(busqueda){
        setFormData({...formData, name: busqueda})
    }
  }, [dialogOpen])
    


    const openCreateDialog = () => {
    setEditingClient(null);
    setFormData({ name: '', phone: '', address: '', notes: '', company: '', identification_number: '', email: '' });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(formData)
    
    if (editingClient) {
      await updateClient.mutateAsync({
        id: editingClient.id,
        updates: {
          name: formData.name,
          phone: formData.phone || null,
          address: formData.address || null,
          notes: formData.notes || null,
          company: formData.company || null,
          identification_number: formData.identification_number || null,
          email: formData.email || null,
        },
      });
    } else {
      await createClient.mutateAsync({
        name: formData.name,
        phone: formData.phone || null,
        address: formData.address || null,
        notes: formData.notes || null,
        company: formData.company || null,
        identification_number: formData.identification_number || null,
        email: formData.email || null,
      });
    }
    
    setDialogOpen(false);
    setFormData({
        name: '',
        phone: '',
        address: '',
        notes: '',
        company: '',
        identification_number: '',
        email: '',
    })
  };

  return (
    <>
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="sm:max-w-md z-[200] max-h-[85vh] overflow-hidden flex flex-col">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <DialogHeader>
                <DialogTitle>
                  {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
                </DialogTitle>
                <DialogDescription>
                  {editingClient ? 'Modifica los datos del cliente' : 'Añade un nuevo cliente al sistema'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4 overflow-y-auto flex-1">
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
               
              <DialogFooter className="mt-auto pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createClient.isPending || updateClient.isPending}>
                  {(createClient.isPending || updateClient.isPending) && (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  )}
                  {editingClient ? 'Guardar Cambios' : 'Crear Cliente'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
    </>
  )
}

export default ClientDialog