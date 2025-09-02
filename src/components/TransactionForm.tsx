import React, { useState } from 'react';
import { Category, db } from '../services/database';

interface TransactionFormProps {
  categories: Category[];
  onTransactionAdded: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ categories, onTransactionAdded }) => {
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  });

  const filteredCategories = categories.filter(cat => cat.type === formData.type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.description || !formData.category) {
      return;
    }

    try {
      await db.transactions.add({
        type: formData.type,
        amount: parseFloat(formData.amount),
        description: formData.description,
        category: formData.category,
        date: formData.date,
        createdAt: new Date()
      });

      setFormData({
        type: 'expense',
        amount: '',
        description: '',
        category: '',
        date: new Date().toISOString().split('T')[0]
      });

      onTransactionAdded();
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex space-x-4">
        <label className="flex items-center">
          <input
            type="radio"
            value="income"
            checked={formData.type === 'income'}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense', category: '' })}
            className="mr-2 text-amber-700"
          />
          <span className="text-amber-700 font-medium">Pemasukan</span>
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            value="expense"
            checked={formData.type === 'expense'}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense', category: '' })}
            className="mr-2 text-red-600"
          />
          <span className="text-red-600 font-medium">Pengeluaran</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Jumlah (Rp)
        </label>
        <input
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-600 focus:border-amber-600"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-600 focus:border-amber-600"
          placeholder="Contoh: Makan siang"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Kategori
        </label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-600 focus:border-amber-600"
          required
        >
          <option value="">Pilih kategori</option>
          {filteredCategories.map((category) => (
            <option key={category.id} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tanggal
        </label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-600 focus:border-amber-600"
          required
        />
      </div>

      <button
        type="submit"
        className="w-full bg-gradient-to-r from-neutral-900 to-amber-600 text-white py-2 px-4 rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 font-medium"
      >
        Tambah Transaksi
      </button>
    </form>
  );
};

export default TransactionForm;
