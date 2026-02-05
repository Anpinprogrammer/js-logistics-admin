import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { DeliveryInfo } from './DeliveryInfo';
import { ClientInfo } from './ClientInfo';
import { nanoid } from 'nanoid';
import Swal from 'sweetalert2';

interface Mensajero {
  _id: string;
  nombres: string;
}

interface ModalDomisProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalDomis = ({ isOpen, onClose }: ModalDomisProps) => {

    const [clienteId, setClienteId] = useState<string>('')
    const [nombreCli, setNombreCli] = useState<string>('')
    const [empresaCli, setEmpresaCli] = useState<string>('')
    const [direccionCli, setDireccionCli] = useState<string>('')
    const [telefonoCli, setTelefonoCli] = useState<string>('')
    const [editar, setEditar] = useState<boolean>(false)
    const [valorDomi, setValorDomi] = useState<number>(0)
    const [pagoMen, setPagoMen] = useState<number>(0)
    const [mensajeroSeleccionado, setMensajeroSeleccionado] = useState<string>('')
    const [fecha, setFecha] = useState<Date>(new Date())
    const [nombreEntrega, setNombreEntrega] = useState<string>('')
    const [direccion, setDireccion] = useState<string>('')
    const [telefono, setTelefono] = useState<string>('')
    const [notas, setNotas] = useState<string>('')
    const [ruta, setRuta] = useState<string>('')
    const [idDomi, setIdDomi] = useState<string>('')

    /**
     * 
     
  const {
    clienteId, setClienteId,
    nombreCli, setNombreCli,
    empresaCli, setEmpresaCli,
    direccionCli, setDireccionCli,
    telefonoCli, setTelefonoCli,
    editar, setEditar,
    valorDomi, setValorDomi,
    pagoMen, setPagoMen,
    mensajeroSeleccionado, setMensajeroSeleccionado,
    fecha, setFecha,
    nombreEntrega, setNombreEntrega,
    direccion, setDireccion,
    telefono, setTelefono,
    notas, setNotas,
    ruta, setRuta,
    idDomi
  } = useAdmin();

  */

  const [mensajeros, setMensajeros] = useState<Mensajero[]>([]);
  const [alerta, setAlerta] = useState('');

  /**
   * useEffect(() => {
    const cargarMensajeros = async () => {
      if (isOpen) {
        try {
          const { data } = await clienteAxios.get('/mensajeros/listar-mensajeros', { 
            withCredentials: true 
          });
          setMensajeros(data);
        } catch (error) {
          console.error('Error cargando mensajeros:', error);
        }
      }
    };
    cargarMensajeros();
  }, [isOpen]);
   */
  

  useEffect(() => {
    setPagoMen(Number(valorDomi) * 0.7);
  }, [valorDomi, setPagoMen]);

  const resetForm = () => {
    setClienteId('');
    setMensajeroSeleccionado('');
    setValorDomi(0);
    setPagoMen(0);
    setRuta('');
    setFecha(new Date());
    setNombreEntrega('');
    setDireccion('');
    setTelefono('');
    setNotas('');
    setAlerta('');
    setEditar(false);
  };

  const handleSave = async () => {
    // Validaciones
    if ([nombreCli, empresaCli, direccionCli, telefonoCli, mensajeroSeleccionado, ruta, fecha, direccion].includes('')) {
      setAlerta('Por favor, completa todos los campos obligatorios.');
      return;
    }

    if (valorDomi <= 0 || pagoMen <= 0) {
      setAlerta('Verifica los valores ingresados.');
      return;
    }

    if (Number(pagoMen) > Number(valorDomi)) {
      setAlerta('El pago al mensajero no puede ser mayor al valor del domicilio.');
      return;
    }

    setAlerta('');

    /**
     * 
    

    try {
      if (editar) {
        // Actualizar domicilio existente
        const { data } = await clienteAxios.put(`/domis/actualizar-domi/${idDomi}`, {
          cliente: clienteId, 
          mensajero: mensajeroSeleccionado, 
          valorDomi,
          pagoMensajero: pagoMen, 
          ruta, 
          fecha, 
          nombreEntrega, 
          direccion, 
          telefono, 
          notas
        }, { withCredentials: true });
        
        await Swal.fire({
          title: 'Éxito',
          text: data.msg,
          icon: 'success',
          confirmButtonColor: '#f97316'
        });
      } else {
        // Crear nuevo domicilio
        if (clienteId) {
          // Con cliente existente
          const { data } = await clienteAxios.post('/domis/ingresar-domi', {
            noDomi: nanoid(10),
            cliente: clienteId,
            mensajero: mensajeroSeleccionado,
            valorDomi,
            pagoMensajero: pagoMen,
            ruta, 
            fecha, 
            nombreEntrega, 
            direccion, 
            telefono, 
            notas
          }, { withCredentials: true });
          
          await Swal.fire({
            title: 'Éxito',
            text: data.msg,
            icon: 'success',
            confirmButtonColor: '#f97316'
          });
        } else {
          // Con cliente nuevo
          const { data } = await clienteAxios.post('/domis/ingresar-domi', {
            noDomi: nanoid(10),
            nombres: nombreCli,
            empresa: empresaCli,
            direccionCli,
            telefonoCli,
            mensajero: mensajeroSeleccionado,
            valorDomi,
            pagoMensajero: pagoMen,
            ruta, 
            fecha, 
            nombreEntrega, 
            direccion, 
            telefono, 
            notas
          }, { withCredentials: true });
          
          await Swal.fire({
            title: 'Éxito',
            text: data.msg,
            icon: 'success',
            confirmButtonColor: '#f97316'
          });
        }
      } 

      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error guardando domicilio:', error);
      await Swal.fire({
        title: 'Error',
        text: error.response?.data?.msg || 'Ocurrió un error al guardar el domicilio',
        icon: 'error',
        confirmButtonColor: '#f97316'
      });
    } */
  }; 

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-6xl p-6 md:p-8 overflow-y-auto max-h-[90vh] border border-border">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <h2 className="text-2xl font-semibold text-foreground">
            {editar ? 'Editar Domicilio' : 'Crear Nuevo Domicilio'}
          </h2>
          <button
            className="text-muted-foreground hover:text-foreground transition p-2 hover:bg-muted rounded-lg"
            onClick={() => { 
              onClose(); 
              resetForm(); 
            }}
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}

        
         

       <div className="grid md:grid-cols-2 gap-4 items-stretch">
        {/* Columna Cliente */}
        <div className="h-full">
            <ClientInfo />
        </div>

        {/* Columna Entrega */}
        <div className="h-full">
            <DeliveryInfo />
        </div>
        </div>

          
          
          {/**
           * <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              🧍 Datos del Cliente
            </h3>
           */}
          
            {/** <BusquedaCliente />*/}
            
            {/** 
            <div className="space-y-3 mt-4">
              <Input 
                label="Nombre *" 
                value={nombreCli} 
                setValue={setNombreCli} 
                placeholder="Nombre del cliente" 
              />
              <Input 
                label="Empresa *" 
                value={empresaCli} 
                setValue={setEmpresaCli} 
                placeholder="Empresa del cliente" 
              />
              <Input 
                label="Teléfono *" 
                value={telefonoCli} 
                setValue={setTelefonoCli} 
                placeholder="Teléfono del cliente" 
              />
              <Input 
                label="Dirección de Recogida *" 
                value={direccionCli} 
                setValue={setDireccionCli} 
                placeholder="Dirección completa" 
              />
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Valor Domi *" 
                  value={valorDomi} 
                  setValue={setValorDomi} 
                  type="number" 
                  placeholder="0"
                />
                <div className='flex flex-col'>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Pago Mensajero
                  </label>
                  <div className="w-full border border-gray-300 rounded-lg p-2 bg-gray-100 text-gray-700 font-medium">
                    ${pagoMen.toLocaleString('es-CO')}
                  </div>
                </div>
              </div>
            </div>
          </div>
          */}

          {/* Columna Entrega */}
          {/** 
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              📦 Datos de Entrega
            </h3>

            <div className="space-y-3">
              <Select
                label="Mensajero *"
                value={mensajeroSeleccionado}
                onChange={setMensajeroSeleccionado}
                options={mensajeros.map(m => ({ value: m._id, label: m.nombres }))}
                placeholder="Seleccione un mensajero"
              />

              <Select
                label="Ruta *"
                value={ruta}
                onChange={setRuta}
                options={[
                  { value: '1', label: 'Mañana' },
                  { value: '2', label: 'Tarde' },
                  { value: '3', label: 'Noche' },
                ]}
                placeholder="Seleccione una ruta"
              />

              <Input 
                label="Fecha de entrega *" 
                value={fecha.toISOString()} 
                setValue={setFecha} 
                type="date" 
              />
              <Input 
                label="Quién recibe" 
                value={nombreEntrega} 
                setValue={setNombreEntrega} 
                placeholder="Nombre del receptor" 
              />
              <Input 
                label="Dirección de entrega *" 
                value={direccion} 
                setValue={setDireccion} 
                placeholder="Dirección completa" 
              />
              <Input 
                label="Teléfono" 
                value={telefono} 
                setValue={setTelefono} 
                placeholder="Teléfono del receptor" 
              /> 
              
              <TextArea 
                label="Anotaciones" 
                value={notas} 
                setValue={setNotas} 
                placeholder="Notas especiales o comentarios" 
              />
            </div>
          </div>
        </div>
        */}
        

        {/* Alerta */}
        {alerta && (
          <div className="mt-5 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-center text-destructive font-medium">{alerta}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-4 mt-8 justify-center">
          <button
            type="button"
            className="px-6 py-2.5 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition font-medium"
            onClick={() => { 
              onClose(); 
              resetForm(); 
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="px-6 py-2.5 bg-primary gradient-primary text-primary-foreground rounded-lg transition shadow-md font-medium hover:bg-primary/90 cursor-pointer"
            onClick={handleSave}
          >
            {editar ? 'Actualizar Pedido' : 'Crear Pedido'}
          </button>
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at document body level
  return createPortal(modalContent, document.body);
};

// Subcomponentes reutilizables
interface InputProps {
  label: string;
  value: string | number;
  setValue: (value: any) => void;
  placeholder?: string;
  type?: string;
}

const Input = ({ label, value, setValue, placeholder, type = 'text' }: InputProps) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => setValue(type === 'number' ? Number(e.target.value) : e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-400 outline-none"
    />
  </div>
);

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
}

const Select = ({ label, value, onChange, options, placeholder }: SelectProps) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-orange-400 outline-none cursor-pointer"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

interface TextAreaProps {
  label: string;
  value: string;
  setValue: (value: string) => void;
  placeholder?: string;
}

const TextArea = ({ label, value, setValue, placeholder }: TextAreaProps) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-300 rounded-lg p-2 h-20 resize-none focus:ring-2 focus:ring-orange-400 outline-none"
    />
  </div>
);

export default ModalDomis;