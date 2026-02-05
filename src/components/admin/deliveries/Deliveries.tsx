import { useState } from 'react';
import useSWR from 'swr';
import Modal from 'react-modal';
import { Search, PlusCircle } from 'lucide-react';
import ModalDomis from './ModalDomis';
import { AdminNewDeliveryForm } from '../AdminNewDeliveryForm';
import DomisTab from './DomisTab';
//import clienteAxios from '@/config/axios';
//import { useAdmin } from '@/hooks/useAdmin';

interface DeliveryListProps {
  courierId?: string;
  showCourier?: boolean;
}

// Estilos del modal
const customStyles = {
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 50,
  },
  content: {
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: '#fff',
    padding: '0',
    maxWidth: '90%',
    maxHeight: '90%',
    borderRadius: '1rem',
    overflow: 'auto',
  },
};

// Configurar Modal para Next.js
if (typeof window !== 'undefined') {
  Modal.setAppElement('body');
}

const Deliveries = ({ courierId, showCourier }: DeliveryListProps) => {
  const [busqueda, setBusqueda] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [toggleState, setToggleState] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('')
  const [data, setData] = useState('')


  /**
   *  const { 
    modalOpen, 
    setModalOpen, 
    setNombreCli, 
    setEmpresaCli, 
    setDireccionCli, 
    setTelefonoCli, 
    toggleState, 
    setToggleState 
  } = useAdmin();
   */
 

  // Fetcher para SWR
 
  /** 
  const fetcher = () => 
    clienteAxios('/domis/listar-domis', { withCredentials: true })
      .then(res => res.data);

  const { data, error, isLoading } = useSWR(
    '/domis/listar-domis', 
    fetcher, 
    { refreshInterval: 100 }
  );*/

  const toggleTab = (index: number) => setToggleState(index);

  const handleCloseModal = () => {
    console.log('Creando nuevo domi...')
    setModalOpen(false)
    /**
     * setModalOpen(false);
    setNombreCli('');
    setEmpresaCli('');
    setDireccionCli('');
    setTelefonoCli('');
     */
    
  };

  return (
    <div className="p-6 text-gray-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        {/* Search */}
        <div className="flex items-center w-full md:w-1/2 bg-white rounded-xl shadow-sm border border-gray-200 focus-within:ring-2 focus-within:ring-[#2291B9] transition-all">
          <Search className="w-6 h-6 ml-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por código de domicilio..."
            className="w-full py-3 px-4 bg-transparent outline-none text-gray-700 placeholder-gray-400"
            onChange={(e) => setBusqueda(e.target.value)}
            value={busqueda}
          />
        </div>

        {/* Create button */}
        <button
          className="flex items-center justify-center gap-2 bg-[#2291B9] hover:bg-[#2FA5CF] text-white font-medium rounded-xl px-5 py-3 shadow-sm transition-all cursor-pointer"
          onClick={() => setModalOpen(true)}
        >
          <PlusCircle className="w-6 h-6" />
          Registrar Nuevo Domi
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-2 text-sm font-semibold uppercase">
        <button
          className={`flex-1 text-center py-3 rounded-t-xl transition-all cursor-pointer ${
            toggleState === 1 
              ? 'bg-orange-500 text-white shadow-md' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => toggleTab(1)}
        >
          Pendientes
        </button>
        <button
          className={`flex-1 text-center py-3 rounded-t-xl transition-all cursor-pointer ${
            toggleState === 2 
              ? 'bg-green-600 text-white shadow-md' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => toggleTab(2)}
        >
          Completados
        </button>
        <button
          className={`flex-1 text-center py-3 rounded-t-xl transition-all cursor-pointer ${
            toggleState === 3 
              ? 'bg-red-600 text-white shadow-md' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => toggleTab(3)}
        >
          Rechazados
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow-md rounded-b-xl mt-0 border border-gray-200">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-12 text-sm">
            Error al cargar los domicilios. Por favor, intenta de nuevo.
          </div>
        ) : data && data.length ? (
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#F7F9FB] border-b border-gray-200 text-gray-600 uppercase text-xs">
              <tr>
                <th className="p-4 font-semibold">Código</th>
                <th className="p-4 font-semibold">Cliente</th>
                <th className="p-4 font-semibold">Mensajero</th>
                <th className="p-4 font-semibold">Estado</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              <DomisTab data={data} toggleState={toggleState} busqueda={busqueda} />
            </tbody>
          </table>
        ) : (
          <div className="text-center text-gray-500 py-12 text-sm">
            No hay domicilios registrados.
          </div>
        )}
      </div>

      {/* Modal */}
      {typeof window !== 'undefined' && (
        <ModalDomis
          isOpen={modalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default Deliveries;