import React from 'react';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tanggal</TableHead>
          <TableHead>Deskripsi</TableHead>
          <TableHead>Kategori</TableHead>
          <TableHead>Jenis</TableHead>
          <TableHead className="text-right">Jumlah</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell className="font-medium">
              {formatDate(transaction.date)}
            </TableCell>
            <TableCell>{transaction.description}</TableCell>
            <TableCell>{transaction.category}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {transaction.type === 'income' ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 text-sm font-medium">Pemasukan</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-red-600 text-sm font-medium">Pengeluaran</span>
                  </>
                )}
              </div>
            </TableCell>
            <TableCell className="text-right">
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
  );
};

export default TransactionTable;