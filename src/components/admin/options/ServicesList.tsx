import React, { useState } from 'react';
//import { useServices, useDeleteService } from '@/hooks/useServices';
import { ServiceFormModal } from './ServiceFormModal';
import { ServiceModal } from './ServiceModal';
import { Package, Trash2, Edit, Plus, TrendingUp, Clock, CheckCircle } from 'lucide-react';

// Mock data para testing en frontend
export const mockServices = [
  {
    id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    name: 'Standard',
    code: 'STD',
    description: 'Servicio de entrega estándar con tiempo de entrega de 24-48 horas. Incluye seguimiento en tiempo real y confirmación de entrega.',
    base_price: 5.00,
    is_active: true,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-02-20T14:22:00Z',
    // Distribución de ganancias
    courier_percentage: 60.00,
    company_percentage: 40.00,
    platform_percentage: 0.00,
    // Configuración de workflow
    requires_pickup: true,
    requires_signature: true,
    requires_photo: true,
    max_delivery_time_hours: 48,
    allows_schedule: true,
    priority_level: 2,
    notes: 'Servicio estándar con proceso completo de pickup y entrega. Ideal para envíos regulares.',
  },
  {
    id: '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
    name: 'Terminal',
    code: 'TRM',
    description: 'Entrega en terminal específica para ser retirado por el cliente. Sin costo de entrega a domicilio.',
    base_price: 3.50,
    is_active: true,
    created_at: '2024-01-15T10:31:00Z',
    updated_at: '2024-02-18T09:15:00Z',
    // Distribución de ganancias
    courier_percentage: 40.00,
    company_percentage: 60.00,
    platform_percentage: 0.00,
    // Configuración de workflow
    requires_pickup: false,
    requires_signature: false,
    requires_photo: false,
    max_delivery_time_hours: 72,
    allows_schedule: true,
    priority_level: 1,
    notes: 'Cliente retira en terminal, no requiere courier para entrega. Menor costo operativo.',
  },
  {
    id: '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r',
    name: 'Drop',
    code: 'DRP',
    description: 'Servicio de entrega express con tiempo reducido. Alta prioridad y seguimiento premium.',
    base_price: 8.00,
    is_active: true,
    created_at: '2024-01-15T10:32:00Z',
    updated_at: '2024-02-20T16:45:00Z',
    // Distribución de ganancias
    courier_percentage: 70.00,
    company_percentage: 30.00,
    platform_percentage: 0.00,
    // Configuración de workflow
    requires_pickup: true,
    requires_signature: true,
    requires_photo: true,
    max_delivery_time_hours: 4,
    allows_schedule: false,
    priority_level: 5,
    notes: 'Servicio express de alta prioridad. Entrega el mismo día en menos de 4 horas.',
  },
];

// Tipos TypeScript
export interface Service {
  id: string;
  name: string;
  code: string;
  description: string | null;
  base_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  courier_percentage: number;
  company_percentage: number;
  platform_percentage: number;
  requires_pickup: boolean;
  requires_signature: boolean;
  requires_photo: boolean;
  max_delivery_time_hours: number | null;
  allows_schedule: boolean;
  priority_level: number;
  notes: string | null;
}

export function ServicesList() {
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const handleSave = () => {
    console.log('Guardando el servicio')
  }

  /*const { data: services, isLoading } = useServices(showInactive);
  const deleteService = useDeleteService();

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Eliminar el servicio "${name}"?`)) {
      deleteService.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  **/

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Servicios de Logística</h1>
          <p className="text-gray-600 mt-1">
            Gestiona los tipos de servicio y su configuración
          </p>
        </div>
        <button
          onClick={() => {
            setEditingService(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          Nuevo Servicio
        </button>
      </div>

      {/* Filtro */}
      <div className="mb-4">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded border-gray-300"
          />
          Mostrar servicios inactivos
        </label>
      </div>

      {/* Grid de servicios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockServices?.map((service) => (
          <div
            key={service.id}
            className={`bg-white rounded-lg shadow-md border-2 transition-all ${
              service.is_active
                ? 'border-green-200 hover:shadow-lg'
                : 'border-gray-200 opacity-60'
            }`}
          >
            {/* Header del servicio */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${
                    service.priority_level >= 4 ? 'bg-red-100' :
                    service.priority_level >= 2 ? 'bg-blue-100' :
                    'bg-gray-100'
                  }`}>
                    <Package className={`w-6 h-6 ${
                      service.priority_level >= 4 ? 'text-red-600' :
                      service.priority_level >= 2 ? 'text-blue-600' :
                      'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{service.name}</h3>
                    <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {service.code}
                    </span>
                  </div>
                </div>
                {service.is_active && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    Activo
                  </span>
                )}
              </div>

              {service.description && (
                <p className="text-sm text-gray-600">{service.description}</p>
              )}
            </div>

            {/* Detalles del servicio */}
            <div className="p-6 space-y-4">
              {/* Precio base */}
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-sm text-gray-600">Precio base</span>
                <span className="text-xl font-bold text-gray-900">
                  ${service.base_price.toFixed(2)}
                </span>
              </div>

              {/* Distribución de ganancias */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    Distribución de ganancias
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Courier</span>
                    <span className="font-semibold text-green-600">
                      {service.courier_percentage}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Empresa</span>
                    <span className="font-semibold text-blue-600">
                      {service.company_percentage}%
                    </span>
                  </div>
                  {service.platform_percentage > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Plataforma</span>
                      <span className="font-semibold text-purple-600">
                        {service.platform_percentage}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Características del workflow */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    Características
                  </span>
                </div>
                <div className="space-y-2">
                  {service.requires_pickup && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Requiere recoger paquete
                    </div>
                  )}
                  {service.requires_signature && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Requiere firma
                    </div>
                  )}
                  {service.requires_photo && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Requiere foto de entrega
                    </div>
                  )}
                  {service.max_delivery_time_hours && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      Máx. {service.max_delivery_time_hours}h de entrega
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${
                      service.priority_level >= 4 ? 'bg-red-500' :
                      service.priority_level >= 2 ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`}></div>
                    <span className="text-gray-600">
                      Prioridad: {service.priority_level}/5
                    </span>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-2 pt-4 border-t">
                <button
                  onClick={() => {
                    setEditingService(service.id);
                    setShowModal(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => {}}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <ServiceModal
          open={showModal}
          onOpenChange={setShowModal}
          onSave={handleSave}
        />
      )}
        
    </div>
  );
}