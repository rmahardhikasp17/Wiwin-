import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useDateFilterHelper } from '@/hooks/useDateFilterHelper';
import { useTransactionsByPeriode } from '@/hooks/useTransactionsByPeriode';
import { useKategoriByPeriode } from '@/hooks/useKategoriByPeriode';
import { useTargetProgress } from '@/hooks/useTargetProgress';
import { useTotalBudget } from '@/hooks/useTotalBudget';
import { formatCurrency } from '@/utils/formatCurrency';
import { db } from '@/services/database';
import TransactionTable from '@/components/TransactionTable';
import { exportToPDF } from '@/utils/exportPDF';
import { exportTransactionsToXLS } from '@/utils/exportXls';
import { FileDown } from 'lucide-react';

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

interface CategoryUsage {
  id: number;
  name: string;
  type: 'income' | 'expense';
  totalAmount: number;
  budgetLimit?: number;
  percentage: number;
  isOverBudget: boolean;
  color: string;
}

const Laporan: React.FC = () => {
  const { bulan, tahun, getMonthName } = useDateFilterHelper();
  const { transactions } = useTransactionsByPeriode();
  const { categories } = useKategoriByPeriode();
  const { getActiveTargetProgress } = useTargetProgress();
  const { totalBudget } = useTotalBudget();
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryUsage, setCategoryUsage] = useState<CategoryUsage[]>([]);

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const pieColors = ['#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = totalIncome - totalExpense;

  const totalSavings = transactions
    .filter(t => t.type === 'transfer_to_target')
    .reduce((sum, t) => sum + t.amount, 0);

  useEffect(() => {
    loadYearlyData();
    calculateCategoryUsage();
  }, [bulan, tahun, transactions, categories]);

  const loadYearlyData = async () => {
    try {
      const allTransactions = await db.transactions.toArray();
      
      const monthlyStats: MonthlyData[] = [];
      for (let i = 0; i < 12; i++) {
        const monthTransactions = allTransactions.filter(t => {
          const date = new Date(t.date);
          return date.getMonth() === i && date.getFullYear() === tahun;
        });

        const income = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const expense = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const balance = income - expense;

        monthlyStats.push({
          month: months[i].substring(0, 3),
          income,
          expense,
          balance
        });
      }
      setMonthlyData(monthlyStats);
    } catch (error) {
      console.error('Error loading yearly data:', error);
    }
  };

  const calculateCategoryUsage = () => {
    const categoryStats: CategoryUsage[] = categories.map((category, index) => {
      const categoryTransactions = transactions.filter(t => t.category === category.name);
      const totalAmount = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalForType = transactions
        .filter(t => t.type === category.type)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const percentage = totalForType > 0 ? (totalAmount / totalForType) * 100 : 0;
      const isOverBudget = category.budgetLimit ? totalAmount > category.budgetLimit : false;

      return {
        id: category.id || 0,
        name: category.name,
        type: category.type,
        totalAmount,
        budgetLimit: category.budgetLimit,
        percentage,
        isOverBudget,
        color: category.color || pieColors[index % pieColors.length]
      };
    }).filter(stat => stat.totalAmount > 0);

    setCategoryUsage(categoryStats);
  };

  const handleExportPDF = async () => {
    const activeTargets = getActiveTargetProgress();
    const exportData = {
      periode: `${getMonthName(bulan)} ${tahun}`,
      totalIncome,
      totalExpense,
      totalBalance,
      totalBudget,
      transactions,
      categoryUsage: categoryUsage.map(cat => ({
        name: cat.name,
        type: cat.type,
        totalAmount: cat.totalAmount,
        percentage: cat.percentage
      })),
      incomeCategoryTotals: incomeCategoryTotals,
      activeTargets: activeTargets.map(tp => ({
        nama: tp.target.nama,
        nominalTarget: tp.target.nominalTarget,
        progress: tp.progress,
        percentage: tp.percentage,
        status: tp.status
      }))
    };

    await exportToPDF(exportData);
  };

  const incomeCategoryTotals = useMemo(() => {
    const targetNames = ['W2-phone', 'Amel cake', 'Bagaskent gaming center'];
    return targetNames.map((name) => ({
      name,
      total: transactions
        .filter(t => t.type === 'income' && t.category === name)
        .reduce((sum, t) => sum + t.amount, 0)
    }));
  }, [transactions]);

  const pieData = [
    { name: 'Pemasukan', value: totalIncome, fill: '#10B981' },
    { name: 'Pengeluaran', value: totalExpense, fill: '#EF4444' }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Laporan Keuangan</h1>
          <p className="text-gray-400 mt-1">
            Visualisasi dan analisis laporan untuk {getMonthName(bulan)} {tahun}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportPDF} className="flex items-center gap-2 bg-[#D0021B] hover:bg-[#b00218] text-white">
            <FileDown className="h-4 w-4" />
            Export PDF
          </Button>
          <Button onClick={() => exportTransactionsToXLS({ periode: `${getMonthName(bulan)} ${tahun}`, transactions, incomeCategoryTotals })} variant="outline" className="flex items-center gap-2">
            Export Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalBalance)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tabungan</CardTitle>
            <Target className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{formatCurrency(totalSavings)}</div>
          </CardContent>
        </Card>

        {totalBudget > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Anggaran</CardTitle>
              <AlertCircle className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(totalBudget)}</div>
              <p className="text-xs text-gray-500 mt-1">
                Sisa: {formatCurrency(Math.max(0, totalBudget - totalExpense))}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Grafik Bulanan {tahun}</CardTitle>
            <CardDescription>Perbandingan pemasukan, pengeluaran, dan saldo per bulan</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `${value / 1000}K`} />
                  <Tooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === 'income' ? 'Pemasukan' : 
                      name === 'expense' ? 'Pengeluaran' : 'Saldo'
                    ]}
                  />
                  <Bar dataKey="income" fill="#10B981" name="Pemasukan" />
                  <Bar dataKey="expense" fill="#EF4444" name="Pengeluaran" />
                  <Bar 
                    dataKey="balance" 
                    fill="#3B82F6" 
                    name="Saldo"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribusi {getMonthName(bulan)} {tahun}</CardTitle>
            <CardDescription>Perbandingan total pemasukan vs pengeluaran</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => [formatCurrency(value)]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {false && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Target Tabungan Aktif
            </CardTitle>
            <CardDescription>
              Progress target tabungan yang sedang berjalan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Target</TableHead>
                  <TableHead>Target Nominal</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Persentase</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getActiveTargetProgress().map((tp) => (
                  <TableRow key={tp.target.id}>
                    <TableCell className="font-medium">{tp.target.nama}</TableCell>
                    <TableCell>{formatCurrency(tp.target.nominalTarget)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {formatCurrency(tp.progress)}
                        </div>
                        <Progress value={tp.percentage} className="h-2 w-20" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-semibold ${
                        tp.percentage >= 100 ? 'text-green-600' :
                        tp.percentage >= 80 ? 'text-yellow-600' : 'text-blue-600'
                      }`}>
                        {tp.percentage.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tp.status === 'completed' ? 'bg-green-100 text-green-800' :
                        tp.status === 'ahead' ? 'bg-blue-100 text-blue-800' :
                        tp.status === 'behind' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {
                          tp.status === 'completed' ? 'Tercapai' :
                          tp.status === 'ahead' ? 'Unggul' :
                          tp.status === 'behind' ? 'Tertinggal' :
                          'Sesuai Target'
                        }
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Daftar Transaksi</CardTitle>
          <CardDescription>
            Semua transaksi untuk {getMonthName(bulan)} {tahun} ({transactions.length} transaksi)
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto max-h-[60vh] overflow-y-auto">
          <TransactionTable transactions={transactions} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total Nominal per Kategori (Pemasukan)</CardTitle>
          <CardDescription>
            Tiga kategori utama pada periode ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {incomeCategoryTotals.map((item) => (
              <div key={item.name} className="rounded-lg border border-gray-200 p-4 bg-white">
                <p className="text-sm text-gray-600">{item.name}</p>
                <p className="mt-1 text-xl font-bold text-green-600">{formatCurrency(item.total)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Laporan;
