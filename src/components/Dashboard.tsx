import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Calendar, FileText, Plus, TrendingUp } from 'lucide-react';
import { Transaction } from '../services/database';
import { useTransactionsByPeriode } from '../hooks/useTransactionsByPeriode';
import { useKategoriByPeriode } from '../hooks/useKategoriByPeriode';
import { useDateFilterHelper } from '../hooks/useDateFilterHelper';
import { useUserSettings } from '../hooks/useUserSettings';
import { formatCurrency } from '../utils/formatCurrency';
import { useTargetProgress } from '@/hooks/useTargetProgress';
import TransactionFormModal from './TransactionFormModal';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

const Dashboard: React.FC = () => {
  const { transactions: allTransactions, getBalance } = useTransactionsByPeriode();
  useKategoriByPeriode();
  const { getFormattedSelection } = useDateFilterHelper();
  const { getActiveTargetProgress } = useTargetProgress();
  const { userSettings } = useUserSettings();
  
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadData();
  }, [refreshTrigger, allTransactions]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      const recentTrans = allTransactions.slice(0, 5);
      setRecentTransactions(recentTrans);

      const income = allTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expense = allTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      setTotalIncome(income);
      setTotalExpense(expense);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransactionSaved = () => {
    setRefreshTrigger(prev => prev + 1);
    toast.success('Transaksi berhasil ditambahkan!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-gradient-to-r from-red-800 to-red-600 rounded-xl shadow-sm p-4 sm:p-6 text-white">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Selamat datang, {userSettings.userName}! 👋</h1>
          <p className="text-red-100 mt-1 text-sm sm:text-base">Ringkasan keuangan Anda untuk {getFormattedSelection()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-l-4 border-red-600">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Pemasukan {getFormattedSelection()}</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 break-words">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="bg-red-100 p-2 sm:p-3 rounded-full flex-shrink-0 ml-2">
              <ArrowUp className="h-5 w-5 sm:h-6 sm:w-6 text-red-700" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Pengeluaran {getFormattedSelection()}</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 break-words">{formatCurrency(totalExpense)}</p>
            </div>
            <div className="bg-red-100 p-2 sm:p-3 rounded-full flex-shrink-0 ml-2">
              <ArrowDown className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-l-4 border-blue-500 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Saldo</p>
              <p className={`text-lg sm:text-2xl font-bold break-words ${totalIncome - totalExpense >= 0 ? 'text-red-700' : 'text-red-600'}`}>
                {formatCurrency(totalIncome - totalExpense)}
              </p>
            </div>
            <div className="bg-blue-100 p-2 sm:p-3 rounded-full flex-shrink-0 ml-2">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {getActiveTargetProgress().length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Target Tabungan Aktif
          </h2>
          <div className="space-y-4">
            {getActiveTargetProgress().slice(0, 3).map((tp) => (
              <div key={tp.target.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-gray-900">{tp.target.nama}</span>
                    <p className="text-xs text-gray-500">
                      Target: {formatCurrency(tp.target.nominalTarget)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-700">
                      {tp.percentage.toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(tp.progress)}
                    </p>
                  </div>
                </div>
                <Progress value={tp.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Tambah Transaksi Cepat
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-gradient-to-r from-red-800 to-red-600 text-white py-3 px-4 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Tambah Transaksi Baru</span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Transaksi Terbaru</h2>
          <div className="space-y-4">
            {recentTransactions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Belum ada transaksi</p>
            ) : (
              recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'income' ? 'bg-red-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'income' ? (
                        <ArrowUp className={`h-4 w-4 text-red-700`} />
                      ) : (
                        <ArrowDown className={`h-4 w-4 text-red-600`} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">{transaction.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'income' ? 'text-red-700' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.date).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <TransactionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTransactionSaved={handleTransactionSaved}
      />
    </div>
  );
};

export default Dashboard;
