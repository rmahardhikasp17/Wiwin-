import { useState, useEffect, useCallback } from 'react';
import { Target, db } from '../services/database';
import { useDateFilter } from '../store/useDateFilter';
import { useTransactionsByPeriode } from './useTransactionsByPeriode';
import { toast } from '@/hooks/use-toast';

interface TargetWithProgress extends Target {
  currentSavings: number;
  progressPercentage: number;
  remainingAmount: number;
  isActive: boolean;
  isCompleted: boolean;
  monthsRemaining: number;
  totalMonths: number;
}

export const useTargetProgress = () => {
  const { bulan, tahun } = useDateFilter();
  const { getBalance } = useTransactionsByPeriode();
  const [targets, setTargets] = useState<TargetWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all targets and calculate progress
  const loadTargets = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const targetsFromDb = await db.targets.toArray();
      
      // Calculate progress for each target
      const targetsWithProgress = await Promise.all(
        targetsFromDb.map(async (target) => {
          // Check if target is active (current month/year is within target range)
          const isActive = isTargetActive(target, bulan, tahun);
          
          // Calculate current savings (cumulative balance up to current month)
          const currentSavings = await calculateCumulativeSavings(target, bulan, tahun);
          
          // Calculate progress
          const progressPercentage = (currentSavings / target.nominalTarget) * 100;
          const remainingAmount = Math.max(0, target.nominalTarget - currentSavings);
          const isCompleted = currentSavings >= target.nominalTarget;
          
          // Calculate time progress
          const totalMonths = getMonthDifference(
            target.bulanMulai, target.tahunMulai,
            target.bulanSelesai, target.tahunSelesai
          );
          
          const monthsElapsed = getMonthDifference(
            target.bulanMulai, target.tahunMulai,
            bulan, tahun
          );
          
          const monthsRemaining = Math.max(0, totalMonths - monthsElapsed);
          
          return {
            ...target,
            currentSavings,
            progressPercentage: Math.min(progressPercentage, 100),
            remainingAmount,
            isActive,
            isCompleted,
            monthsRemaining,
            totalMonths
          };
        })
      );
      
      setTargets(targetsWithProgress);
    } catch (err) {
      const errorMessage = 'Gagal memuat target tabungan';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [bulan, tahun, getBalance]);

  // Add new target
  const addTarget = useCallback(async (targetData: Omit<Target, 'id' | 'createdAt'>) => {
    try {
      const newTarget: Omit<Target, 'id'> = {
        ...targetData,
        createdAt: new Date()
      };
      
      const id = await db.targets.add(newTarget);
      await loadTargets(); // Reload to get updated list
      
      toast({
        title: "Berhasil",
        description: "Target tabungan berhasil ditambahkan"
      });
      
      return id;
    } catch (err) {
      const errorMessage = 'Gagal menambah target tabungan';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  }, [loadTargets]);

  // Update target
  const updateTarget = useCallback(async (id: number, targetData: Partial<Target>) => {
    try {
      await db.targets.update(id, targetData);
      await loadTargets();
      
      toast({
        title: "Berhasil",
        description: "Target tabungan berhasil diperbarui"
      });
    } catch (err) {
      const errorMessage = 'Gagal memperbarui target tabungan';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  }, [loadTargets]);

  // Delete target
  const deleteTarget = useCallback(async (id: number) => {
    try {
      await db.targets.delete(id);
      await loadTargets();
      
      toast({
        title: "Berhasil",
        description: "Target tabungan berhasil dihapus"
      });
    } catch (err) {
      const errorMessage = 'Gagal menghapus target tabungan';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  }, [loadTargets]);

  // Get active targets for current period
  const getActiveTargets = useCallback(() => {
    return targets.filter(target => target.isActive);
  }, [targets]);

  // Get completed targets
  const getCompletedTargets = useCallback(() => {
    return targets.filter(target => target.isCompleted);
  }, [targets]);

  // Load targets when period changes
  useEffect(() => {
    loadTargets();
  }, [loadTargets]);

  return {
    targets,
    loading,
    error,
    loadTargets,
    addTarget,
    updateTarget,
    deleteTarget,
    getActiveTargets,
    getCompletedTargets
  };
};

// Helper functions
const isTargetActive = (target: Target, currentMonth: number, currentYear: number): boolean => {
  const startDate = new Date(target.tahunMulai, target.bulanMulai - 1, 1);
  const endDate = new Date(target.tahunSelesai, target.bulanSelesai - 1, 31);
  const currentDate = new Date(currentYear, currentMonth - 1, 1);
  
  return currentDate >= startDate && currentDate <= endDate;
};

const getMonthDifference = (month1: number, year1: number, month2: number, year2: number): number => {
  return (year2 - year1) * 12 + (month2 - month1) + 1;
};

const calculateCumulativeSavings = async (target: Target, currentMonth: number, currentYear: number): Promise<number> => {
  let totalSavings = 0;
  
  // Calculate from target start to current month (or target end, whichever is earlier)
  const endMonth = Math.min(currentMonth, target.bulanSelesai);
  const endYear = Math.min(currentYear, target.tahunSelesai);
  
  for (let year = target.tahunMulai; year <= endYear; year++) {
    const startMonth = year === target.tahunMulai ? target.bulanMulai : 1;
    const lastMonth = year === endYear ? endMonth : 12;
    
    for (let month = startMonth; month <= lastMonth; month++) {
      // Calculate balance for this specific month
      const monthlyTransactions = await db.transactions
        .filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate.getMonth() + 1 === month && 
                 transactionDate.getFullYear() === year;
        })
        .toArray();
      
      const monthlyIncome = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const monthlyExpense = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const monthlyBalance = monthlyIncome - monthlyExpense;
      if (monthlyBalance > 0) {
        totalSavings += monthlyBalance;
      }
    }
  }
  
  return totalSavings;
};