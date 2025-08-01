import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { Category, Transaction, db } from '../services/database';
import { useKategoriByPeriode } from '../hooks/useKategoriByPeriode';
import { useActiveTargets } from '../hooks/useActiveTargets';
import { toast } from 'sonner';
import { formatInputNumber, parseNumber } from '../utils/formatCurrency';
import { FixedSaveButton } from './ui/fixed-save-button';

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
  const filteredCategories = useMemo(() => {
    if (!formData.type || formData.type === 'transfer_to_target') return [];
    
    const filtered = categories.filter(cat => cat.type === formData.type);
    // Remove duplicates by creating a Map with unique names
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-xl shadow-lg w-full max-w-md flex flex-col"
        style={{ 
          maxHeight: 'calc(100dvh - 2rem)',
          height: 'fit-content'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto">
          <form 
            id="transaction-form" 
            onSubmit={handleSubmit} 
            className="p-4 sm:p-6 space-y-4 sm:space-y-5"
            style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
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
                    className="mr-3 text-emerald-600"
                    disabled={isLoading}
                  />
                  <span className="text-emerald-600 font-medium text-sm sm:text-base break-words whitespace-normal">
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
              ) : (
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    Kategori
                  </label>
                  <div className="space-y-3">
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      required
                      disabled={isLoading}
                    >
                      <option value="">
                        {formData.type === 'income' ? 'Pilih kategori pemasukan' : 'Pilih kategori pengeluaran'}
                      </option>
                      {filteredCategories.map((category, index) => (
                        <option key={`category-${category.id}-${index}`} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    
                    {filteredCategories.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs sm:text-sm font-medium text-gray-600 mb-2">
                          {formData.type === 'income' ? 'Kategori Pemasukan:' : 'Kategori Pengeluaran:'}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {filteredCategories.map((category, index) => (
                            <span
                              key={`category-badge-${category.id}-${index}`}
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium break-words whitespace-normal ${
                                formData.type === 'income' 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}
                              title={category.name}
                            >
                              <span className="break-words">{category.name}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
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
                className="w-full px-3 py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
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
                className="w-full px-3 py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
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
                className="w-full px-3 py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                required
                disabled={isLoading}
              />
            </div>
          </form>
        </div>

        {/* Fixed Save Button */}
        <FixedSaveButton
          onSave={() => {}} // Form submission handled by form element
          onCancel={onClose}
          isLoading={isLoading}
          formId="transaction-form"
          saveText={editingTransaction ? 'Update' : 'Simpan'}
          disabled={!isFormValid()}
        />
      </div>
    </div>
  );
};

export default TransactionFormModal;
