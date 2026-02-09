import { useState, useMemo } from "react";
import { Search, PlusCircle, ChevronLeft, ChevronRight } from "lucide-react";
import ModalDomis from "./ModalDomis";
import DomisTab from "./DomisTab";
import { useDeliveries, Delivery } from "@/hooks/useDeliveries";

interface DeliveryListProps {
  courierId?: string;
  showCourier?: boolean;
}

const ITEMS_PER_PAGE = 6;

const statusMap: Record<number, string[]> = {
  1: ["pending"],
  2: ["completed"],
  3: ["cancelled", "not_delivered_collected", "not_delivered_no_collection"],
};

const Deliveries = ({ courierId, showCourier }: DeliveryListProps) => {
  const [busqueda, setBusqueda] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [toggleState, setToggleState] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: deliveries, isLoading, error } = useDeliveries(courierId);

  // Compute filtered count per tab for badges
  const tabCounts = useMemo(() => {
    if (!deliveries) return { 1: 0, 2: 0, 3: 0 };
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
    deliveries.forEach((d) => {
      for (const [key, statuses] of Object.entries(statusMap)) {
        if (statuses.includes(d.status)) {
          counts[Number(key)]++;
        }
      }
    });
    return counts;
  }, [deliveries]);

  // Filtered data for current tab + search
  const filteredData = useMemo(() => {
    if (!deliveries) return [];
    const allowedStatuses = statusMap[toggleState] || [];
    return deliveries.filter((d) => {
      if (!allowedStatuses.includes(d.status)) return false;
      if (!busqueda) return true;
      const search = busqueda.toLowerCase();
      return (
        d.client?.name?.toLowerCase().includes(search) ||
        d.courier?.full_name?.toLowerCase().includes(search) ||
        d.id.toLowerCase().includes(search) ||
        d.notes?.toLowerCase().includes(search) ||
        d.recipient_name?.toLowerCase().includes(search)
      );
    });
  }, [deliveries, toggleState, busqueda]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset page when changing tabs or search
  const toggleTab = (index: number) => {
    setToggleState(index);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setBusqueda(value);
    setCurrentPage(1);
  };

  // Fetch deliveries with courier info
  const deliveriesWithCourier = useMemo(() => {
    // Data already includes courier via the join in useDeliveries,
    // but we need to ensure the query fetches courier profile
    return paginatedData;
  }, [paginatedData]);

  return (
    <div className="p-6 text-foreground">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        {/* Search */}
        <div className="flex items-center w-full md:w-1/2 bg-background rounded-xl shadow-sm border border-border focus-within:ring-2 focus-within:ring-primary transition-all">
          <Search className="w-6 h-6 ml-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por cliente, mensajero o código..."
            className="w-full py-3 px-4 bg-transparent outline-none text-foreground placeholder-muted-foreground"
            onChange={(e) => handleSearchChange(e.target.value)}
            value={busqueda}
          />
        </div>

        {/* Create button */}
        <button
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl px-5 py-3 shadow-sm transition-all cursor-pointer"
          onClick={() => setModalOpen(true)}
        >
          <PlusCircle className="w-6 h-6" />
          Registrar Nuevo Pedido
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-2 text-sm font-semibold uppercase">
        <button
          className={`flex-1 text-center py-3 rounded-t-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            toggleState === 1
              ? "bg-orange-500 text-white shadow-md"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
          onClick={() => toggleTab(1)}
        >
          Pendientes
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${toggleState === 1 ? "bg-white/20" : "bg-foreground/10"}`}
          >
            {tabCounts[1]}
          </span>
        </button>
        <button
          className={`flex-1 text-center py-3 rounded-t-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            toggleState === 2 ? "bg-green-600 text-white shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
          onClick={() => toggleTab(2)}
        >
          Completados
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${toggleState === 2 ? "bg-white/20" : "bg-foreground/10"}`}
          >
            {tabCounts[2]}
          </span>
        </button>
        <button
          className={`flex-1 text-center py-3 rounded-t-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            toggleState === 3 ? "bg-red-600 text-white shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
          onClick={() => toggleTab(3)}
        >
          Rechazados
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${toggleState === 3 ? "bg-white/20" : "bg-foreground/10"}`}
          >
            {tabCounts[3]}
          </span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-background shadow-md rounded-b-xl mt-0 border border-border">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center text-destructive py-12 text-sm">
            Error al cargar los domicilios. Por favor, intenta de nuevo.
          </div>
        ) : (
          <>
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted border-b border-border text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="p-4 font-semibold">Código</th>
                  <th className="p-4 font-semibold">Cliente</th>
                  <th className="p-4 font-semibold">Mensajero</th>
                  <th className="p-4 font-semibold">Valor</th>
                  <th className="p-4 font-semibold">Estado</th>
                  <th className="p-4 font-semibold">Fecha</th>
                </tr>
              </thead>
              <tbody>
                <DomisTab data={deliveriesWithCourier} toggleState={toggleState} busqueda="" />
              </tbody>
            </table>

            {/* Pagination */}
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
                    .filter((page) => {
                      // Show first, last, current, and neighbors
                      return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                    })
                    .map((page, idx, arr) => {
                      const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
                      return (
                        <span key={page} className="flex items-center">
                          {showEllipsis && <span className="px-2 text-muted-foreground">...</span>}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === page
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted text-foreground"
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

      {/* Modal */}
      {typeof window !== "undefined" && <ModalDomis isOpen={modalOpen} onClose={() => setModalOpen(false)} />}
    </div>
  );
};

export default Deliveries;
