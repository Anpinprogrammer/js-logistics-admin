import { useState, useMemo } from 'react';
import { Search, PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePickups, Pickup } from '@/hooks/usePickups';
import { useIsMobile } from '@/hooks/use-mobile';
import ModalPickup from './ModalPickup';
import PickupsTab from './PickupsTab';
import PickupDetailModal from './PickupDetailModal';
import EditPickupModal from './EditPickupModal';
import DeletePickupModal from './DeletePickupModal';
import MarkPickedUpModal from './MarkPickedUpModal';
import AssignToDeliveryModal from './AssignToDeliveryModal';

const ITEMS_PER_PAGE = 5;

const statusMap: Record<number, string[]> = {
  1: ['pending_pickup'],
  2: ['picked_up'],
};

const PickUps = () => {
  const [busqueda, setBusqueda] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [toggleState, setToggleState] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const isMobile = useIsMobile();

  // Action modals
  const [detailPickup, setDetailPickup] = useState<Pickup | null>(null);
  const [editPickup, setEditPickup] = useState<Pickup | null>(null);
  const [deletePickup, setDeletePickup] = useState<Pickup | null>(null);
  const [markPickedUp, setMarkPickedUp] = useState<Pickup | null>(null);
  const [assignDelivery, setAssignDelivery] = useState<Pickup | null>(null);

  const { data: pickups, isLoading, error } = usePickups();

  // Badge counts per tab
  const tabCounts = useMemo(() => {
    if (!pickups) return { 1: 0, 2: 0 };
    const counts: Record<number, number> = { 1: 0, 2: 0 };
    pickups.forEach((p) => {
      for (const [key, statuses] of Object.entries(statusMap)) {
        if (statuses.includes(p.status)) {
          counts[Number(key)]++;
        }
      }
    });
    return counts;
  }, [pickups]);

  // Filtered data for current tab + search
  const filteredData = useMemo(() => {
    if (!pickups) return [];
    const allowedStatuses = statusMap[toggleState] || [];
    return pickups.filter((p) => {
      if (!allowedStatuses.includes(p.status)) return false;
      if (!busqueda) return true;
      const search = busqueda.toLowerCase();
      return (
        p.client?.name?.toLowerCase().includes(search) ||
        p.client?.company?.toLowerCase().includes(search) ||
        p.courier?.full_name?.toLowerCase().includes(search) ||
        p.contact_name?.toLowerCase().includes(search) ||
        p.address?.toLowerCase().includes(search) ||
        p.id.toLowerCase().includes(search)
      );
    });
  }, [pickups, toggleState, busqueda]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const toggleTab = (index: number) => {
    setToggleState(index);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setBusqueda(value);
    setCurrentPage(1);
  };

  return (
    <div className="p-4 md:p-6 text-foreground">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center md:gap-4">
        <div className="flex items-center w-full md:w-1/2 bg-background rounded-xl shadow-sm border border-border focus-within:ring-2 focus-within:ring-primary transition-all">
          <Search className="w-5 h-5 md:w-6 md:h-6 ml-3 md:ml-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Buscar por empresa, mensajero o código..."
            className="w-full py-2.5 md:py-3 px-3 md:px-4 bg-transparent outline-none text-sm md:text-base text-foreground placeholder-muted-foreground"
            onChange={(e) => handleSearchChange(e.target.value)}
            value={busqueda}
          />
        </div>
        <button
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl px-4 md:px-5 py-2.5 md:py-3 shadow-sm transition-all cursor-pointer text-sm md:text-base"
          onClick={() => setModalOpen(true)}
        >
          <PlusCircle className="w-5 h-5 md:w-6 md:h-6" />
          {isMobile ? 'Nueva Recogida' : 'Registrar Nueva Recogida'}
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-4 md:mt-6 flex gap-1 md:gap-2 text-xs md:text-sm font-semibold uppercase">
        <button
          className={`flex-1 text-center py-2.5 md:py-3 rounded-t-xl transition-all cursor-pointer flex items-center justify-center gap-1 md:gap-2 ${
            toggleState === 1
              ? 'bg-orange-500 text-white shadow-md'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
          onClick={() => toggleTab(1)}
        >
          Por Recoger
          <span
            className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full ${
              toggleState === 1 ? 'bg-white/20' : 'bg-foreground/10'
            }`}
          >
            {tabCounts[1]}
          </span>
        </button>
        <button
          className={`flex-1 text-center py-2.5 md:py-3 rounded-t-xl transition-all cursor-pointer flex items-center justify-center gap-1 md:gap-2 ${
            toggleState === 2
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
          onClick={() => toggleTab(2)}
        >
          Recogidos
          <span
            className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full ${
              toggleState === 2 ? 'bg-white/20' : 'bg-foreground/10'
            }`}
          >
            {tabCounts[2]}
          </span>
        </button>
      </div>

      {/* Content */}
      <div className="bg-background shadow-md rounded-b-xl mt-0 border border-border">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center text-destructive py-12 text-sm">
            Error al cargar las recogidas. Por favor, intenta de nuevo.
          </div>
        ) : isMobile ? (
          <>
            <PickupsTab
              data={paginatedData}
              toggleState={toggleState}
              onViewDetail={setDetailPickup}
              onEdit={toggleState === 1 ? setEditPickup : undefined}
              onDelete={toggleState === 1 ? setDeletePickup : undefined}
              onMarkPickedUp={toggleState === 1 ? setMarkPickedUp : undefined}
              onAssignDelivery={toggleState === 2 ? setAssignDelivery : undefined}
            />

            {filteredData.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} de {filteredData.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-medium text-foreground px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted border-b border-border text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="p-4 font-semibold">Código</th>
                    <th className="p-4 font-semibold">Empresa / Cliente</th>
                    <th className="p-4 font-semibold">Contacto</th>
                    <th className="p-4 font-semibold">Mensajero</th>
                    <th className="p-4 font-semibold">Estado</th>
                    <th className="p-4 font-semibold">Fecha</th>
                    <th className="p-4 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <PickupsTab
                    data={paginatedData}
                    toggleState={toggleState}
                    onViewDetail={setDetailPickup}
                    onEdit={toggleState === 1 ? setEditPickup : undefined}
                    onDelete={toggleState === 1 ? setDeletePickup : undefined}
                    onMarkPickedUp={toggleState === 1 ? setMarkPickedUp : undefined}
                    onAssignDelivery={toggleState === 2 ? setAssignDelivery : undefined}
                  />
                </tbody>
              </table>
            </div>

            {filteredData.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} de {filteredData.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (page) =>
                        page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
                    )
                    .map((page, idx, arr) => {
                      const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
                      return (
                        <span key={page} className="flex items-center">
                          {showEllipsis && (
                            <span className="px-2 text-muted-foreground">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted text-foreground'
                            }`}
                          >
                            {page}
                          </button>
                        </span>
                      );
                    })}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {typeof window !== 'undefined' && (
        <ModalPickup isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      )}

      <PickupDetailModal
        pickup={detailPickup}
        isOpen={!!detailPickup}
        onClose={() => setDetailPickup(null)}
      />

      <EditPickupModal
        pickup={editPickup}
        isOpen={!!editPickup}
        onClose={() => setEditPickup(null)}
      />

      <DeletePickupModal
        pickup={deletePickup}
        isOpen={!!deletePickup}
        onClose={() => setDeletePickup(null)}
      />

      <MarkPickedUpModal
        pickup={markPickedUp}
        isOpen={!!markPickedUp}
        onClose={() => setMarkPickedUp(null)}
      />

      <AssignToDeliveryModal
        pickup={assignDelivery}
        isOpen={!!assignDelivery}
        onClose={() => setAssignDelivery(null)}
      />
    </div>
  );
};

export default PickUps;
