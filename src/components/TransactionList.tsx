import React from 'react';
import { Edit, Trash2, Calendar, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { Transaction } from '../services/database';
import { useTransactionsByPeriode } from '../hooks/useTransactionsByPeriode';
import { useDateFilterHelper } from '../hooks/useDateFilterHelper';
import { useTarget } from '../hooks/useTarget';
import { formatCurrency } from '../utils/formatCurrency';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface TransactionListProps {
  onEditTransaction: (transaction: Transaction) => void;
  refreshTrigger: number;
  categoryFilter?: string;
  typeFilter?: string;
  descriptionFilter?: string;
}

const TransactionList: React.FC<TransactionListProps> = ({
  onEditTransaction,
  refreshTrigger,
  categoryFilter = 'all',
  typeFilter = 'all',
  descriptionFilter = ''
}) => {
  const { transactions: allTransactions, loading, loadTransactions, deleteTransaction } = useTransactionsByPeriode();
  const { getFormattedSelection } = useDateFilterHelper();
  const { targets } = useTarget();

  const transactions = React.useMemo(() => {
    let filtered = allTransactions;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === typeFilter);
    }

    if (descriptionFilter && descriptionFilter.trim() !== '') {
      const q = descriptionFilter.toLowerCase();
      filtered = filtered.filter(t => (t.description || '').toLowerCase().includes(q));
    }

    return filtered;
  }, [allTransactions, categoryFilter, typeFilter, descriptionFilter]);

  React.useEffect(() => {
    loadTransactions();
  }, [refreshTrigger, loadTransactions]);

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return;
    await deleteTransaction(id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getTargetName = (targetId?: number) => {
    if (!targetId) return '';
    const target = targets.find(t => t.id === targetId);
    return target?.nama || `Target #${targetId}`;
  };

  const categoryTotal = React.useMemo(() => {
    if (categoryFilter === 'all') return 0;
    return allTransactions
      .filter(t => t.category === categoryFilter)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [allTransactions, categoryFilter]);

  const categoryCount = React.useMemo(() => {
    if (categoryFilter === 'all') return 0;
    return allTransactions.filter(t => t.category === categoryFilter).length;
  }, [allTransactions, categoryFilter]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Daftar Transaksi</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Periode: {getFormattedSelection()}</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {transactions.length} transaksi ditemukan
        </p>
      </div>

      <div className="p-6">
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <p className="text-gray-500 text-lg font-medium">Tidak ada transaksi</p>
            <p className="text-gray-400 text-sm mt-1">
              Belum ada transaksi untuk periode {getFormattedSelection()}
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] sm:max-h-[65vh] overflow-y-auto pr-1">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4 min-w-0">
                  <div className={`p-2 rounded-lg ${
                    transaction.type === 'income'
                      ? 'bg-red-100 text-red-700'
                      : transaction.type === 'transfer_to_target'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {transaction.type === 'income' ? (
                      <TrendingUp className="h-5 w-5" />
                    ) : transaction.type === 'transfer_to_target' ? (
                      <Target className="h-5 w-5" />
                    ) : (
                      <TrendingDown className="h-5 w-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate max-w-[52vw] sm:max-w-none">
                      {transaction.description}
                    </h3>
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs sm:text-sm text-gray-500">
                      {transaction.type === 'transfer_to_target' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium bg-blue-100 text-blue-800">
                          🏦 Tabungan
                        </span>
                      ) : (
                        <span className="truncate max-w-[40vw]">{transaction.category}</span>
                      )}
                      <span className="hidden sm:inline">•</span>
                      <span>{formatDate(transaction.date)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 pl-2 flex-shrink-0">
                  <span className={`font-semibold text-sm sm:text-base ${
                    transaction.type === 'income'
                      ? 'text-red-700'
                      : transaction.type === 'transfer_to_target'
                      ? 'text-blue-600'
                      : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : transaction.type === 'transfer_to_target' ? '🏦' : '-'}{formatCurrency(transaction.amount)}
                  </span>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <div className="h-4 w-4 flex flex-col justify-center space-y-1">
                          <div className="h-0.5 w-0.5 bg-gray-400 rounded-full"></div>
                          <div className="h-0.5 w-0.5 bg-gray-400 rounded-full"></div>
                          <div className="h-0.5 w-0.5 bg-gray-400 rounded-full"></div>
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditTransaction(transaction)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(transaction.id!)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {categoryFilter !== 'all' && (
        <div className="px-6 pb-6 pt-0">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Transaksi</p>
                <p className="text-base font-semibold text-gray-900">{categoryFilter}</p>
              </div>
              <div className="text-2xl font-bold text-red-700">{formatCurrency(categoryTotal)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
