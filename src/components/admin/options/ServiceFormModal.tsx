import React, { useState, useEffect } from 'react';
//import { useService, useCreateService, useUpdateService } from '@/hooks/useServices';
import { X } from 'lucide-react';

interface ServiceFormModalProps {
  serviceId?: string | null;
  onClose: () => void;
}

export function ServiceFormModal({ serviceId, onClose }: ServiceFormModalProps) {
  //const { data: existingService } = useService(serviceId || '');
  //const createService = useCreateService();
  //const updateService = useUpdateService();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    base_price: 0,
    is_active: true,
    courier_percentage: 50,
    company_percentage: 50,
    platform_percentage: 0,
    requires_pickup: false,
    requires_signature: false,
    requires_photo: false,
    max_delivery_time_hours: 24,
    allows_schedule: true,
    priority_level: 1,
    notes: '',
  });
  const totalPercentage = 100;

  /**
   * 
   
  useEffect(() => {
    if (existingService) {
      setFormData({
        name: existingService.name,
        code: existingService.code,
        description: existingService.description || '',
        base_price: existingService.base_price,
        is_active: existingService.is_active,
        courier_percentage: existingService.courier_percentage,
        company_percentage: existingService.company_percentage,
        platform_percentage: existingService.platform_percentage,
        requires_pickup: existingService.requires_pickup,
        requires_signature: existingService.requires_signature,
        requires_photo: existingService.requires_photo,
        max_delivery_time_hours: existingService.max_delivery_time_hours || 24,
        allows_schedule: existingService.allows_schedule,
        priority_level: existingService.priority_level,
        notes: existingService.notes || '',
      });
    }
  }, [existingService]);

  const totalPercentage =
    formData.courier_percentage +
    formData.company_percentage +
    formData.platform_percentage;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (totalPercentage !== 100) {
      alert('La suma de los porcentajes debe ser 100%');
      return;
    }

    if (serviceId) {
      await updateService.mutateAsync({ id: serviceId, updates: formData });
    } else {
      await createService.mutateAsync(formData);
    }

    onClose();
  };
  */

  const handleSubmit = () => {
    console.log('Enviando el servicio')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {serviceId ? 'Editar Servicio' : 'Nuevo Servicio'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información básica */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Información Básica
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del servicio *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Standard, Express, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: STD"
                  maxLength={10}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe las características del servicio..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio base *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.base_price}
                  onChange={(e) =>
                    setFormData({ ...formData, base_price: parseFloat(e.target.value) })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Servicio activo
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Distribución de ganancias */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Distribución de Ganancias
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Courier %
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.courier_percentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      courier_percentage: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Empresa %
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.company_percentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      company_percentage: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plataforma %
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.platform_percentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      platform_percentage: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-2">
              <span
                className={`text-sm ${
                  totalPercentage === 100
                    ? 'text-green-600'
                    : 'text-red-600 font-semibold'
                }`}
              >
                Total: {totalPercentage.toFixed(2)}% {totalPercentage !== 100 && '(debe ser 100%)'}
              </span>
            </div>
          </div>

          {/* Configuración del workflow */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Configuración del Proceso
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requires_pickup}
                  onChange={(e) =>
                    setFormData({ ...formData, requires_pickup: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Requiere recoger paquete</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requires_signature}
                  onChange={(e) =>
                    setFormData({ ...formData, requires_signature: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Requiere firma del cliente</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requires_photo}
                  onChange={(e) =>
                    setFormData({ ...formData, requires_photo: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Requiere foto de entrega</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allows_schedule}
                  onChange={(e) =>
                    setFormData({ ...formData, allows_schedule: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Permite agendar entrega</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiempo máximo de entrega (horas)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_delivery_time_hours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_delivery_time_hours: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nivel de prioridad (1-5)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.priority_level}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority_level: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas internas
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Notas o instrucciones especiales..."
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={totalPercentage !== 100}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {serviceId ? 'Actualizar' : 'Crear'} Servicio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}