// Get today's date in YYYY-MM-DD format
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

export const SUB_ACCOUNTS = [
  { id: 'cash',    label: 'Efectivo',    colorClass: 'bg-green-100 text-green-700'   },
  { id: 'bancolombia', label: 'Bancolombia', colorClass: 'bg-orange-100 text-orange-700' },
  { id: 'nequi',       label: 'Nequi',       colorClass: 'bg-purple-100 text-purple-700' },
]

export const ACCOUNT_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  bancolombia: 'Bancolombia',
  nequi: 'Nequi',
};

