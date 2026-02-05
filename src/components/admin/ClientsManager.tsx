import { useState } from 'react';
import { useClients, useCreateClient, useUpdateClient, Client } from '@/hooks/useClients';
import { ClientStatementView } from './ClientStatementView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Plus, Phone, MapPin, Loader2, Edit, AlertTriangle, FileText, DollarSign, Building2, IdCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function ClientsManager() {
  const { data: clients, isLoading } = useClients();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [statementClientId, setStatementClientId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
    company: '',
    identification_number: '',
  });

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const openCreateDialog = () => {
    setEditingClient(null);
    setFormData({ name: '', phone: '', address: '', notes: '', company: '', identification_number: '' });
    setDialogOpen(true);
  };

  const openEditDialog = (client: Client) => {
    console.log(client)
    setEditingClient(client);
    setFormData({
      name: client.name,
      phone: client.phone || '',
      address: client.address || '',
      notes: client.notes || '',
      company: client.company || '',
      identification_number: client.identification_number || '',
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
          company: formData.company || null,
          identification_number: formData.identification_number || null,
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

  const clientsWithDebt = clients?.filter(c => Number(c.balance) > 0) || [];
  const allClients = clients || [];

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
                    placeholder="Nombre del cliente"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    Empresa
                  </Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Nombre de la empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="identification_number" className="flex items-center gap-2">
                    <IdCard className="w-4 h-4 text-muted-foreground" />
                    Número de Identificación
                  </Label>
                  <Input
                    id="identification_number"
                    value={formData.identification_number}
                    onChange={(e) => setFormData({ ...formData, identification_number: e.target.value })}
                    placeholder="NIT o cédula"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Telefono del cliente"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Direccion del cliente"
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

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Todos
            <Badge variant="secondary">{allClients.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="debtors" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Con Deuda
            <Badge variant="destructive">{clientsWithDebt.length}</Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          {allClients.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No hay clientes registrados. Crea el primero usando el botón de arriba.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allClients.map((client) => (
                <ClientCard 
                  key={client.id} 
                  client={client} 
                  onEdit={openEditDialog}
                  onViewStatement={() => setStatementClientId(client.id)}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="debtors" className="mt-4">
          {clientsWithDebt.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No hay clientes con deudas pendientes 🎉
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className="bg-destructive/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-destructive" />
                    Total Cuentas por Cobrar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-destructive">
                    {formatCurrency(clientsWithDebt.reduce((sum, c) => sum + Number(c.balance), 0))}
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clientsWithDebt.map((client) => (
                  <ClientCard 
                    key={client.id} 
                    client={client} 
                    onEdit={openEditDialog}
                    onViewStatement={() => setStatementClientId(client.id)}
                    formatCurrency={formatCurrency}
                  />
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Statement Dialog */}
      <ClientStatementView
        clientId={statementClientId || ''}
        open={!!statementClientId}
        onOpenChange={(open) => !open && setStatementClientId(null)}
      />
    </div>
  );
}

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onViewStatement: () => void;
  formatCurrency: (value: number) => string;
}

function ClientCard({ client, onEdit, onViewStatement, formatCurrency }: ClientCardProps) {
  const hasDebt = Number(client.balance) > 0;
  
  return (
    <Card className={cn(
      "hover:shadow-md transition-shadow group",
      hasDebt && "border-destructive/30"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{client.name}</h3>
              {hasDebt && (
                <Badge variant="outline" className="text-destructive border-destructive shrink-0">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Debe
                </Badge>
              )}
            </div>
            
            {client.company && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {client.company}
              </p>
            )}
            
            {client.identification_number && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <IdCard className="w-3 h-3" />
                {client.identification_number}
              </p>
            )}
            
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

            {hasDebt && (
              <p className="text-sm font-medium text-destructive">
                Deuda: {formatCurrency(Number(client.balance))}
              </p>
            )}
          </div>
          
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onEdit(client)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onViewStatement}
            >
              <FileText className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
