import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useDateFilterHelper } from '@/hooks/useDateFilterHelper';
import { useTransactionsByPeriode } from '@/hooks/useTransactionsByPeriode';
import { useKategoriByPeriode } from '@/hooks/useKategoriByPeriode';
import { formatCurrency } from '@/utils/formatCurrency';
import { db } from '@/services/database';
import TransactionTable from '@/components/TransactionTable';
import { exportToPDF } from '@/utils/exportPDF';
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
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryUsage, setCategoryUsage] = useState<CategoryUsage[]>([]);

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const pieColors = ['#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

  // Calculate totals from current period transactions
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = totalIncome - totalExpense;

  useEffect(() => {
    loadYearlyData();
    calculateCategoryUsage();
  }, [bulan, tahun, transactions, categories]);

  const loadYearlyData = async () => {
    try {
      const allTransactions = await db.transactions.toArray();
      
      // Calculate monthly data for chart (entire year)
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
    const exportData = {
      periode: `${getMonthName(bulan)} ${tahun}`,
      totalIncome,
      totalExpense,
      totalBalance,
      transactions,
      categoryUsage: categoryUsage.map(cat => ({
        name: cat.name,
        type: cat.type,
        totalAmount: cat.totalAmount,
        percentage: cat.percentage
      }))
    };
    
    await exportToPDF(exportData);
  };

  const pieData = [
    { name: 'Pemasukan', value: totalIncome, fill: '#10B981' },
    { name: 'Pengeluaran', value: totalExpense, fill: '#EF4444' }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Keuangan</h1>
          <p className="text-gray-600 mt-1">
            Visualisasi dan analisis laporan untuk {getMonthName(bulan)} {tahun}
          </p>
        </div>
        <Button onClick={handleExportPDF} className="flex items-center gap-2">
          <FileDown className="h-4 w-4" />
          Export PDF
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart with Balance */}
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

        {/* Pie Chart */}
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
                    outerRadius={80}
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

      {/* Category Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rincian Penggunaan Kategori</CardTitle>
          <CardDescription>
            Detail penggunaan per kategori untuk {getMonthName(bulan)} {tahun}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categoryUsage.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Persentase</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryUsage.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        category.type === 'income' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {category.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(category.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={Math.min(category.percentage, 100)} 
                          className="w-16" 
                        />
                        <span className="text-sm text-gray-600">
                          {category.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {category.budgetLimit ? formatCurrency(category.budgetLimit) : '-'}
                    </TableCell>
                    <TableCell>
                      {category.budgetLimit ? (
                        <div className="flex items-center gap-1">
                          {category.isOverBudget ? (
                            <>
                              <AlertCircle className="h-4 w-4 text-red-500" />
                              <span className="text-red-600 text-sm font-medium">Melewati</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-green-600 text-sm font-medium">Aman</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Tidak ada data transaksi untuk periode ini</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Transaksi</CardTitle>
          <CardDescription>
            Semua transaksi untuk {getMonthName(bulan)} {tahun} ({transactions.length} transaksi)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionTable transactions={transactions} />
        </CardContent>
      </Card>
    </div>
  );
};

export default Laporan;