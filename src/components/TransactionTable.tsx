import React from 'react';
import { Calendar, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { Transaction } from '../services/database';
import { formatCurrency } from '../utils/formatCurrency';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TransactionTableProps {
  transactions: Transaction[];
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Tidak ada transaksi untuk periode ini</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[520px] text-xs sm:text-sm">
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">Tanggal</TableHead>
            <TableHead className="whitespace-nowrap">Deskripsi</TableHead>
            <TableHead className="whitespace-nowrap">Kategori</TableHead>
            <TableHead className="whitespace-nowrap">Jenis</TableHead>
            <TableHead className="text-right whitespace-nowrap">Jumlah</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="font-medium whitespace-nowrap">
                {formatDate(transaction.date)}
              </TableCell>
              <TableCell className="max-w-[220px] truncate">{transaction.description}</TableCell>
              <TableCell className="max-w-[160px] truncate">{transaction.category}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {transaction.type === 'income' ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 text-xs sm:text-sm font-medium">Pemasukan</span>
                    </>
                  ) : transaction.type === 'transfer_to_target' ? (
                    <>
                      <Target className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-600 text-xs sm:text-sm font-medium">Tabungan</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <span className="text-red-600 text-xs sm:text-sm font-medium">Pengeluaran</span>
                    </>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                <span className={`font-semibold ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransactionTable;
