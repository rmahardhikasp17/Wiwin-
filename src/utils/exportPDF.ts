import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Transaction } from '../services/database';
import { formatCurrency } from './formatCurrency';

interface ExportData {
  periode: string;
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  totalBudget?: number;
  transactions: Transaction[];
  categoryUsage: Array<{
    name: string;
    type: 'income' | 'expense';
    totalAmount: number;
    percentage: number;
  }>;
  activeTargets?: Array<{
    nama: string;
    nominalTarget: number;
    progress: number;
    percentage: number;
    status: string;
  }>;
}

export const exportToPDF = async (data: ExportData) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = 30;

  // Helper function to add text
  const addText = (text: string, x: number, y: number, fontSize = 12, isBold = false) => {
    pdf.setFontSize(fontSize);
    if (isBold) {
      pdf.setFont(undefined, 'bold');
    } else {
      pdf.setFont(undefined, 'normal');
    }
    pdf.text(text, x, y);
  };

  // Helper function to wrap text
  const wrapText = (text: string, maxWidth: number, fontSize = 9): string[] => {
    pdf.setFontSize(fontSize);
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const textWidth = pdf.getTextWidth(testLine);

      if (textWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          lines.push(word);
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  };

  // Header
  addText('LAPORAN KEUANGAN', pageWidth / 2, yPosition, 18, true);
  pdf.setTextColor(100);
  addText(data.periode, pageWidth / 2, yPosition + 10, 12);
  pdf.setTextColor(0);
  yPosition += 30;

  // Summary Section
  addText('RINGKASAN KEUANGAN', margin, yPosition, 14, true);
  yPosition += 15;

  addText(`Total Pemasukan: ${formatCurrency(data.totalIncome)}`, margin, yPosition);
  yPosition += 10;
  addText(`Total Pengeluaran: ${formatCurrency(data.totalExpense)}`, margin, yPosition);
  yPosition += 10;
  addText(`Saldo: ${formatCurrency(data.totalBalance)}`, margin, yPosition, 12, true);
  yPosition += 10;
  if (data.totalBudget && data.totalBudget > 0) {
    addText(`Total Anggaran Bulanan: ${formatCurrency(data.totalBudget)}`, margin, yPosition, 12, true);
    yPosition += 10;
  }
  yPosition += 10;

  // Active Targets Section
  if (data.activeTargets && data.activeTargets.length > 0) {
    addText('TARGET TABUNGAN AKTIF', margin, yPosition, 14, true);
    yPosition += 15;

    data.activeTargets.forEach((target) => {
      const statusText =
        target.status === 'completed' ? 'Tercapai' :
        target.status === 'ahead' ? 'Unggul' :
        target.status === 'behind' ? 'Tertinggal' :
        'Sesuai Target';

      addText(`${target.nama}: ${formatCurrency(target.progress)} / ${formatCurrency(target.nominalTarget)} (${target.percentage.toFixed(1)}% - ${statusText})`,
        margin, yPosition);
      yPosition += 10;

      // Check if we need a new page
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 30;
      }
    });
    yPosition += 10;
  }

  // Category Usage Section
  if (data.categoryUsage.length > 0) {
    addText('PENGGUNAAN KATEGORI', margin, yPosition, 14, true);
    yPosition += 15;

    data.categoryUsage.forEach((category) => {
      const typeText = category.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
      addText(`${category.name} (${typeText}): ${formatCurrency(category.totalAmount)} (${category.percentage.toFixed(1)}%)`,
        margin, yPosition);
      yPosition += 10;

      // Check if we need a new page
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 30;
      }
    });
    yPosition += 10;
  }

  // Transactions Section
  if (data.transactions.length > 0) {
    // Check if we need a new page for transactions
    if (yPosition > 200) {
      pdf.addPage();
      yPosition = 30;
    }

    addText('DAFTAR TRANSAKSI', margin, yPosition, 14, true);
    yPosition += 15;

    // Table headers
    addText('Tanggal', margin, yPosition, 10, true);
    addText('Deskripsi', margin + 30, yPosition, 10, true);
    addText('Kategori', margin + 80, yPosition, 10, true);
    addText('Jenis', margin + 120, yPosition, 10, true);
    addText('Jumlah', margin + 150, yPosition, 10, true);
    yPosition += 10;

    // Draw line under headers
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;

    // Transaction data
    data.transactions.forEach((transaction) => {
      const date = new Date(transaction.date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      let typeText = 'Keluar';
      if (transaction.type === 'income') typeText = 'Masuk';
      else if (transaction.type === 'transfer_to_target') typeText = 'Tabungan';

      const formattedAmount = formatCurrency(transaction.amount);
      const prefix = transaction.type === 'income' ? '+' : '-';
      const amount = `${prefix}${formattedAmount}`;

      // Wrap description text
      const descriptionLines = wrapText(transaction.description, 40, 9);
      const categoryLines = wrapText(transaction.category, 25, 9);

      // Calculate how many lines this transaction will need
      const maxLines = Math.max(descriptionLines.length, categoryLines.length, 1);
      const lineHeight = 6;

      // Check if we need a new page
      if (yPosition + (maxLines * lineHeight) > 270) {
        pdf.addPage();
        yPosition = 30;
      }

      // Add date, type, and amount (single line items)
      addText(date, margin, yPosition, 9);
      addText(typeText, margin + 120, yPosition, 9);
      addText(amount, margin + 150, yPosition, 9);

      // Add multi-line description
      descriptionLines.forEach((line, index) => {
        addText(line, margin + 30, yPosition + (index * lineHeight), 9);
      });

      // Add multi-line category
      categoryLines.forEach((line, index) => {
        addText(line, margin + 80, yPosition + (index * lineHeight), 9);
      });

      yPosition += maxLines * lineHeight + 2;
    });
  }

  // Footer
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(100);
    addText(`Halaman ${i} dari ${totalPages}`, pageWidth - margin - 30, 280, 8);
    addText(`Dibuat pada ${new Date().toLocaleDateString('id-ID')}`, margin, 280, 8);
  }

  // Save the PDF
  const fileName = `Laporan-Keuangan-${data.periode.replace(/\s/g, '-')}.pdf`;
  pdf.save(fileName);
};
