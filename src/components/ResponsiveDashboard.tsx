import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Calendar, FileText, Plus, TrendingUp, AlertTriangle } from 'lucide-react';
import { Transaction, Category, db } from '../services/database';
import { useTransactionsByPeriode } from '../hooks/useTransactionsByPeriode';
import { useKategoriByPeriode } from '../hooks/useKategoriByPeriode';
import { useDateFilterHelper } from '../hooks/useDateFilterHelper';
import { useUserSettings } from '../hooks/useUserSettings';
import { formatCurrency } from '../utils/formatCurrency';
import { useTargetProgress } from '@/hooks/useTargetProgress';
import { useTotalBudget } from '@/hooks/useTotalBudget';
import TransactionFormModal from './TransactionFormModal';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Progress } from '@/components/ui/progress';

interface DailyData {
  date: string;
  income: number;
  expense: number;
}

interface CategoryBudget {
  id: number;
  name: string;
  spent: number;
  budget: number;
  color: string;
  percentage: number;
}

const ResponsiveDashboard: React.FC = () => {
  const { transactions: allTransactions, getBalance } = useTransactionsByPeriode();
  const { categories } = useKategoriByPeriode();
  const { getFormattedSelection } = useDateFilterHelper();
  const { getActiveTargetProgress } = useTargetProgress();
  const { userSettings } = useUserSettings();
  const { totalBudget } = useTotalBudget();
  
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [totalSavingsOverall, setTotalSavingsOverall] = useState(0);

  useEffect(() => {
    loadData();
  }, [refreshTrigger, allTransactions, categories]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Get recent transactions (limit 5)
      const recentTrans = allTransactions.slice(0, 5);
      setRecentTransactions(recentTrans);

      // Calculate totals for current period
      const income = allTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expense = allTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      setTotalIncome(income);
      setTotalExpense(expense);

      const allSavings = await db.transactions.where('type').equals('transfer_to_target').toArray();
      setTotalSavingsOverall(allSavings.reduce((sum, t) => sum + t.amount, 0));

      // Generate daily data for the last 7 days
      const last7Days = generateLast7DaysData(allTransactions);
      setDailyData(last7Days);

      // Calculate category budgets
      const budgetData = await calculateCategoryBudgets(categories, allTransactions);
      setCategoryBudgets(budgetData);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateLast7DaysData = (transactions: Transaction[]): DailyData[] => {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTransactions = transactions.filter(t => t.date === dateStr);
      const income = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      
      last7Days.push({
        date: date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
        income,
        expense
      });
    }
    
    return last7Days;
  };

  const calculateCategoryBudgets = async (categories: Category[], transactions: Transaction[]): Promise<CategoryBudget[]> => {
    const budgetCategories = categories.filter(cat => cat.type === 'expense' && cat.budgetLimit);
    
    return budgetCategories.map(category => {
      const spent = transactions
        .filter(t => t.category === category.name && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const percentage = category.budgetLimit ? (spent / category.budgetLimit) * 100 : 0;
      
      return {
        id: category.id!,
        name: category.name,
        spent,
        budget: category.budgetLimit || 0,
        color: category.color,
        percentage: Math.min(percentage, 100)
      };
    });
  };

  const handleTransactionSaved = () => {
    setRefreshTrigger(prev => prev + 1);
    toast.success('Transaksi berhasil ditambahkan!');
  };

  const getBudgetStatus = (percentage: number) => {
    if (percentage > 100) return { color: 'text-red-600', bg: 'bg-red-500', status: 'Melebihi batas!' };
    if (percentage === 100) return { color: 'text-orange-600', bg: 'bg-orange-500', status: 'Mencapai batas' };
    if (percentage >= 80) return { color: 'text-orange-600', bg: 'bg-orange-500', status: 'Mendekati batas' };
    return { color: 'text-amber-700', bg: 'bg-emerald-500', status: 'Dalam batas' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }


  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-0">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-neutral-900 to-amber-600 rounded-xl shadow-sm p-4 sm:p-6 text-white">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Selamat datang, {userSettings.userName}! 👋</h1>
          <p className="text-amber-100 mt-1 text-sm sm:text-base">Ringkasan keuangan Anda untuk {getFormattedSelection()}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-l-4 border-amber-600">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Pemasukan {getFormattedSelection()}</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 break-words">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="bg-amber-100 p-2 sm:p-3 rounded-full flex-shrink-0 ml-2">
              <ArrowUp className="h-5 w-5 sm:h-6 sm:w-6 text-amber-700" />
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

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Saldo</p>
              <p className={`text-lg sm:text-2xl font-bold break-words ${totalIncome - totalExpense >= 0 ? 'text-amber-700' : 'text-red-600'}`}>
                {formatCurrency(totalIncome - totalExpense)}
              </p>
            </div>
            <div className="bg-blue-100 p-2 sm:p-3 rounded-full flex-shrink-0 ml-2">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Tabungan {getFormattedSelection()}</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 break-words">{formatCurrency(totalSavingsOverall)}</p>
            </div>
            <div className="bg-indigo-100 p-2 sm:p-3 rounded-full flex-shrink-0 ml-2">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Budget Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Daily Chart */}
        <div className="hidden">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            <span className="truncate">Tren 7 Hari Terakhir</span>
          </h2>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  interval={0}
                />
                <YAxis 
                  tickFormatter={(value) => `${value / 1000}k`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), '']}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ fontSize: '14px' }}
                />
                <Bar dataKey="income" fill="#10B981" name="Pemasukan" />
                <Bar dataKey="expense" fill="#EF4444" name="Pengeluaran" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Target Progress (if any active targets) */}
        {false && (
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="truncate">Tabungan</span>
            </h2>
            <div className="space-y-3 sm:space-y-4">
              {getActiveTargetProgress().slice(0, 3).map((tp) => (
                <div key={tp.target.id} className="space-y-2">
                  <div className="flex justify-between items-start sm:items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-gray-900 text-sm sm:text-base truncate block">{tp.target.nama}</span>
                      <p className="text-xs text-gray-500">
                        Target: {formatCurrency(tp.target.nominalTarget)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-amber-700">
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

        {/* Budget Progress */}
        <div className="hidden">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            <span className="truncate">Monitor Anggaran</span>
          </h2>
          {totalBudget > 0 && (
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-800">Total Anggaran Bulanan:</span>
                <span className="text-sm font-bold text-blue-900">{formatCurrency(totalBudget)}</span>
              </div>
            </div>
          )}
          <div className="space-y-3 sm:space-y-4">
            {categoryBudgets.length === 0 ? (
              <p className="text-gray-500 text-center py-6 sm:py-8 text-sm sm:text-base">Belum ada kategori dengan batas anggaran</p>
            ) : (
              categoryBudgets.map((category) => {
                const status = getBudgetStatus(category.percentage);
                return (
                  <div key={category.id} className="space-y-2">
                    <div className="flex justify-between items-start sm:items-center gap-2">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="font-medium text-gray-900 text-sm sm:text-base truncate">{category.name}</span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-semibold ${status.color}`}>
                          {category.percentage.toFixed(0)}%
                        </p>
                        <p className="text-xs text-gray-500 whitespace-nowrap">
                          {formatCurrency(category.spent)} / {formatCurrency(category.budget)}
                        </p>
                      </div>
                    </div>
                    <Progress 
                      value={category.percentage} 
                      className="h-2"
                    />
                    {category.percentage >= 80 && (
                      <p className={`text-xs ${status.color} font-medium`}>
                        ⚠️ {status.status}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Quick Add Transaction */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            <span className="truncate">Tambah Transaksi Cepat</span>
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-gradient-to-r from-neutral-900 to-amber-600 text-white py-3 px-4 rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Tambah Transaksi Baru</span>
          </button>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Transaksi Terbaru</h2>
          <div className="space-y-3 sm:space-y-4">
            {recentTransactions.length === 0 ? (
              <p className="text-gray-500 text-center py-6 sm:py-8 text-sm sm:text-base">Belum ada transaksi</p>
            ) : (
              recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <div className={`p-1.5 sm:p-2 rounded-full flex-shrink-0 ${
                      transaction.type === 'income' ? 'bg-amber-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'income' ? (
                        <ArrowUp className={`h-3 w-3 sm:h-4 sm:w-4 text-amber-700`} />
                      ) : (
                        <ArrowDown className={`h-3 w-3 sm:h-4 sm:w-4 text-red-600`} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{transaction.description}</p>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">{transaction.category}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className={`font-semibold text-sm sm:text-base ${
                      transaction.type === 'income' ? 'text-amber-700' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {new Date(transaction.date).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Transaction Form Modal */}
      <TransactionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTransactionSaved={handleTransactionSaved}
      />
    </div>
  );
};

export default ResponsiveDashboard;
