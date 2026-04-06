import { useRef } from 'react';
import { useClientStatement } from '@/hooks/useClientStatement';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileDown, Loader2, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ClientReportPDFProps {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startDate?: string;
  endDate?: string;
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  completed: 'Entregado',
  not_delivered_collected: 'Ida Perdida',
  not_delivered_no_collection: 'No Entregado',
  cancelled: 'Cancelado',
};

const paymentLabels: Record<string, string> = {
  cash: 'Efectivo',
  transfer_to_courier: 'Trans. JS',
  transfer_to_client: 'Trans. Directa',
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
  not_delivered_collected: 'bg-orange-100 text-orange-800 border-orange-300',
  not_delivered_no_collection: 'bg-red-100 text-red-800 border-red-300',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-300',
};

const PAYMENT_BADGE: Record<string, string> = {
  cash: 'bg-blue-100 text-blue-800 border-blue-300',
  transfer_to_courier: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  transfer_to_client: 'bg-teal-100 text-teal-800 border-teal-300',
};

const STATUS_PRINT: Record<string, { bg: string; text: string; border: string }> = {
  pending: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
  completed: { bg: '#dcfce7', text: '#166534', border: '#22c55e' },
  not_delivered_collected: { bg: '#ffedd5', text: '#c2410c', border: '#f97316' },
  not_delivered_no_collection: { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
  cancelled: { bg: '#f1f5f9', text: '#475569', border: '#94a3b8' },
};

const PAYMENT_PRINT: Record<string, { bg: string; text: string; border: string }> = {
  cash: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  transfer_to_courier: { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' },
  transfer_to_client: { bg: '#ccfbf1', text: '#0f766e', border: '#5eead4' },
};

const BRAND = '#1a3a5c';

export function ClientReportPDF({ clientId, open, onOpenChange, startDate, endDate }: ClientReportPDFProps) {
  const { data: statement, isLoading } = useClientStatement(clientId, startDate, endDate);
  const printRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const generatedAt = format(new Date(), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
  const fmtDate = (d: string) => format(new Date(d), 'dd/MM/yyyy');
  const periodLabel =
    startDate && endDate ? `${fmtDate(startDate)} — ${fmtDate(endDate)}` : 'Período completo';

  const net =
    (statement?.totalCollected ?? 0) -
    (statement?.totalServices ?? 0) -
    (statement?.totalLostTrips ?? 0) -
    (statement?.totalLoans ?? 0);
  const isDebt = net < 0;
  const balanceLabel = isDebt ? 'Saldo en Contra' : 'Saldo a Favor';
  const balanceAmount = Math.abs(net);

  const handlePrint = () => {
    if (!statement) return;
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert('Por favor permite las ventanas emergentes para imprimir');
      return;
    }

    const badge = (bg: string, text: string, border: string, label: string) =>
      `<span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:10px;font-weight:600;border:1px solid ${border};background:${bg};color:${text};">${label}</span>`;

    const rows = statement.deliveries
      .map((d) => {
        const sp = STATUS_PRINT[d.status] ?? STATUS_PRINT.cancelled;
        const pp = PAYMENT_PRINT[d.payment_method] ?? PAYMENT_PRINT.cash;
        return `
        <tr>
          <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;vertical-align:middle;">
            <div style="font-size:11px;color:#334155;">${fmtDate(d.delivery_date)}</div>
            <div style="font-size:9px;font-family:monospace;color:#94a3b8;">#${d.id.slice(0, 8).toUpperCase()}</div>
          </td>
          <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;vertical-align:middle;">
            <div style="font-size:11px;color:#334155;">${d.recipient_name || '—'}</div>
            ${d.lost_trips > 0 ? `<div style="margin-top:2px;">${badge('#fee2e2', '#991b1b', '#fca5a5', `Dev: ${d.lost_trips}`)}</div>` : ''}
          </td>
          <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;vertical-align:middle;text-align:center;">
            ${badge(sp.bg, sp.text, sp.border, statusLabels[d.status] ?? d.status)}
          </td>
          <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;vertical-align:middle;text-align:center;">
            ${badge(pp.bg, pp.text, pp.border, paymentLabels[d.payment_method] ?? d.payment_method)}
          </td>
          <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;vertical-align:middle;text-align:right;font-size:11px;color:#334155;">${formatCurrency(d.service_value)}</td>
          <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;vertical-align:middle;text-align:right;font-size:11px;color:#334155;">${formatCurrency(d.loan)}</td>
          <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;vertical-align:middle;text-align:right;font-size:11px;font-weight:600;color:${d.received_amount !== null ? '#15803d' : '#94a3b8'};">
            ${d.received_amount !== null ? formatCurrency(d.received_amount) : '—'}
          </td>
        </tr>`;
      })
      .join('');

    const netColor = isDebt ? '#991b1b' : '#166534';
    const netBg = isDebt ? '#fee2e2' : '#dcfce7';

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Estado de Cuenta — ${statement.name}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:#fff;color:#1e293b;font-size:12px;}
    .doc-header{background:linear-gradient(135deg,${BRAND} 0%,#2563eb 100%);color:#fff;padding:22px 32px;display:flex;justify-content:space-between;align-items:flex-start;}
    .brand{font-size:22px;font-weight:900;letter-spacing:1.5px;}
    .brand-sub{font-size:9px;opacity:.75;letter-spacing:3px;text-transform:uppercase;margin-top:3px;}
    .doc-label{text-align:right;}
    .doc-label h2{font-size:17px;font-weight:800;letter-spacing:1px;}
    .doc-label p{font-size:10px;opacity:.8;margin-top:3px;}
    .client-bar{background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:14px 32px;display:flex;justify-content:space-between;align-items:center;}
    .client-name{font-size:17px;font-weight:800;color:#0f172a;}
    .client-meta{font-size:11px;color:#64748b;margin-top:3px;}
    .count-info{font-size:11px;color:#64748b;text-align:right;}
    .content{padding:20px 32px;}
    .cards{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:18px;}
    .card{border-radius:8px;padding:12px;text-align:center;border:1px solid;}
    .card .lbl{display:block;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;}
    .card .val{display:block;font-size:13px;font-weight:900;}
    .card-green{background:#f0fdf4;border-color:#86efac;}.card-green .lbl{color:#166534;}.card-green .val{color:#15803d;}
    .card-blue{background:#eff6ff;border-color:#93c5fd;}.card-blue .lbl{color:#1e40af;}.card-blue .val{color:#1d4ed8;}
    .card-amber{background:#fffbeb;border-color:#fcd34d;}.card-amber .lbl{color:#92400e;}.card-amber .val{color:#b45309;}
    .card-purple{background:#f5f3ff;border-color:#c4b5fd;}.card-purple .lbl{color:#5b21b6;}.card-purple .val{color:#6d28d9;}
    .card-debt{background:#fef2f2;border:2px solid #fca5a5;}.card-debt .lbl{color:#991b1b;}.card-debt .val{color:#dc2626;}
    .card-credit{background:#f0fdf4;border:2px solid #4ade80;}.card-credit .lbl{color:#166534;}.card-credit .val{color:#15803d;}
    .balance-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:18px;}
    .balance-title{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#475569;margin-bottom:12px;}
    .brow{display:flex;justify-content:space-between;padding:5px 0;font-size:11px;border-bottom:1px dashed #e2e8f0;}
    .brow:last-child{border-bottom:none;}
    .brow.total{margin-top:6px;padding-top:10px;border-top:2px solid #334155;font-weight:800;font-size:13px;}
    .sign-p{color:#16a34a;font-weight:900;margin-right:8px;}
    .sign-m{color:#dc2626;font-weight:900;margin-right:8px;}
    .section-title{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:#1e293b;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid ${BRAND};}
    table{width:100%;border-collapse:collapse;}
    thead tr{background:${BRAND};}
    thead th{color:#fff;padding:9px 10px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;}
    tbody tr:nth-child(even){background:#f8fafc;}
    .doc-footer{margin-top:24px;padding:14px 32px;background:#f8fafc;border-top:2px solid ${BRAND};display:flex;justify-content:space-between;align-items:center;}
    .footer-brand{font-size:12px;font-weight:800;color:${BRAND};}
    .footer-note{font-size:9px;color:#64748b;margin-top:2px;}
    .footer-right{font-size:9px;color:#94a3b8;text-align:right;}
    @media print{
      body{print-color-adjust:exact;-webkit-print-color-adjust:exact;}
      @page{margin:0.5cm;size:A4;}
    }
  </style>
</head>
<body>
  <div class="doc-header">
    <div>
      <div class="brand">JS LOGISTICS</div>
      <div class="brand-sub">Empresa de logistica y envios</div>
    </div>
    <div class="doc-label">
      <h2>ESTADO DE CUENTA</h2>
      <p>Período: ${periodLabel}</p>
      <p>Generado: ${generatedAt}</p>
    </div>
  </div>

  <div class="client-bar">
    <div>
      <div class="client-name">${statement.name}</div>
      <div class="client-meta">${[statement.phone ? `Tel: ${statement.phone}` : '', statement.address ?? ''].filter(Boolean).join('  ·  ')}</div>
    </div>
    <div class="count-info"><strong>${statement.deliveries.length}</strong> pedidos en el período</div>
  </div>

  <div class="content">
    <div class="cards">
      <div class="card card-green"><span class="lbl">Total Recaudado</span><span class="val">${formatCurrency(statement.totalCollected)}</span></div>
      <div class="card card-blue"><span class="lbl">Total Servicios</span><span class="val">${formatCurrency(statement.totalServices)}</span></div>
      <div class="card card-amber"><span class="lbl">Idas Perdidas</span><span class="val">${formatCurrency(statement.totalLostTrips)}</span></div>
      <div class="card card-purple"><span class="lbl">Préstamos JS</span><span class="val">${formatCurrency(statement.totalLoans)}</span></div>
      <div class="card ${isDebt ? 'card-debt' : 'card-credit'}"><span class="lbl">${balanceLabel}</span><span class="val">${formatCurrency(balanceAmount)}</span></div>
    </div>

    <div class="balance-box">
      <div class="balance-title">Resumen del Balance</div>
      <div class="brow">
        <span><span class="sign-p">+</span>Total Recaudado por JS Logística</span>
        <span style="color:#15803d;font-weight:600;">${formatCurrency(statement.totalCollected)}</span>
      </div>
      <div class="brow">
        <span><span class="sign-m">−</span>Servicios de Mensajería</span>
        <span style="color:#dc2626;">(${formatCurrency(statement.totalServices)})</span>
      </div>
      <div class="brow">
        <span><span class="sign-m">−</span>Idas Perdidas (Devoluciones)</span>
        <span style="color:#dc2626;">(${formatCurrency(statement.totalLostTrips)})</span>
      </div>
      <div class="brow">
        <span><span class="sign-m">−</span>Préstamos JS</span>
        <span style="color:#dc2626;">(${formatCurrency(statement.totalLoans)})</span>
      </div>
      <div class="brow total">
        <span>${balanceLabel}</span>
        <span style="color:${netColor};background:${netBg};padding:2px 12px;border-radius:4px;">${isDebt ? '−' : '+'}${formatCurrency(balanceAmount)}</span>
      </div>
    </div>

    <div class="section-title">Detalle de Pedidos (${statement.deliveries.length})</div>
    <table>
      <thead>
        <tr>
          <th style="text-align:left;">Fecha / Código</th>
          <th style="text-align:left;">Destinatario</th>
          <th style="text-align:center;">Estado</th>
          <th style="text-align:center;">Pago</th>
          <th style="text-align:right;">Servicio</th>
          <th style="text-align:right;">Prestamos</th>
          <th style="text-align:right;">Recibido</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <div class="doc-footer">
    <div>
      <div class="footer-brand">JS Logistics</div>
      <div class="footer-note">Este documento es un resumen informativo. Para aclaraciones contacte a administración.</div>
    </div>
    <div class="footer-right">${generatedAt}</div>
  </div>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => setTimeout(() => printWindow.print(), 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-primary" />
            Reporte Imprimible
          </DialogTitle>
          <DialogDescription>
            Vista previa del estado de cuenta para imprimir o guardar como PDF
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : statement ? (
          <>
            <div className="flex justify-end mb-2">
              <Button onClick={handlePrint}>
                <FileDown className="w-4 h-4 mr-2" />
                Imprimir / Guardar PDF
              </Button>
            </div>

            {/* ── Document Preview ── */}
            <div ref={printRef} className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-200">

              {/* Header */}
              <div
                className="flex flex-col gap-3 sm:flex-row sm:gap-0 sm:justify-between sm:items-start px-4 sm:px-8 py-5 text-white"
                style={{ background: `linear-gradient(135deg, ${BRAND} 0%, #2563eb 100%)` }}
              >
                <div>
                  <div className="text-xl sm:text-2xl font-black tracking-wide">JS LOGÍSTICA</div>
                  <div className="text-[10px] opacity-75 tracking-[3px] uppercase mt-1">
                    Sistema de Gestión de Entregas
                  </div>
                </div>
                <div className="sm:text-right">
                  <div className="text-base sm:text-lg font-bold tracking-wider">ESTADO DE CUENTA</div>
                  <div className="text-xs opacity-80 mt-1">Período: {periodLabel}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">Generado: {generatedAt}</div>
                </div>
              </div>

              {/* Client bar */}
              <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-8 py-4 flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center">
                <div>
                  <div className="text-base sm:text-lg font-bold text-slate-900">{statement.name}</div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                    {statement.phone && <span className="text-sm text-slate-500">Tel: {statement.phone}</span>}
                    {statement.address && <span className="text-sm text-slate-500">{statement.address}</span>}
                  </div>
                </div>
                <div className="text-sm text-slate-500 sm:text-right">
                  <span className="font-bold text-slate-700">{statement.deliveries.length}</span> pedidos
                </div>
              </div>

              <div className="px-4 sm:px-8 py-5">

                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <div className="text-[9px] font-bold text-green-700 uppercase tracking-wide mb-1">Total Recaudado</div>
                    <div className="text-sm font-black text-green-700">{formatCurrency(statement.totalCollected)}</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <div className="text-[9px] font-bold text-blue-700 uppercase tracking-wide mb-1">Total Servicios</div>
                    <div className="text-sm font-black text-blue-700">{formatCurrency(statement.totalServices)}</div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                    <div className="text-[9px] font-bold text-amber-700 uppercase tracking-wide mb-1">Idas Perdidas</div>
                    <div className="text-sm font-black text-amber-700">{formatCurrency(statement.totalLostTrips)}</div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                    <div className="text-[9px] font-bold text-purple-700 uppercase tracking-wide mb-1">Préstamos JS</div>
                    <div className="text-sm font-black text-purple-700">{formatCurrency(statement.totalLoans)}</div>
                  </div>
                  <div
                    className={`col-span-2 sm:col-span-1 rounded-lg p-3 text-center border-2 ${
                      isDebt
                        ? 'bg-red-50 border-red-400'
                        : 'bg-green-50 border-green-400'
                    }`}
                  >
                    <div className={`text-[9px] font-bold uppercase tracking-wide mb-1 ${isDebt ? 'text-red-700' : 'text-green-700'}`}>
                      {balanceLabel}
                    </div>
                    <div className={`text-sm font-black ${isDebt ? 'text-red-700' : 'text-green-700'}`}>
                      {formatCurrency(balanceAmount)}
                    </div>
                  </div>
                </div>

                {/* Balance breakdown */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-[2px] mb-3">
                    Resumen del Balance
                  </div>
                  <div className="space-y-0">
                    {[
                      { sign: '+', color: 'text-green-600', label: 'Total Recaudado', labelFull: 'Total Recaudado por JS Logística', valueColor: 'text-green-700 font-semibold', display: formatCurrency(statement.totalCollected) },
                      { sign: '−', color: 'text-red-500', label: 'Servicios', labelFull: 'Servicios de Mensajería', valueColor: 'text-red-600', display: `(${formatCurrency(statement.totalServices)})` },
                      { sign: '−', color: 'text-red-500', label: 'Idas Perdidas', labelFull: 'Idas Perdidas (Devoluciones)', valueColor: 'text-red-600', display: `(${formatCurrency(statement.totalLostTrips)})` },
                      { sign: '−', color: 'text-red-500', label: 'Préstamos JS', labelFull: 'Préstamos JS', valueColor: 'text-red-600', display: `(${formatCurrency(statement.totalLoans)})` },
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between items-center gap-2 text-sm py-2 border-b border-dashed border-slate-200">
                        <span className="text-slate-600 min-w-0">
                          <span className={`font-black mr-2 ${row.color}`}>{row.sign}</span>
                          <span className="sm:hidden">{row.label}</span>
                          <span className="hidden sm:inline">{row.labelFull}</span>
                        </span>
                        <span className={`shrink-0 ${row.valueColor}`}>{row.display}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center gap-2 py-3 border-t-2 border-slate-400 font-bold text-sm mt-1">
                      <span className="text-slate-800">{balanceLabel}</span>
                      <span
                        className={`shrink-0 px-3 py-1 rounded text-sm font-black ${
                          isDebt ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {isDebt ? '−' : '+'}{formatCurrency(balanceAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deliveries table */}
                <div>
                  <div
                    className="text-[10px] font-black text-slate-700 uppercase tracking-[1.5px] mb-3 pb-2 border-b-2"
                    style={{ borderColor: BRAND }}
                  >
                    Detalle de Pedidos ({statement.deliveries.length})
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr style={{ background: BRAND }}>
                          {['Fecha / Código', 'Destinatario', 'Estado', 'Pago', 'Servicios', 'Prestamos', 'Recibido'].map((h, i) => (
                            <th
                              key={h}
                              className="px-3 py-2.5 font-semibold uppercase tracking-wide text-white whitespace-nowrap"
                              style={{ fontSize: 9, textAlign: i >= 4 ? 'right' : i >= 2 ? 'center' : 'left' }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {statement.deliveries.map((delivery, idx) => (
                          <tr key={delivery.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="px-3 py-2 border-b border-slate-100">
                              <div className="text-slate-700">{fmtDate(delivery.delivery_date)}</div>
                              <div className="font-mono text-[9px] text-slate-400 mt-0.5">
                                #{delivery.id.slice(0, 8).toUpperCase()}
                              </div>
                            </td>
                            <td className="px-3 py-2 border-b border-slate-100">
                              <div className="text-slate-800">{delivery.recipient_name || '—'}</div>
                              {delivery.lost_trips > 0 && (
                                <span className="inline-flex mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-red-100 text-red-700 border border-red-200">
                                  Dev: {delivery.lost_trips}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 border-b border-slate-100 text-center">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  STATUS_BADGE[delivery.status] ?? STATUS_BADGE.cancelled
                                }`}
                              >
                                {statusLabels[delivery.status] ?? delivery.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 border-b border-slate-100 text-center">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  PAYMENT_BADGE[delivery.payment_method] ?? PAYMENT_BADGE.cash
                                }`}
                              >
                                {paymentLabels[delivery.payment_method] ?? delivery.payment_method}
                              </span>
                            </td>
                            <td className="px-3 py-2 border-b border-slate-100 text-right text-slate-700">
                              {formatCurrency(delivery.service_value)}
                            </td>
                            <td className="px-3 py-2 border-b border-slate-100 text-right text-slate-700">
                              {formatCurrency(delivery.loan)}
                            </td>
                            <td className="px-3 py-2 border-b border-slate-100 text-right">
                              {delivery.received_amount !== null ? (
                                <span className="font-semibold text-green-700">
                                  {formatCurrency(delivery.received_amount)}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div
                className="px-4 sm:px-8 py-4 bg-slate-50 border-t-2 flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center"
                style={{ borderColor: BRAND }}
              >
                <div>
                  <div className="text-xs font-black" style={{ color: BRAND }}>JS Logística</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Este documento es un resumen informativo. Para aclaraciones contacte a administración.
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 sm:text-right">{generatedAt}</div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No se pudo cargar la información del cliente
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
