
import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Calendar, FileText, Plus, TrendingUp, AlertTriangle } from 'lucide-react';
import { db, Transaction, Category, initializeDatabase } from '../services/database';
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

const Dashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const loadData = async () => {
    try {
      await initializeDatabase();
      const [transactionData, categoryData] = await Promise.all([
        db.transactions.orderBy('createdAt').reverse().limit(5).toArray(),
        db.categories.toArray()
      ]);

      setTransactions(transactionData);
      setCategories(categoryData);

      // Calculate totals for current month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthlyTransactions = await db.transactions
        .filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate.getMonth() === currentMonth && 
                 transactionDate.getFullYear() === currentYear;
        })
        .toArray();

      const income = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expense = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      setTotalIncome(income);
      setTotalExpense(expense);

      // Generate daily data for the last 7 days
      const last7Days = generateLast7DaysData(monthlyTransactions);
      setDailyData(last7Days);

      // Calculate category budgets
      const budgetData = await calculateCategoryBudgets(categoryData, monthlyTransactions);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getBudgetStatus = (percentage: number) => {
    if (percentage >= 100) return { color: 'text-red-600', bg: 'bg-red-500', status: 'Melebihi batas!' };
    if (percentage >= 80) return { color: 'text-orange-600', bg: 'bg-orange-500', status: 'Mendekati batas' };
    return { color: 'text-emerald-600', bg: 'bg-emerald-500', status: 'Dalam batas' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pemasukan Bulan Ini</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="bg-emerald-100 p-3 rounded-full">
              <ArrowUp className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pengeluaran Bulan Ini</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalExpense)}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <ArrowDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Saldo</p>
              <p className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(totalIncome - totalExpense)}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Budget Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Tren 7 Hari Terakhir
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), '']}
                  labelStyle={{ color: '#374151' }}
                />
                <Bar dataKey="income" fill="#10B981" name="Pemasukan" />
                <Bar dataKey="expense" fill="#EF4444" name="Pengeluaran" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget Progress */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Monitor Anggaran
          </h2>
          <div className="space-y-4">
            {categoryBudgets.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Belum ada kategori dengan batas anggaran</p>
            ) : (
              categoryBudgets.map((category) => {
                const status = getBudgetStatus(category.percentage);
                return (
                  <div key={category.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="font-medium text-gray-900">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${status.color}`}>
                          {category.percentage.toFixed(0)}%
                        </p>
                        <p className="text-xs text-gray-500">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Add Transaction */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Tambah Transaksi Cepat
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Tambah Transaksi Baru</span>
          </button>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Transaksi Terbaru</h2>
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Belum ada transaksi</p>
            ) : (
              transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'income' ? 'bg-emerald-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'income' ? (
                        <ArrowUp className={`h-4 w-4 text-emerald-600`} />
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
                      transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'
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

      {/* Transaction Form Modal */}
      <TransactionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categories={categories}
        onTransactionSaved={handleTransactionSaved}
      />
    </div>
  );
};

export default Dashboard;
