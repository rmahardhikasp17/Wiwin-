import { Transaction } from '@/services/database';
import { formatCurrency } from './formatCurrency';

export function exportTransactionsToXLS(opts: {
  periode: string;
  transactions: Transaction[];
  incomeCategoryTotals?: Array<{ name: string; total: number }>;
}) {
  const { periode, transactions, incomeCategoryTotals } = opts;
  const esc = (s: string) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const rows = transactions.map(t => {
    const date = new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const jenis = t.type === 'income' ? 'Masuk' : t.type === 'transfer_to_target' ? 'Tabungan' : 'Keluar';
    const prefix = t.type === 'income' ? '+' : '-';
    return `
      <tr>
        <td>${esc(date)}</td>
        <td>${esc(t.description || '')}</td>
        <td>${esc(t.category || '')}</td>
        <td>${esc(jenis)}</td>
        <td style="text-align:right;">${esc(prefix + formatCurrency(t.amount))}</td>
      </tr>`;
  }).join('');

  const totalsSection = incomeCategoryTotals && incomeCategoryTotals.length > 0 ? `
    <h3 style="margin-top:16px;">Total Nominal per Kategori (Pemasukan)</h3>
    <table border="1" cellspacing="0" cellpadding="4" style="border-collapse:collapse; width:100%; font-family:Arial; font-size:12px;">
      <thead style="background:#f3f4f6;">
        <tr>
          <th align="left">Kategori</th>
          <th align="right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${incomeCategoryTotals.map(item => `
          <tr>
            <td>${esc(item.name)}</td>
            <td align="right">${esc(formatCurrency(item.total))}</td>
          </tr>`).join('')}
      </tbody>
    </table>` : '';

  const html = `
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Laporan Keuangan ${esc(periode)}</title>
      <style>
        table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 12px; }
        th, td { border: 1px solid #d1d5db; padding: 6px 8px; }
        thead { background: #f3f4f6; }
        h2,h3 { font-family: Arial, sans-serif; }
      </style>
    </head>
    <body>
      <h2>Laporan Keuangan ${esc(periode)}</h2>
      <table border="1" cellspacing="0" cellpadding="4">
        <thead>
          <tr>
            <th align="left">Tanggal</th>
            <th align="left">Deskripsi</th>
            <th align="left">Kategori</th>
            <th align="left">Jenis</th>
            <th align="right">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      ${totalsSection}
    </body>
  </html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Laporan-Keuangan-${periode.replace(/\s/g, '-')}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
