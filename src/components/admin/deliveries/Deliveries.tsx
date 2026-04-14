import { useState, useMemo } from 'react';
import { Search, PlusCircle, ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import ModalDomis from './ModalDomis';
import DomisTab from './DomisTab';
import DeliveryDetailModal from './DeliveryDetailModal';
import DeleteDeliveryModal from './DeleteDeliveryModal';
import ReassignDeliveryModal from './ReassignDeliveryModal';
import { RegisterDeliveryDialog } from '@/components/courier/RegisterDeliveryDialog';
import { useDeliveriesTest, Delivery } from '@/hooks/useDeliveries';
import { useAdminCompleteDelivery } from '@/hooks/useAdminCompleteDelivery';
import { useAdminCorrectDelivery } from '@/hooks/useAdminCorrectDelivery';
import { useIsMobile } from '@/hooks/use-mobile';

// The backend returns company on the client object; extend the type locally
type DeliveryWithCompany = Delivery & {
  client?: Delivery['client'] & { company?: string | null };
};

interface DeliveryListProps {
  courierId?: string;
  showCourier?: boolean;
}

const ITEMS_PER_PAGE = 5;

const statusMap: Record<number, string[]> = {
  1: ['pending'],
  2: ['completed'],
  3: ['cancelled', 'not_delivered_collected', 'not_delivered_no_collection'],
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  transfer_to_courier: 'Transferencia al mensajero',
  transfer_to_client: 'Transferencia al cliente',
};

function fmtWeek(weekStart: string, weekEnd: string) {
  try {
    const s = format(parseISO(weekStart), 'd MMM', { locale: es });
    const e = format(parseISO(weekEnd), 'd MMM yyyy', { locale: es });
    return `${s} – ${e}`;
  } catch {
    return `${weekStart} – ${weekEnd}`;
  }
}

const Deliveries = ({ courierId }: DeliveryListProps) => {
  const [busqueda, setBusqueda] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [toggleState, setToggleState] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const isMobile = useIsMobile();

  // Filter state
  const [filterDate, setFilterDate] = useState('');
  const [filterCourier, setFilterCourier] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [filterWeek, setFilterWeek] = useState('');

  // Action modals
  const [detailDelivery, setDetailDelivery] = useState<Delivery | null>(null);
  const [editDelivery, setEditDelivery] = useState<Delivery | null>(null);
  const [deleteDelivery, setDeleteDelivery] = useState<Delivery | null>(null);
  const [reassignDelivery, setReassignDelivery] = useState<Delivery | null>(null);
  const [completeDelivery, setCompleteDelivery] = useState<Delivery | null>(null);
  const [correctDelivery, setCorrectDelivery] = useState<Delivery | null>(null);

  const { data: rawDeliveries, isLoading, error } = useDeliveriesTest(courierId);
  const deliveries = rawDeliveries as DeliveryWithCompany[] | undefined;
  const adminComplete = useAdminCompleteDelivery();
  const adminCorrect = useAdminCorrectDelivery();

  const activeFilterCount = [filterDate, filterCourier, filterCompany, filterPaymentMethod, filterWeek]
    .filter(Boolean).length;

  const clearFilters = () => {
    setFilterDate('');
    setFilterCourier('');
    setFilterCompany('');
    setFilterPaymentMethod('');
    setFilterWeek('');
    setCurrentPage(1);
  };

  const handleFilterChange = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setCurrentPage(1);
  };

  // ── Derived filter options from loaded data ──────────────────────────────
  const courierOptions = useMemo(() => {
    if (!deliveries) return [];
    const seen = new Map<string, string>();
    deliveries.forEach((d) => {
      if (!seen.has(d.courier_id)) {
        seen.set(d.courier_id, d.courier?.full_name || d.courier_id);
      }
    });
    return Array.from(seen.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [deliveries]);

  const companyOptions = useMemo(() => {
    if (!deliveries) return [];
    const seen = new Set<string>();
    const opts: string[] = [];
    deliveries.forEach((d) => {
      const company = d.client?.company;
      if (company && !seen.has(company)) {
        seen.add(company);
        opts.push(company);
      }
    });
    return opts.sort((a, b) => a.localeCompare(b));
  }, [deliveries]);

  const weekOptions = useMemo(() => {
    if (!deliveries) return [];
    const seen = new Map<string, string>();
    deliveries.forEach((d) => {
      if (!seen.has(d.week_start)) {
        seen.set(d.week_start, d.week_end);
      }
    });
    return Array.from(seen.entries())
      .map(([start, end]) => ({ start, end, label: fmtWeek(start, end) }))
      .sort((a, b) => b.start.localeCompare(a.start));
  }, [deliveries]);

  // ── Tab counts (before week/date/courier filters so badges reflect total per status) ──
  const tabCounts = useMemo(() => {
    if (!deliveries) return { 1: 0, 2: 0, 3: 0 };
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
    deliveries.forEach((d) => {
      for (const [key, statuses] of Object.entries(statusMap)) {
        if (statuses.includes(d.status)) counts[Number(key)]++;
      }
    });
    return counts;
  }, [deliveries]);

  // ── Main filtered dataset ────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    if (!deliveries) return [];
    const allowedStatuses = statusMap[toggleState] || [];
    return deliveries.filter((d) => {
      if (!allowedStatuses.includes(d.status)) return false;
      if (busqueda) {
        const q = busqueda.toLowerCase();
        const match =
          d.client?.name?.toLowerCase().includes(q) ||
          d.client?.company?.toLowerCase().includes(q) ||
          d.courier?.full_name?.toLowerCase().includes(q) ||
          d.id.toLowerCase().includes(q) ||
          d.notes?.toLowerCase().includes(q) ||
          d.recipient_name?.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterDate && d.delivery_date !== filterDate) return false;
      if (filterCourier && d.courier_id !== filterCourier) return false;
      if (filterCompany && d.client?.company !== filterCompany) return false;
      if (filterPaymentMethod && d.payment_method !== filterPaymentMethod) return false;
      if (filterWeek && d.week_start !== filterWeek) return false;
      return true;
    });
  }, [deliveries, toggleState, busqueda, filterDate, filterCourier, filterCompany, filterPaymentMethod, filterWeek]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const toggleTab = (index: number) => {
    setToggleState(index);
    setCurrentPage(1);
  };

  const handleAdminComplete = async (data: {
    final_status: 'completed' | 'not_delivered_collected' | 'not_delivered_no_collection';
    received_amount: number;
    payment_method: 'cash' | 'transfer_to_courier' | 'transfer_to_client';
    subAccount: string;
    notes?: string;
    receipt_photo_url?: string;
  }) => {
    if (!completeDelivery) return;
    await adminComplete.mutateAsync({
      deliveryId: completeDelivery.id,
      courierId: completeDelivery.courier_id,
      ...data,
    });
    setCompleteDelivery(null);
  };

  const handleAdminCorrect = async (data: {
    final_status: 'completed' | 'not_delivered_collected' | 'not_delivered_no_collection';
    received_amount: number;
    payment_method: 'cash' | 'transfer_to_courier' | 'transfer_to_client';
    subAccount: string;
    notes?: string;
    receipt_photo_url?: string;
  }) => {
    if (!correctDelivery) return;
    await adminCorrect.mutateAsync({
      deliveryId: correctDelivery.id,
      courierId: correctDelivery.courier_id,
      ...data,
    });
    setCorrectDelivery(null);
  };

  return (
    <div className="p-4 md:p-6 text-foreground">
      {/* ── Top bar: search + filter toggle + new button ── */}
      <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center md:gap-3">
        {/* Search */}
        <div className="flex items-center flex-1 bg-background rounded-xl shadow-sm border border-border focus-within:ring-2 focus-within:ring-primary transition-all">
          <Search className="w-5 h-5 ml-3 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Buscar por cliente, empresa, mensajero o código..."
            className="w-full py-2.5 px-3 bg-transparent outline-none text-sm text-foreground placeholder-muted-foreground"
            onChange={(e) => { setBusqueda(e.target.value); setCurrentPage(1); }}
            value={busqueda}
          />
          {busqueda && (
            <button onClick={() => { setBusqueda(''); setCurrentPage(1); }} className="mr-2 p-1 rounded-md hover:bg-muted text-muted-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`relative flex items-center gap-2 font-medium rounded-xl px-4 py-2.5 border transition-all text-sm cursor-pointer ${
              showFilters || activeFilterCount > 0
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-background border-border text-foreground hover:bg-muted'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {!isMobile && 'Filtros'}
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* New delivery */}
          <button
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl px-4 py-2.5 shadow-sm transition-all cursor-pointer text-sm"
            onClick={() => setModalOpen(true)}
          >
            <PlusCircle className="w-5 h-5" />
            {isMobile ? 'Nuevo' : 'Nuevo Pedido'}
          </button>
        </div>
      </div>

      {/* ── Filter panel ── */}
      {showFilters && (
        <div className="mt-3 p-4 bg-background border border-border rounded-xl shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Date */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fecha</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => handleFilterChange(setFilterDate)(e.target.value)}
                className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            {/* Courier */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mensajero</label>
              <select
                value={filterCourier}
                onChange={(e) => handleFilterChange(setFilterCourier)(e.target.value)}
                className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary transition-all cursor-pointer"
              >
                <option value="">Todos</option>
                {courierOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Company */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Empresa</label>
              <select
                value={filterCompany}
                onChange={(e) => handleFilterChange(setFilterCompany)(e.target.value)}
                className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary transition-all cursor-pointer"
              >
                <option value="">Todas</option>
                {companyOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Payment method */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pago</label>
              <select
                value={filterPaymentMethod}
                onChange={(e) => handleFilterChange(setFilterPaymentMethod)(e.target.value)}
                className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary transition-all cursor-pointer"
              >
                <option value="">Todos</option>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            {/* Week */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Semana</label>
              <select
                value={filterWeek}
                onChange={(e) => handleFilterChange(setFilterWeek)(e.target.value)}
                className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary transition-all cursor-pointer"
              >
                <option value="">Todas</option>
                {weekOptions.map((w) => (
                  <option key={w.start} value={w.start}>{w.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear + result count */}
          {activeFilterCount > 0 && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {filteredData.length} resultado{filteredData.length !== 1 ? 's' : ''} encontrado{filteredData.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-xs font-medium text-destructive hover:text-destructive/80 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Active filter chips (visible even when panel is closed) ── */}
      {!showFilters && activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {filterDate && (
            <FilterChip
              label={`Fecha: ${filterDate}`}
              onRemove={() => handleFilterChange(setFilterDate)('')}
            />
          )}
          {filterCourier && (
            <FilterChip
              label={`Mensajero: ${courierOptions.find((c) => c.id === filterCourier)?.name ?? filterCourier}`}
              onRemove={() => handleFilterChange(setFilterCourier)('')}
            />
          )}
          {filterCompany && (
            <FilterChip
              label={`Empresa: ${filterCompany}`}
              onRemove={() => handleFilterChange(setFilterCompany)('')}
            />
          )}
          {filterPaymentMethod && (
            <FilterChip
              label={`Pago: ${PAYMENT_METHOD_LABELS[filterPaymentMethod]}`}
              onRemove={() => handleFilterChange(setFilterPaymentMethod)('')}
            />
          )}
          {filterWeek && (
            <FilterChip
              label={`Semana: ${weekOptions.find((w) => w.start === filterWeek)?.label ?? filterWeek}`}
              onRemove={() => handleFilterChange(setFilterWeek)('')}
            />
          )}
        </div>
      )}

      {/* ── Status tabs ── */}
      <div className="mt-4 md:mt-6 flex gap-1 md:gap-2 text-xs md:text-sm font-semibold uppercase">
        {([
          { idx: 1, label: 'Pendientes', short: 'Pend.', active: 'bg-orange-500 text-white shadow-md' },
          { idx: 2, label: 'Completados', short: 'Compl.', active: 'bg-green-600 text-white shadow-md' },
          { idx: 3, label: 'Rechazados', short: 'Rech.', active: 'bg-red-600 text-white shadow-md' },
        ] as const).map(({ idx, label, short, active }) => (
          <button
            key={idx}
            className={`flex-1 text-center py-2.5 md:py-3 rounded-t-xl transition-all cursor-pointer flex items-center justify-center gap-1 md:gap-2 ${
              toggleState === idx ? active : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
            onClick={() => toggleTab(idx)}
          >
            {isMobile ? short : label}
            <span className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full ${toggleState === idx ? 'bg-white/20' : 'bg-foreground/10'}`}>
              {tabCounts[idx]}
            </span>
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="bg-background shadow-md rounded-b-xl mt-0 border border-border">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
            </div>
          </div>
        ) : error ? (
          <div className="text-center text-destructive py-12 text-sm">
            Error al cargar los domicilios. Por favor, intenta de nuevo.
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 text-sm">
            {activeFilterCount > 0 || busqueda
              ? 'No hay pedidos que coincidan con los filtros aplicados.'
              : 'No hay pedidos en esta categoría.'}
          </div>
        ) : isMobile ? (
          <>
            <DomisTab
              data={paginatedData}
              toggleState={toggleState}
              busqueda=""
              onViewDetail={setDetailDelivery}
              onEdit={toggleState === 1 ? setEditDelivery : undefined}
              onDelete={toggleState === 1 ? setDeleteDelivery : undefined}
              onReassign={toggleState === 3 ? setReassignDelivery : undefined}
              onComplete={toggleState === 1 ? setCompleteDelivery : undefined}
              onCorrect={toggleState === 2 ? setCorrectDelivery : undefined}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              total={filteredData.length}
              perPage={ITEMS_PER_PAGE}
              onPage={setCurrentPage}
              mobile
            />
          </>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted border-b border-border text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="p-4 font-semibold">Código</th>
                    <th className="p-4 font-semibold">Cliente</th>
                    <th className="p-4 font-semibold">Mensajero</th>
                    <th className="p-4 font-semibold">Valor</th>
                    <th className="p-4 font-semibold">Estado</th>
                    <th className="p-4 font-semibold">Fecha</th>
                    <th className="p-4 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <DomisTab
                    data={paginatedData}
                    toggleState={toggleState}
                    busqueda=""
                    onViewDetail={setDetailDelivery}
                    onEdit={toggleState === 1 ? setEditDelivery : undefined}
                    onDelete={toggleState === 1 ? setDeleteDelivery : undefined}
                    onReassign={toggleState === 3 ? setReassignDelivery : undefined}
                    onComplete={toggleState === 1 ? setCompleteDelivery : undefined}
                    onCorrect={toggleState === 2 ? setCorrectDelivery : undefined}
                  />
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              total={filteredData.length}
              perPage={ITEMS_PER_PAGE}
              onPage={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* ── Modals ── */}
      {typeof window !== 'undefined' && (
        <ModalDomis
          isOpen={modalOpen || !!editDelivery}
          onClose={() => { setModalOpen(false); setEditDelivery(null); }}
          delivery={editDelivery}
        />
      )}
      <DeliveryDetailModal
        delivery={detailDelivery}
        isOpen={!!detailDelivery}
        onClose={() => setDetailDelivery(null)}
        showProof={toggleState === 2}
      />
      <DeleteDeliveryModal delivery={deleteDelivery} isOpen={!!deleteDelivery} onClose={() => setDeleteDelivery(null)} />
      <ReassignDeliveryModal delivery={reassignDelivery} isOpen={!!reassignDelivery} onClose={() => setReassignDelivery(null)} />
      <RegisterDeliveryDialog
        delivery={completeDelivery}
        open={!!completeDelivery}
        onOpenChange={(open) => { if (!open) setCompleteDelivery(null); }}
        onRegister={handleAdminComplete}
        loading={adminComplete.isPending}
      />
      <RegisterDeliveryDialog
        delivery={correctDelivery}
        open={!!correctDelivery}
        onOpenChange={(open) => { if (!open) setCorrectDelivery(null); }}
        onRegister={handleAdminCorrect}
        loading={adminCorrect.isPending}
        correctionMode
      />
    </div>
  );
};

// ── Small helpers ────────────────────────────────────────────────────────────

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-medium px-3 py-1">
      {label}
      <button onClick={onRemove} className="hover:text-primary/70 cursor-pointer">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

function Pagination({
  currentPage,
  totalPages,
  total,
  perPage,
  onPage,
  mobile = false,
}: {
  currentPage: number;
  totalPages: number;
  total: number;
  perPage: number;
  onPage: (p: number) => void;
  mobile?: boolean;
}) {
  if (total <= perPage) return null;
  const from = (currentPage - 1) * perPage + 1;
  const to = Math.min(currentPage * perPage, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <p className={`${mobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
        {from}–{to} de {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {mobile ? (
          <span className="text-xs font-medium text-foreground px-2">
            {currentPage} / {totalPages}
          </span>
        ) : (
          Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .map((p, idx, arr) => {
              const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
              return (
                <span key={p} className="flex items-center">
                  {showEllipsis && <span className="px-2 text-muted-foreground text-sm">…</span>}
                  <button
                    onClick={() => onPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === p ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    {p}
                  </button>
                </span>
              );
            })
        )}

        <button
          onClick={() => onPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default Deliveries;
