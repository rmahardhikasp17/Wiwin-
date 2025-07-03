
import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Category, Transaction, initializeDatabase } from '../services/database';
import { db } from '../services/database';
import TransactionList from '../components/TransactionList';
import TransactionFormModal from '../components/TransactionFormModal';

const Transaksi: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      await initializeDatabase();
      const categoryData = await db.categories.toArray();
      setCategories(categoryData);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleTransactionSaved = () => {
    setRefreshTrigger(prev => prev + 1);
    setEditingTransaction(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Transaksi</h1>
          <p className="text-gray-600 mt-1">Kelola semua transaksi pemasukan dan pengeluaran Anda</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Transaksi</span>
        </button>
      </div>

      {/* Transaction List */}
      <TransactionList 
        onEditTransaction={handleEditTransaction}
        refreshTrigger={refreshTrigger}
      />

      {/* Transaction Form Modal */}
      <TransactionFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onTransactionSaved={handleTransactionSaved}
        editingTransaction={editingTransaction}
      />
    </div>
  );
};

export default Transaksi;
