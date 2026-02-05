import { useState, useEffect } from "react";
import { Search } from "lucide-react";
//import { useAdmin } from "@/hooks/useAdmin";
//import clienteAxios from "@/lib/axios";

interface Cliente {
  _id: string;
  nombres: string;
  empresa: string;
  telefono: string;
  direccion: string;
}

const BusquedaCliente = () => {
/**
 * const { 
    setNombreCli, 
    setEmpresaCli, 
    setDireccionCli, 
    setTelefonoCli, 
    setClienteId 
  } = useAdmin();
 */
  

  const [busqueda, setBusqueda] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [nombreCli, setNombreCli] = useState<string>('')
  const [empresaCli, setEmpresaCli] = useState<string>('')
  const [direccionCli, setDireccionCli] = useState<string>('')
  const [clienteId, setClienteId] = useState<string>('')
  const [telefonoCli, setTelefonoCli] = useState<string>('') 

  /**
   * useEffect(() => {
    const cargarClientes = async () => {
      setLoading(true);
      try {
        const { data } = await clienteAxios.get('/clientes/listar-clientes', { 
          withCredentials: true 
        });
        setClientes(data);
      } catch (error) {
        console.error('Error cargando clientes:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarClientes();
  }, []);
   */

  

  const clientesFiltrados = busqueda === ''
    ? []
    : clientes.filter(cliente => 
        cliente.empresa.toLowerCase().includes(busqueda.toLowerCase())
      );

  const handleCliente = async (id: string) => {
    console.log('Desde handleCliente')
    /**
     * 
   
    try {
      const { data } = await clienteAxios(`/clientes/listar-cliente/${id}`, { 
        withCredentials: true 
      });
      
      const { _id, nombres, empresa, telefono, direccion } = data;
      
      setClienteId(_id);
      setNombreCli(nombres);
      setEmpresaCli(empresa);
      setTelefonoCli(telefono);
      setDireccionCli(direccion);
      setBusqueda('');
      
    } catch (error) {
      console.error('Error obteniendo cliente:', error);
    }
        */
  };

  return (
    <div className="relative">
      <div className="flex items-center rounded-lg bg-white shadow-sm border border-gray-200 focus-within:ring-2 transition-all">
        <Search className="w-5 h-5 ml-3 text-gray-400" />
        
        <input
          type="text"
          className="pl-2 pr-4 py-2 outline-none text-gray-800 placeholder-gray-400 w-full rounded-lg"
          placeholder="Buscar por nombre de empresa..."
          onChange={(e) => setBusqueda(e.target.value)}
          value={busqueda}
        />
      </div>

      {/* Desplegar resultados debajo de la barra de búsqueda */}
      {clientes.length > 0 && busqueda !== '' && (
        <ul className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-auto max-h-[200px]">
          {clientesFiltrados.length <= 0 ? (
            <li className="p-3 text-gray-500 text-sm text-center">
              No se encontraron resultados
            </li>
          ) : (
            clientesFiltrados.map((cliente) => (
              <li 
                key={cliente._id} 
                className="p-3 cursor-pointer hover:bg-orange-50 transition-colors border-b border-gray-100 last:border-b-0"
                onClick={() => handleCliente(cliente._id)}
              >
                <div className="flex flex-col">
                  <span className="font-medium text-gray-800">{cliente.empresa}</span>
                  <span className="text-xs text-gray-500">{cliente.nombres}</span>
                </div>
              </li>
            ))
          )}
        </ul>
      )}

      {loading && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-3">
          <p className="text-gray-500 text-sm text-center">Cargando clientes...</p>
        </div>
      )}
    </div>
  );
};

export default BusquedaCliente;