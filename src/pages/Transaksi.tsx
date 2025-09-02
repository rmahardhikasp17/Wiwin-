import React, { useState, useEffect } from 'react';
import { Plus, Filter } from 'lucide-react';
import { Category, Transaction, initializeDatabase } from '../services/database';
import { db } from '../services/database';
import TransactionList from '../components/TransactionList';
import TransactionFormModal from '../components/TransactionFormModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const Transaksi: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Manajemen Transaksi</h1>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">Kelola semua transaksi pemasukan dan pengeluaran Anda</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-neutral-900 to-amber-600 text-white px-4 py-2 rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Transaksi</span>
          </button>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                <label className="text-sm text-gray-600">Tipe:</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="income">Pemasukan</SelectItem>
                    <SelectItem value="expense">Pengeluaran</SelectItem>
                    <SelectItem value="transfer_to_target">Transfer Target</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                <label className="text-sm text-gray-600">Kategori:</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50 max-h-[200px] overflow-y-auto">
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    {(() => {
                      // Filter categories based on selected type and remove duplicates
                      const filteredCategories = selectedType === 'all' ? categories : 
                        selectedType === 'transfer_to_target' ? [] :
                        categories.filter(cat => cat.type === selectedType);
                      
                      // Remove duplicates by creating a Map with unique names
                      const uniqueCategories = Array.from(
                        new Map(filteredCategories.map(cat => [cat.name, cat])).values()
                      );
                      
                      return uniqueCategories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-sm break-words">
                              {category.name}
                            </span>
                          </div>
                        </SelectItem>
                      ));
                    })()}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedType('all');
                }}
                className="w-full sm:w-auto"
              >
                Reset Filter
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <TransactionList
        onEditTransaction={handleEditTransaction}
        refreshTrigger={refreshTrigger}
        categoryFilter={selectedCategory}
        typeFilter={selectedType}
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
