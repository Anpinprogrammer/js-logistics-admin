import { useState} from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import api from '@/services/api';
//import { useAuth } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContextTest';
import { getCurrentWeekDates } from '@/hooks/useDeliveries';
import { reopenDailySettlement } from '@/hooks/useDailyOperations';
import { X } from 'lucide-react';
import { DeliveryInfo } from './DeliveryInfo';
import { ClientInfo } from './ClientInfo';
import { nanoid } from 'nanoid';
import Swal from 'sweetalert2';

interface ModalDomisProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalDomis = ({ isOpen, onClose }: ModalDomisProps) => {

    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [editar, setEditar] = useState<boolean>(false)
    
    const [alerta, setAlerta] = useState('');

    const [clientFormData, setClientFormData] = useState({
      clientId: '',
      clientName: '',
      clientCompany: '',
      clientPhone: '',
      clientAddress: '',
      serviceValue: ''
    })

    const [deliveryFormData, setDeliveryFormData] = useState({
      courierId: '',
      recipientName: '',
      totalToCollect: '',
      paymentMethod: 'cash',
      notes: ''
    })

    const resetForm = () => {
      setClientFormData({
        clientId: '',
        clientName: '',
        clientCompany: '',
        clientPhone: '',
        clientAddress: '',
        serviceValue: ''
      })

      setDeliveryFormData({
        courierId: '',
        recipientName: '',
        totalToCollect: '',
        paymentMethod: '',
        notes: ''
      })
    };

    const createDelivery = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user logged in');
      const { weekStart, weekEnd } = getCurrentWeekDates();

      const totalNum = parseFloat(deliveryFormData.totalToCollect) || 0;
      const serviceNum = parseFloat(clientFormData.serviceValue) || 0;

      const { data: delivery } = await api.post("/deliveries", {
        client_id: clientFormData.clientId,
        courier_id: deliveryFormData.courierId,
        created_by: user.id,
        recipient_name: deliveryFormData.recipientName || null,
        notes: deliveryFormData.notes || null,
        week_start: weekStart,
        week_end: weekEnd,
        delivery_date: new Date().toISOString().split('T')[0],
        status: 'pending' as const,
        service_value: serviceNum,
        total_to_collect: totalNum,
        amount: totalNum,
        payment_method: deliveryFormData.paymentMethod as 'cash' | 'transfer_to_courier' | 'transfer_to_client',
      })

      /**
       * 
       
      const { data: delivery, error } = await supabase
        .from('deliveries')
        .insert({
          client_id: clientFormData.clientId,
          courier_id: deliveryFormData.courierId,
          created_by: user.id,
          recipient_name: deliveryFormData.recipientName || null,
          notes: deliveryFormData.notes || null,
          week_start: weekStart,
          week_end: weekEnd,
          delivery_date: new Date().toISOString().split('T')[0],
          status: 'pending' as const,
          service_value: serviceNum,
          total_to_collect: totalNum,
          amount: totalNum,
          payment_method: deliveryFormData.paymentMethod as 'cash' | 'transfer_to_courier' | 'transfer_to_client',
        })
        .select()
        .single();

      if (error) throw error;

      */

      // Reopen daily settlement if it was already closed
      await reopenDailySettlement(deliveryFormData.courierId);

      // Audit log
      /**
       *  await supabase.from('delivery_audit_log').insert({
        delivery_id: delivery.id,
        action: 'created',
        changed_by: user.id,
        new_values: delivery as any,
      });
       */
     

      return delivery;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['daily-settlements'] });
      Swal.fire({
        title: 'Éxito',
        text: 'Pedido creado exitosamente',
        icon: 'success',
        confirmButtonColor: 'hsl(var(--primary))',
      });
      resetForm();
      onClose();
    },
    onError: (error) => {
      Swal.fire({
        title: 'Error',
        text: 'Error al crear pedido: ' + error.message,
        icon: 'error',
        confirmButtonColor: 'hsl(var(--primary))',
      });
    },
  });

  const handleSave = () => {
    if (!clientFormData.clientId) {
      setAlerta('Selecciona un cliente.');
      return;
    }
    if (!deliveryFormData.courierId) {
      setAlerta('Selecciona un mensajero.');
      return;
    }
    if (!deliveryFormData.totalToCollect || parseFloat(deliveryFormData.totalToCollect) <= 0) {
      setAlerta('Ingresa el valor total a cobrar.');
      return;
    }
    if (!deliveryFormData.paymentMethod) {
      setAlerta('Selecciona una forma de pago.');
      return;
    }
    setAlerta('');
    createDelivery.mutate();
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

        
         

       <div className="grid md:grid-cols-2 gap-6">
        {/* Columna Cliente */}
        <div className="h-full">
            <ClientInfo 
              clientFormData={clientFormData}
              setClientFormData={setClientFormData}
            />
        </div>

        {/* Columna Entrega */}
        <div className="h-full">
            <DeliveryInfo 
              deliveryFormData={deliveryFormData}
              setDeliveryFormData={setDeliveryFormData}
            />
        </div>
        </div>

        

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