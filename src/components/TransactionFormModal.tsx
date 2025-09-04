import React, { useState, useEffect, useMemo } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: '' as 'income' | 'expense' | 'transfer_to_target' | '',
    amount: '',
    description: '',
    category: '',
    targetId: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Reset form when modal opens/closes or when editing transaction changes
  useEffect(() => {
    if (isOpen) {
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
          type: '',
          amount: '',
          description: '',
          category: '',
          targetId: '',
          date: new Date().toISOString().split('T')[0]
        });
      }
    }
  }, [isOpen, editingTransaction]);

  // Memoized filtered categories to prevent re-renders and duplicates
  const allowedIncome = ['W2-phone', 'Amel cake', 'Bagaskent gaming center'];
  const filteredCategories = useMemo(() => {
    if (formData.type !== 'income') return [];
    const filtered = categories.filter(cat => cat.type === 'income' && allowedIncome.includes(cat.name));
    const uniqueCategories = Array.from(
      new Map(filtered.map(cat => [cat.name, cat])).values()
    );
    return uniqueCategories;
  }, [categories, formData.type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.type === 'transfer_to_target') {
      if (!formData.amount || !formData.description || !formData.targetId) {
        toast.error('Semua field harus diisi untuk setor ke target');
        return;
      }
    } else if (formData.type === 'income') {
      if (!formData.amount || !formData.description || !formData.category) {
        toast.error('Semua field harus diisi');
        return;
      }
    } else {
      if (!formData.amount || !formData.description) {
        toast.error('Semua field harus diisi');
        return;
      }
    }

    const amount = parseNumber(formData.amount);
    if (amount <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }

    setIsLoading(true);
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
        transactionData.category = 'Transfer ke Target';
      } else if (formData.type === 'income') {
        transactionData.category = formData.category;
      } else {
        transactionData.category = 'Pengeluaran';
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypeChange = (newType: 'income' | 'expense' | 'transfer_to_target') => {
    setFormData({ 
      ...formData, 
      type: newType, 
      category: '', 
      targetId: '' 
    });
  };

  const isFormValid = () => {
    if (formData.type === 'transfer_to_target') {
      return formData.amount && formData.description && formData.targetId;
    }
    return formData.amount && formData.description && formData.category && formData.type;
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999] p-4"
      style={{ touchAction: 'none' }}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-md flex flex-col relative"
        style={{
          maxHeight: 'calc(100dvh - 2rem)',
          height: 'fit-content',
          touchAction: 'auto'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mr-4">
            {editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 flex-shrink-0"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Content */}
        <div
          className="flex-1 overflow-y-auto"
          style={{
            maxHeight: 'calc(100dvh - 8rem)',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <form
            id="transaction-form"
            onSubmit={handleSubmit}
            className="p-4 sm:p-6 space-y-4 sm:space-y-5"
          >
            {/* 1. Transaction Type - First Field */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-3">
                Jenis Transaksi
              </label>
              <div className="grid grid-cols-1 gap-2">
                <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    value="income"
                    checked={formData.type === 'income'}
                    onChange={(e) => handleTypeChange(e.target.value as 'income')}
                    className="mr-3 text-amber-700"
                    disabled={isLoading}
                  />
                  <span className="text-amber-700 font-medium text-sm sm:text-base break-words whitespace-normal">
                    💰 Pemasukan
                  </span>
                </label>
                <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    value="expense"
                    checked={formData.type === 'expense'}
                    onChange={(e) => handleTypeChange(e.target.value as 'expense')}
                    className="mr-3 text-red-600"
                    disabled={isLoading}
                  />
                  <span className="text-red-600 font-medium text-sm sm:text-base break-words whitespace-normal">
                    💸 Pengeluaran
                  </span>
                </label>
                <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    value="transfer_to_target"
                    checked={formData.type === 'transfer_to_target'}
                    onChange={(e) => handleTypeChange(e.target.value as 'transfer_to_target')}
                    className="mr-3 text-blue-600"
                    disabled={isLoading}
                  />
                  <span className="text-blue-600 font-medium text-sm sm:text-base break-words whitespace-normal">
                    🎯 Setor ke Target
                  </span>
                </label>
              </div>
            </div>

            {/* 2. Category/Target Selection - Only shows after type is selected */}
            {formData.type && (
              formData.type === 'transfer_to_target' ? (
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    Pilih Target Tabungan
                  </label>
                  <div className="space-y-3">
                    <select
                      value={formData.targetId}
                      onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
                      className="w-full px-3 py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={isLoading}
                    >
                      <option value="">Pilih target tabungan</option>
                      {activeTargets.map((target, index) => (
                        <option key={`target-${target.id}-${index}`} value={target.id}>
                          {target.nama} (Target: {formatInputNumber(target.nominalTarget.toString())})
                        </option>
                      ))}
                    </select>

                    {activeTargets.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-xs sm:text-sm font-medium text-blue-600 mb-2">
                          Target Aktif:
                        </div>
                        <div className="space-y-1">
                          {activeTargets.map((target, index) => (
                            <div key={`active-target-${target.id}-${index}`} className="text-xs sm:text-sm text-blue-700">
                              🎯 <span className="break-words whitespace-normal">{target.nama}</span> -
                              Target: {formatInputNumber(target.nominalTarget.toString())}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTargets.length === 0 && !targetsLoading && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="text-xs sm:text-sm text-yellow-700 break-words whitespace-normal">
                          Tidak ada target aktif untuk periode ini. Silakan buat target di halaman Target.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : formData.type === 'income' ? (
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    Kategori
                  </label>
                  <div className="space-y-3">
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-amber-600 focus:border-amber-600 bg-white"
                      required
                      disabled={isLoading}
                    >
                      <option value="">Pilih kategori pemasukan</option>
                      {filteredCategories.map((category, index) => (
                        <option key={`category-${category.id}-${index}`} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>

                    {filteredCategories.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs sm:text-sm font-medium text-gray-600 mb-2">
                          Kategori Pemasukan:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {filteredCategories.map((category, index) => (
                            <span
                              key={`category-badge-${category.id}-${index}`}
                              className="inline-flex items-center px-2 py-1 rounded-full font-medium break-words bg-amber-100 text-amber-800 text-xs leading-tight"
                              title={category.name}
                            >
                              <span className="break-words max-w-20 leading-tight">
                                {category.name.length > 15 ? `${category.name.substring(0, 15)}...` : category.name}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs sm:text-sm font-medium text-gray-600">
                    Pengeluaran tidak memerlukan kategori. Isi deskripsi dan nominal.
                  </div>
                </div>
              )
            )}

            {/* 3. Description */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                Nama/Deskripsi
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-amber-600 focus:border-amber-600"
                placeholder="Contoh: Makan siang, Gaji bulanan, dll."
                required
                disabled={isLoading}
              />
            </div>

            {/* 4. Amount */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                Nominal (Rp)
              </label>
              <input
                type="text"
                value={formData.amount}
                onChange={(e) => {
                  const formatted = formatInputNumber(e.target.value);
                  setFormData({ ...formData, amount: formatted });
                }}
                className="w-full px-3 py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-amber-600 focus:border-amber-600"
                placeholder="0"
                required
                disabled={isLoading}
              />
            </div>

            {/* 5. Date */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                Tanggal
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-amber-600 focus:border-amber-600"
                required
                disabled={isLoading}
              />
            </div>

            {/* Form Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-3 text-sm sm:text-base font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!isFormValid() || isLoading}
                className="flex-1 bg-gradient-to-r from-neutral-900 to-amber-600 text-white py-3 px-4 rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Menyimpan...
                  </>
                ) : (
                  editingTransaction ? 'Update' : 'Simpan'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransactionFormModal;
