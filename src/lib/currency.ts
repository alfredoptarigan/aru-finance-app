const idr = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });

export function formatCurrency(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  return `${sign}Rp${idr.format(Math.abs(Math.round(amount)))}`;
}

export function formatDate(
  date: string | Date,
  opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' },
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', opts).format(d);
}

export function formatPercentage(value: number, showSign = false): string {
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${Math.round(value)}%`;
}
