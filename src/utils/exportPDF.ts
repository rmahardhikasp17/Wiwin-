import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Transaction } from '../services/database';
import { formatCurrency } from './formatCurrency';

interface ExportData {
  periode: string;
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  transactions: Transaction[];
  categoryUsage: Array<{
    name: string;
    type: 'income' | 'expense';
    totalAmount: number;
    percentage: number;
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
  yPosition += 20;

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
      const typeText = transaction.type === 'income' ? 'Masuk' : 'Keluar';
      const amount = `${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}`;

      addText(date, margin, yPosition, 9);
      addText(transaction.description.substring(0, 15) + (transaction.description.length > 15 ? '...' : ''), 
        margin + 30, yPosition, 9);
      addText(transaction.category.substring(0, 12) + (transaction.category.length > 12 ? '...' : ''), 
        margin + 80, yPosition, 9);
      addText(typeText, margin + 120, yPosition, 9);
      addText(amount, margin + 150, yPosition, 9);
      yPosition += 8;

      // Check if we need a new page
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 30;
      }
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