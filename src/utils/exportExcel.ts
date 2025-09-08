import { Transaction } from '@/services/database';
import { formatCurrency } from './formatCurrency';

export function exportTransactionsToCSV(opts: {
  periode: string;
  transactions: Transaction[];
  incomeCategoryTotals?: Array<{ name: string; total: number }>;
}) {
  const { periode, transactions, incomeCategoryTotals } = opts;
  const headers = ['Tanggal', 'Deskripsi', 'Kategori', 'Jenis', 'Jumlah'];
  const rows: string[][] = [headers];

  for (const t of transactions) {
    const date = new Date(t.date).toLocaleDateString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
    const jenis = t.type === 'income' ? 'Masuk' : t.type === 'transfer_to_target' ? 'Tabungan' : 'Keluar';
    const prefix = t.type === 'income' ? '+' : '-';
    rows.push([
      date,
      (t.description || '').replace(/\n|\r/g, ' '),
      t.category || '',
      jenis,
      `${prefix}${formatCurrency(t.amount)}`
    ]);
  }

  if (incomeCategoryTotals && incomeCategoryTotals.length > 0) {
    rows.push([], ['Total Nominal per Kategori (Pemasukan)'], ['Kategori', 'Total']);
    for (const item of incomeCategoryTotals) {
      rows.push([item.name, formatCurrency(item.total)]);
    }
  }

  // Convert to CSV string with BOM for Excel
  const csv = '\uFEFF' + rows.map(r => r.map(cell => {
    if (cell == null) return '';
    const s = String(cell);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }).join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Laporan-Keuangan-${periode.replace(/\s/g, '-')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
