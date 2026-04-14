import { useState, useEffect } from 'react';
//import { useClients, useCreateClient, useUpdateClient, useDeleteClient, Client } from '@/hooks/useClients';
import { useClients, useClientsInFavor, useClientsWithdebt, useCreateClient, useUpdateClient, useDeleteClient, Client } from '@/hooks/useClientsTest';
import { useClientStatement, ClientStatement } from '@/hooks/useClientStatement';
import { ClientStatementView } from './ClientStatementView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Plus, Phone, MapPin, Loader2, Edit, AlertTriangle, FileText, DollarSign, Building2, IdCard, ChevronLeft, ChevronRight, Trash2, Mail, TrendingUp, Wallet, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import ClientDialog from './ClientDialog';

const PAGE_SIZE = 9;

export function ClientsManager() {
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [statementClientId, setStatementClientId] = useState<string | null>(null);
  const [client, setClient] = useState<Client>({
     id: '',
    name: '',
    phone: '',
    address: '',
    notes: '',
    balance: 0,
    company: '',
    identification_number: '',
    email: '',
    created_at: '',
    updated_at: ''
  })
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
    company: '',
    identification_number: '',
    email: '',
  });

  const [allPage, setAllPage] = useState(1);
  const [debtPage, setDebtPage] = useState(1);
  const [favorPage, setFavorPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setAllPage(1);
      setFavorPage(1);
      setDebtPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: clients, isLoading: isLoadingAll } = useClients(allPage, 9, search);
  const { data: clientsInFavor, isLoading: isLoadingInFavor } = useClientsInFavor(favorPage, 9, search);
  const { data: clientsWithDebt, isLoading: isLoadingWithDebt } = useClientsWithdebt(debtPage, 9, search);



  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const openCreateDialog = () => {
    setEditing(false)
    setEditingClient(null);
    setFormData({ name: '', phone: '', address: '', notes: '', company: '', identification_number: '', email: '' });
    setDialogOpen(true);
  };

  const openEditDialog = (client: Client) => {
    setEditing(true)
    setEditingClient(client);
    setFormData({
      name: client.name,
      phone: client.phone || '',
      address: client.address || '',
      notes: client.notes || '',
      company: client.company || '',
      identification_number: client.identification_number || '',
      email: client.email || '',
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
    setEditing(false)
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteClient.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  //const clientsWithDebt = clients?.data.filter(c => Number(c.balance) < 0) || [];
  const allClients = clients?.data || [];

  // "A Favor" uses its own server-side query
  const paginatedFavor = clientsInFavor?.data || [];
  const favorTotalPages = Number(clientsInFavor?.pagination.totalPages) || 1;
  const favorTotal = Number(clientsInFavor?.pagination.total) || 0;
  const favorSum = paginatedFavor.reduce((sum, c) => sum + Number(c.balance), 0);

  // Clients with debt 
  const paginatedDebt = clientsWithDebt?.data || [];
  const debtTotalPages = Number(clientsWithDebt?.pagination.totalPages) || 1;
  const debtTotal = Number(clientsWithDebt?.pagination.total) || 0;
  const debtSum = paginatedDebt.reduce((sum, c) => sum + Number(c.balance), 0);

  const allTotalPages = Number(clients?.pagination.totalPages);
  //const debtTotalPages = Math.max(1, Math.ceil(clientsWithDebt.length / PAGE_SIZE));
  const paginatedAll = allClients; // el API ya pagina server-side
  //const paginatedDebt = clientsWithDebt.slice(debtPage * PAGE_SIZE, (debtPage + 1) * PAGE_SIZE);

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

          <ClientDialog 
            setDialogOpen={setDialogOpen}
            formData={formData}
            setFormData={setFormData}
            handler={handleSubmit}
            editing={editing}
            pending={createClient.isPending || updateClient.isPending}
          />
        </Dialog>
      </div>

      <Tabs defaultValue="all">
        <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center md:gap-4">

        
          <TabsList>
            <TabsTrigger value="all" className="flex items-center gap-2"  >
              <Users className="w-4 h-4" />
              Todos
              <Badge variant="secondary">{clients?.pagination.total}</Badge>
            </TabsTrigger>
            <TabsTrigger value="payables" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              A Favor
              <Badge variant="destructive" className='bg-green-800 hover:bg-green-600'>{favorTotal}</Badge>
            </TabsTrigger>
            <TabsTrigger value="debtors" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Con Deuda
              <Badge variant="destructive">{debtTotal}</Badge>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center w-full h-[40px] md:w-1/2 bg-background rounded-xl shadow-sm border border-border focus-within:ring-2 focus-within:ring-primary transition-all">
            <Search className="w-5 h-5 md:w-6 md:h-6 ml-3 md:ml-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Buscar por nombre, empresa o documento"
              className="w-full py-2.5 md:py-3 px-3 md:px-4 bg-transparent outline-none text-sm md:text-base text-foreground placeholder-muted-foreground"
              onChange={(e) => setSearchInput(e.target.value)}
              value={searchInput}
            />
          </div>
        </div>
        
        <TabsContent value="all" className="mt-4">
          {isLoadingAll ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : allClients.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No hay clientes registrados. Crea el primero usando el botón de arriba.
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedAll.map((client) => (
                  <ClientCard 
                    key={client.id} 
                    client={client} 
                    onEdit={openEditDialog}
                    onDelete={setDeleteTarget}
                    onViewStatement={() => {
                      setStatementClientId(client.id)
                      setClient(client)
                    }}
                    formatCurrency={formatCurrency}
                  />
                ))}
              </div>
              {allTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button variant="outline" size="sm" disabled={allPage === 1} onClick={() => setAllPage(p => p - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {allPage} de {allTotalPages}
                  </span>
                  <Button variant="outline" size="sm" disabled={allPage >= allTotalPages} onClick={() => setAllPage(p => p + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="payables" className="mt-4">
          {isLoadingInFavor ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : paginatedFavor.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No tienes deudas con los clientes 🎉
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className="bg-destructive/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-800" />
                    Total Cuentas por Pagar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-800">
                    {formatCurrency(favorSum)}
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedFavor.map((client) => (
                  <ClientCard 
                    key={client.id} 
                    client={client} 
                    onEdit={openEditDialog}
                    onDelete={setDeleteTarget}
                    onViewStatement={() => {
                      setStatementClientId(client.id)
                      setClient(client)
                    }}
                    formatCurrency={formatCurrency}

                  />
                ))}
              </div>
              {favorTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button variant="outline" size="sm" disabled={favorPage === 1} onClick={() => setFavorPage(p => p - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {favorPage} de {favorTotalPages}
                  </span>
                  <Button variant="outline" size="sm" disabled={favorPage >= favorTotalPages} onClick={() => setFavorPage(p => p + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="debtors" className="mt-4">
          { isLoadingWithDebt ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : paginatedDebt.length === 0 ? (
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
                    {formatCurrency(Math.abs(debtSum))}
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedDebt.map((client) => (
                  <ClientCard 
                    key={client.id} 
                    client={client} 
                    onEdit={openEditDialog}
                    onDelete={setDeleteTarget}
                    onViewStatement={() => {
                      setStatementClientId(client.id)
                      setClient(client)
                    }}
                    formatCurrency={formatCurrency}

                  />
                ))}
              </div>
              {debtTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button variant="outline" size="sm" disabled={debtPage === 0} onClick={() => setDebtPage(p => p - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {debtPage + 1} de {debtTotalPages}
                  </span>
                  <Button variant="outline" size="sm" disabled={debtPage >= debtTotalPages - 1} onClick={() => setDebtPage(p => p + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )

          }
        </TabsContent>
      </Tabs>
      
      <ClientStatementView
        client={client}
        clientId={statementClientId || ''}
        open={!!statementClientId}
        onOpenChange={(open) => !open && setStatementClientId(null)}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !deleting && !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente a <strong>{deleteTarget?.name}</strong> y todos sus datos asociados. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onViewStatement: () => void;
  formatCurrency: (value: number) => string;
}

function ClientCard({ client, onEdit, onDelete, onViewStatement, formatCurrency }: ClientCardProps) {
  const hasDebt = Number(client.balance)  < 0;
  const hasFavor = Number(client.balance) > 0;
  
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
              {hasFavor && (
                <Badge variant="outline" className="text-green-600 border-green-600 shrink-0">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  A Favor
                </Badge>
              )

              }
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

            {client.email && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {client.email}
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
                Deuda: {formatCurrency(Math.abs(Number(client.balance)))}
              </p>
            )}
            {hasFavor && (
              <p className="text-sm font-medium text-green-600">
                A Favor: {formatCurrency(Number(client.balance))}
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
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
              onClick={() => onDelete(client)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
