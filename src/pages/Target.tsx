import React, { useMemo } from 'react';
import { Calendar, PiggyBank, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactionsByPeriode } from '@/hooks/useTransactionsByPeriode';
import { useDateFilterHelper } from '@/hooks/useDateFilterHelper';
import { formatCurrency } from '@/utils/formatCurrency';

const TabunganPage: React.FC = () => {
  const { transactions, loading } = useTransactionsByPeriode();
  const { getFormattedSelection } = useDateFilterHelper();

  const savings = useMemo(() => transactions.filter(t => t.type === 'transfer_to_target'), [transactions]);
  const totalSavings = useMemo(() => savings.reduce((sum, t) => sum + t.amount, 0), [savings]);

  const top5 = useMemo(() => savings.slice(0, 5), [savings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tabungan</h1>
          <p className="text-gray-300 mt-1">Pantau tabungan dan analisis Anda (tanpa tambah target)</p>
        </div>
        <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-200">
          <Calendar className="h-4 w-4" />
          <span>Periode: {getFormattedSelection()}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tabungan Bulan Ini</CardTitle>
            <PiggyBank className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSavings)}</div>
            <p className="text-xs text-gray-500">Dari {savings.length} transaksi tabungan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata per Transaksi</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(savings.length ? Math.round(totalSavings / savings.length) : 0)}</div>
            <p className="text-xs text-gray-500">Rata-rata nominal setor</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaksi Terakhir</CardTitle>
            <PiggyBank className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{savings[0] ? formatCurrency(savings[0].amount) : formatCurrency(0)}</div>
            <p className="text-xs text-gray-500">Nominal setor terakhir</p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>Rincian Tabungan</CardTitle>
          <CardDescription>5 transaksi tabungan terbaru</CardDescription>
        </CardHeader>
        <CardContent>
          {savings.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-6xl mb-3">🏦</div>
              <p className="text-gray-600">Belum ada transaksi tabungan di periode ini</p>
            </div>
          ) : (
            <div className="divide-y">
              {top5.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                      <PiggyBank className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{t.description || 'Tabungan'}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <div className="font-semibold text-blue-700">{formatCurrency(t.amount)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TabunganPage;
