
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Category, Transaction, db } from '../services/database';
import { useKategoriByPeriode } from '../hooks/useKategoriByPeriode';
import { useActiveTargets } from '../hooks/useActiveTargets';
import { toast } from 'sonner';
import { formatInputNumber, parseNumber } from '../utils/formatCurrency';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionSaved: () => void;
  editingTransaction?: Transaction | null;
}

const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  onTransactionSaved,
  editingTransaction
}) => {
  const { categories, loading: categoriesLoading } = useKategoriByPeriode();
  const { activeTargets, loading: targetsLoading } = useActiveTargets();
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense' | 'transfer_to_target',
    amount: '',
    description: '',
    category: '',
    targetId: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        type: editingTransaction.type,
        amount: formatInputNumber(editingTransaction.amount.toString()),
        description: editingTransaction.description,
        category: editingTransaction.category,
        targetId: editingTransaction.targetId?.toString() || '',
        date: editingTransaction.date
      });
    } else {
      setFormData({
        type: 'expense',
        amount: '',
        description: '',
        category: '',
        targetId: '',
        date: new Date().toISOString().split('T')[0]
      });
    }
  }, [editingTransaction, isOpen]);

  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');
  const currentCategories = formData.type === 'income' ? incomeCategories : expenseCategories;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Different validation for different transaction types
    if (formData.type === 'transfer_to_target') {
      if (!formData.amount || !formData.description || !formData.targetId) {
        toast.error('Semua field harus diisi untuk setor ke target');
        return;
      }
    } else {
      if (!formData.amount || !formData.description || !formData.category) {
        toast.error('Semua field harus diisi');
        return;
      }
    }

    const amount = parseNumber(formData.amount);
    if (amount <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }

    try {
      const transactionData: any = {
        type: formData.type,
        amount: amount,
        description: formData.description,
        date: formData.date,
        createdAt: editingTransaction?.createdAt || new Date()
      };

      // Add category or targetId based on transaction type
      if (formData.type === 'transfer_to_target') {
        transactionData.targetId = parseInt(formData.targetId);
        transactionData.category = 'Transfer ke Target'; // Default category for target transfers
      } else {
        transactionData.category = formData.category;
      }

      if (editingTransaction) {
        await db.transactions.update(editingTransaction.id!, transactionData);
        toast.success('Transaksi berhasil diupdate');
      } else {
        await db.transactions.add(transactionData);
        toast.success('Transaksi berhasil ditambahkan');
      }

      onTransactionSaved();
      onClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast.error('Gagal menyimpan transaksi');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="income"
                checked={formData.type === 'income'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' | 'transfer_to_target', category: '', targetId: '' })}
                className="mr-2 text-emerald-600"
              />
              <span className="text-emerald-600 font-medium">Pemasukan</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="expense"
                checked={formData.type === 'expense'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' | 'transfer_to_target', category: '', targetId: '' })}
                className="mr-2 text-red-600"
              />
              <span className="text-red-600 font-medium">Pengeluaran</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="transfer_to_target"
                checked={formData.type === 'transfer_to_target'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' | 'transfer_to_target', category: '', targetId: '' })}
                className="mr-2 text-blue-600"
              />
              <span className="text-blue-600 font-medium">🎯 Setor ke Target</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jumlah (Rp)
            </label>
            <input
              type="text"
              value={formData.amount}
              onChange={(e) => {
                const formatted = formatInputNumber(e.target.value);
                setFormData({ ...formData, amount: formatted });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Contoh: Makan siang"
              required
            />
          </div>

          {formData.type === 'transfer_to_target' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pilih Target Tabungan
              </label>
              <div className="space-y-2">
                <div className="text-xs text-gray-500 font-medium">
                  TARGET AKTIF PERIODE INI
                </div>
                <select
                  value={formData.targetId}
                  onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Pilih target tabungan</option>
                  {activeTargets.map((target) => (
                    <option key={target.id} value={target.id}>
                      {target.nama} (Target: {formatInputNumber(target.nominalTarget.toString())})
                    </option>
                  ))}
                </select>
                
                {activeTargets.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-xs font-medium text-blue-600 mb-2">
                      Target Aktif:
                    </div>
                    <div className="space-y-1">
                      {activeTargets.map((target) => (
                        <div key={target.id} className="text-xs text-blue-700">
                          🎯 {target.nama} - Target: {formatInputNumber(target.nominalTarget.toString())}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {activeTargets.length === 0 && !targetsLoading && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="text-xs text-yellow-700">
                      Tidak ada target aktif untuk periode ini. Silakan buat target di halaman Target.
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategori
              </label>
              <div className="space-y-2">
                <div className="text-xs text-gray-500 font-medium">
                  {formData.type === 'income' ? 'KATEGORI PEMASUKAN' : 'KATEGORI PENGELUARAN'}
                </div>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  required
                >
                  <option value="">
                    {formData.type === 'income' ? 'Pilih kategori pemasukan' : 'Pilih kategori pengeluaran'}
                  </option>
                  {currentCategories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
                
                {currentCategories.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs font-medium text-gray-600 mb-2">
                      {formData.type === 'income' ? 'Kategori Pemasukan Tersedia:' : 'Kategori Pengeluaran Tersedia:'}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {currentCategories.map((category) => (
                        <span
                          key={category.id}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            formData.type === 'income' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {category.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 font-medium"
            >
              {editingTransaction ? 'Update' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionFormModal;
