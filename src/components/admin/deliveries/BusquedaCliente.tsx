import { useState } from "react";
import { Search, Building2, User, Phone, IdCard, Plus } from "lucide-react";
import { useClients, useCreateClient, Client } from "@/hooks/useClients";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import ClientDialog from "../companies/ClientDialog";
import { MyClient } from "@/types";

interface BusquedaClienteProps {
  onClientSelect?: (client: Client) => void;
}

const BusquedaCliente = ({ onClientSelect }: BusquedaClienteProps) => {
  const { data: clients, isLoading } = useClients();
  const createClient = useCreateClient();
  const [busqueda, setBusqueda] = useState('');
  const [showResults, setShowResults] = useState(false);

  // New client dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<MyClient>({
          name: '',
          phone: '',
          address: '',
          notes: '',
          company: '',
          identification_number: '',
          email: '',
  });
  

  const clientesFiltrados = busqueda === ''
    ? []
    : (clients || []).filter(cliente => 
        cliente.name.toLowerCase().includes(busqueda.toLowerCase()) ||
        cliente.company?.toLowerCase().includes(busqueda.toLowerCase()) ||
        cliente.identification_number?.toLowerCase().includes(busqueda.toLowerCase())
      );

  const handleClientSelect = (client: Client) => {
    onClientSelect?.(client);
    setBusqueda(client.company || client.name);
    setShowResults(false);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return;
    try {
      const created = await createClient.mutateAsync({
        name: formData.name,
        phone: formData.phone || null,
        address: formData.address || null,
        notes: formData.notes || null,
        company: formData.company || null,
        identification_number: formData.identification_number || null,
        email: formData.email || null,
      });
      // Auto-select the new client
      handleClientSelect(created as Client);
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
    } catch {
      // error handled by hook
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center rounded-lg bg-background shadow-sm border border-input focus-within:ring-2 focus-within:ring-ring transition-all">
        <Search className="w-5 h-5 ml-3 text-muted-foreground" />
        <Input
          type="text"
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          placeholder="Buscar por nombre, empresa o identificación..."
          onChange={(e) => {
            setBusqueda(e.target.value);
            setFormData({...formData, name: busqueda})
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          value={busqueda}
        />
      </div>

      {showResults && busqueda !== '' && (
        <ul className="absolute top-[calc(100%+4px)] left-0 right-0 bg-background border border-border rounded-lg shadow-lg z-50 overflow-auto max-h-[250px]">
          {/* Create new client option */}
          <li
            className="p-3 cursor-pointer hover:bg-primary/10 transition-colors border-b border-border flex items-center gap-2 text-primary font-medium"
            onClick={() => {
              setShowResults(false);
              setDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Crear cliente nuevo
          </li>

          {isLoading ? (
            <li className="p-3 text-muted-foreground text-sm text-center">
              Cargando clientes...
            </li>
          ) : clientesFiltrados.length <= 0 ? (
            <li className="p-3 text-muted-foreground text-sm text-center">
              No se encontraron resultados
            </li>
          ) : (
            clientesFiltrados.map((cliente) => (
              <li 
                key={cliente.id} 
                className="p-3 cursor-pointer hover:bg-accent transition-colors border-b border-border last:border-b-0"
                onClick={() => handleClientSelect(cliente)}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground">{cliente.company || 'Sin empresa'}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {cliente.name}
                    </span>
                    {cliente.identification_number && (
                      <span className="flex items-center gap-1">
                        <IdCard className="w-3 h-3" />
                        {cliente.identification_number}
                      </span>
                    )}
                    {cliente.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {cliente.phone}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      )}

      {/**Create new client dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <ClientDialog 
          setDialogOpen={setDialogOpen}
          formData={formData}
          setFormData={setFormData}
          handler={handleCreateClient}
          pending={createClient.isPending}
        />
      </Dialog>
      
    </div>
  );
};

export default BusquedaCliente;
