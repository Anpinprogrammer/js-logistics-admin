import { useState } from 'react';
import { useClients, useCreateClient, useUpdateClient, Client } from '@/hooks/useClients';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Phone, MapPin, Loader2, Edit, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function ClientsManager() {
  const { data: clients, isLoading } = useClients();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });

  const openCreateDialog = () => {
    setEditingClient(null);
    setFormData({ name: '', phone: '', address: '', notes: '' });
    setDialogOpen(true);
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      phone: client.phone || '',
      address: client.address || '',
      notes: client.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingClient) {
      await updateClient.mutateAsync({
        id: editingClient.id,
        updates: {
          name: formData.name,
          phone: formData.phone || null,
          address: formData.address || null,
          notes: formData.notes || null,
        },
      });
    } else {
      await createClient.mutateAsync({
        name: formData.name,
        phone: formData.phone || null,
        address: formData.address || null,
        notes: formData.notes || null,
      });
    }
    
    setDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Clientes
          </h1>
          <p className="text-muted-foreground">
            Gestiona la información de tus clientes
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
                </DialogTitle>
                <DialogDescription>
                  {editingClient ? 'Modifica los datos del cliente' : 'Añade un nuevo cliente al sistema'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
              
              <DialogFooter>
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
      </div>

      {clients?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No hay clientes registrados. Crea el primero usando el botón de arriba.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients?.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{client.name}</h3>
                      {Number(client.balance) > 0 && (
                        <Badge variant="outline" className="text-warning border-warning shrink-0">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Debe
                        </Badge>
                      )}
                    </div>
                    
                    {client.phone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {client.phone}
                      </p>
                    )}
                    
                    {client.address && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {client.address}
                      </p>
                    )}

                    {Number(client.balance) > 0 && (
                      <p className="text-sm font-medium text-warning">
                        Deuda: ${Number(client.balance).toFixed(2)}
                      </p>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => openEditDialog(client)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
