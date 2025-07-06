import { useState, useEffect, useCallback } from 'react';
import { Transaction, db } from '../services/database';
import { useDateFilter } from '../store/useDateFilter';
import { toast } from '@/hooks/use-toast';

export const useTransactionsByPeriode = () => {
  const { bulan, tahun } = useDateFilter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load transactions for current month/year
  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const transactionsFromDb = await db.transactions
        .filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate.getMonth() + 1 === bulan && 
                 transactionDate.getFullYear() === tahun;
        })
        .toArray();
      
      // Sort by date (newest first)
      transactionsFromDb.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setTransactions(transactionsFromDb);
    } catch (err) {
      const errorMessage = 'Gagal memuat transaksi';
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

  // Add new transaction
  const addTransaction = useCallback(async (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
    try {
      const newTransaction: Omit<Transaction, 'id'> = {
        ...transactionData,
        createdAt: new Date()
      };
      
      const id = await db.transactions.add(newTransaction);
      await loadTransactions(); // Reload to get updated list
      
      toast({
        title: "Berhasil",
        description: "Transaksi berhasil ditambahkan"
      });
      
      return id;
    } catch (err) {
      const errorMessage = 'Gagal menambah transaksi';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  }, [loadTransactions]);

  // Update transaction
  const updateTransaction = useCallback(async (id: number, transactionData: Partial<Transaction>) => {
    try {
      await db.transactions.update(id, transactionData);
      await loadTransactions();
      
      toast({
        title: "Berhasil",
        description: "Transaksi berhasil diperbarui"
      });
    } catch (err) {
      const errorMessage = 'Gagal memperbarui transaksi';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  }, [loadTransactions]);

  // Delete transaction
  const deleteTransaction = useCallback(async (id: number) => {
    try {
      await db.transactions.delete(id);
      await loadTransactions();
      
      toast({
        title: "Berhasil",
        description: "Transaksi berhasil dihapus"
      });
    } catch (err) {
      const errorMessage = 'Gagal menghapus transaksi';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  }, [loadTransactions]);

  // Get transactions by type for current period
  const getTransactionsByType = useCallback((type: 'income' | 'expense') => {
    return transactions.filter(t => t.type === type);
  }, [transactions]);

  // Get total amount by type for current period
  const getTotalByType = useCallback((type: 'income' | 'expense') => {
    return transactions
      .filter(t => t.type === type)
      .reduce((total, t) => total + t.amount, 0);
  }, [transactions]);

  // Get total balance for current period
  const getBalance = useCallback(() => {
    const income = getTotalByType('income');
    const expense = getTotalByType('expense');
    return income - expense;
  }, [getTotalByType]);

  // Get transactions by category for current period
  const getTransactionsByCategory = useCallback((categoryName: string) => {
    return transactions.filter(t => t.category === categoryName);
  }, [transactions]);

  // Get spending by category for current period
  const getSpendingByCategory = useCallback((categoryName: string) => {
    return transactions
      .filter(t => t.category === categoryName && t.type === 'expense')
      .reduce((total, t) => total + t.amount, 0);
  }, [transactions]);

  // Load transactions when period changes
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return {
    transactions,
    loading,
    error,
    loadTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionsByType,
    getTotalByType,
    getBalance,
    getTransactionsByCategory,
    getSpendingByCategory
  };
};