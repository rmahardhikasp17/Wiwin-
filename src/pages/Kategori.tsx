import React, { useMemo } from 'react';
import { CheckCircle, Info } from 'lucide-react';
import { useKategoriByPeriode } from '../hooks/useKategoriByPeriode';
import { useDateFilterHelper } from '../hooks/useDateFilterHelper';

const allowedIncome = ['W2-phone', 'Amel cake', 'Bagaskent gaming center'] as const;

const Kategori: React.FC = () => {
  const { categories, loading } = useKategoriByPeriode();
  const { getFormattedSelection } = useDateFilterHelper();

  const incomeExisting = useMemo(() => {
    const set = new Set(categories.filter(c => c.type === 'income').map(c => c.name));
    return allowedIncome.map(name => ({ name, exists: set.has(name) }));
  }, [categories]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kategori</h1>
            <p className="text-gray-600 mt-1">Periode: {getFormattedSelection()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Pemasukan */}
          <section className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2 text-amber-700">Pemasukan</h2>
            <p className="text-sm text-gray-600 mb-4">Daftar tetap, tidak bisa diubah:</p>
            <ul className="space-y-2">
              {incomeExisting.map(item => (
                <li key={item.name} className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
                  <span className="font-medium text-amber-800 truncate max-w-[70%]">{item.name}</span>
                  {item.exists && (
                    <span className="inline-flex items-center text-amber-700 text-xs whitespace-nowrap">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      aktif
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* Pengeluaran */}
          <section className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2 text-red-700">Pengeluaran</h2>
            <div className="bg-gray-50 rounded-md p-3 border">
              <div className="flex items-center text-gray-700 text-sm">
                <Info className="h-4 w-4 mr-2" />
                Tanpa sub-kategori. Saat menambah pengeluaran, isi deskripsi dan nominal saja.
              </div>
            </div>
          </section>

          {/* Tabungan */}
          <section className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2 text-blue-700">Tabungan</h2>
            <div className="bg-blue-50 rounded-md p-3 border border-blue-100">
              <div className="flex items-center text-blue-700 text-sm">
                <Info className="h-4 w-4 mr-2" />
                Hanya setor saldo ke tabungan ("Setor ke Target"). Penarikan tetap tampil di histori, UI ini tidak mendukung tarik.
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Kategori;
