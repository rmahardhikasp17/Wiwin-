import { useState, useEffect, useCallback } from 'react';
import { Category, db } from '../services/database';
import { useDateFilter } from '../store/useDateFilter';
import { toast } from '@/hooks/use-toast';

export const useKategoriByPeriode = () => {
  const { bulan, tahun } = useDateFilter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load categories for current month/year
  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const kategoriesFromDb = await db.categories
        .where(['bulan', 'tahun'])
        .equals([bulan, tahun])
        .toArray();
      
      setCategories(kategoriesFromDb);
    } catch (err) {
      const errorMessage = 'Gagal memuat kategori';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [bulan, tahun]);

  // Add new category
  const addCategory = useCallback(async (categoryData: Omit<Category, 'id' | 'bulan' | 'tahun' | 'createdAt'>) => {
    try {
      const newCategory: Omit<Category, 'id'> = {
        ...categoryData,
        bulan,
        tahun,
        createdAt: new Date()
      };
      
      const id = await db.categories.add(newCategory);
      await loadCategories(); // Reload to get updated list
      
      toast({
        title: "Berhasil",
        description: "Kategori berhasil ditambahkan"
      });
      
      return id;
    } catch (err) {
      const errorMessage = 'Gagal menambah kategori';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  }, [bulan, tahun, loadCategories]);

  // Update category
  const updateCategory = useCallback(async (id: number, categoryData: Partial<Category>) => {
    try {
      await db.categories.update(id, categoryData);
      await loadCategories();
      
      toast({
        title: "Berhasil",
        description: "Kategori berhasil diperbarui"
      });
    } catch (err) {
      const errorMessage = 'Gagal memperbarui kategori';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  }, [loadCategories]);

  // Delete category
  const deleteCategory = useCallback(async (id: number) => {
    try {
      await db.categories.delete(id);
      await loadCategories();
      
      toast({
        title: "Berhasil",
        description: "Kategori berhasil dihapus"
      });
    } catch (err) {
      const errorMessage = 'Gagal menghapus kategori';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  }, [loadCategories]);

  // Get categories by type for current period
  const getCategoriesByType = useCallback((type: 'income' | 'expense') => {
    return categories.filter(cat => cat.type === type);
  }, [categories]);

  // Get spending for category in current period
  const getCategorySpending = useCallback(async (categoryName: string) => {
    try {
      const transactions = await db.transactions
        .where('category')
        .equals(categoryName)
        .filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate.getMonth() + 1 === bulan && 
                 transactionDate.getFullYear() === tahun &&
                 transaction.type === 'expense';
        })
        .toArray();
      
      return transactions.reduce((total, transaction) => total + transaction.amount, 0);
    } catch (err) {
      console.error('Error calculating category spending:', err);
      return 0;
    }
  }, [bulan, tahun]);

  // Initialize categories for new month/year if empty
  const initializeCategoriesForPeriod = useCallback(async () => {
    const currentCategories = await db.categories
      .where(['bulan', 'tahun'])
      .equals([bulan, tahun])
      .count();
    
    if (currentCategories === 0) {
      // Copy default categories to current period
      const defaultCategories: Omit<Category, 'id'>[] = [
        { name: 'Gaji', type: 'income', color: '#10B981', bulan, tahun, createdAt: new Date() },
        { name: 'Freelance', type: 'income', color: '#059669', bulan, tahun, createdAt: new Date() },
        { name: 'Makanan', type: 'expense', color: '#EF4444', budgetLimit: 500000, bulan, tahun, createdAt: new Date() },
        { name: 'Transport', type: 'expense', color: '#F97316', budgetLimit: 200000, bulan, tahun, createdAt: new Date() },
        { name: 'Hiburan', type: 'expense', color: '#8B5CF6', budgetLimit: 300000, bulan, tahun, createdAt: new Date() },
        { name: 'Belanja', type: 'expense', color: '#EC4899', budgetLimit: 400000, bulan, tahun, createdAt: new Date() }
      ];
      
      await db.categories.bulkAdd(defaultCategories);
      await loadCategories();
    }
  }, [bulan, tahun, loadCategories]);

  // Load categories when period changes
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return {
    categories,
    loading,
    error,
    loadCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoriesByType,
    getCategorySpending,
    initializeCategoriesForPeriod
  };
};