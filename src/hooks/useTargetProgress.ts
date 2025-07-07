import { useState, useEffect, useCallback } from 'react';
import { Target, db } from '../services/database';

interface TargetProgress {
  target: Target;
  progress: number;
  percentage: number;
  remainingAmount: number;
  remainingMonths: number;
  monthlyTarget: number;
  status: 'on-track' | 'behind' | 'ahead' | 'completed';
}

export const useTargetProgress = () => {
  const [targetProgress, setTargetProgress] = useState<TargetProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const calculateProgress = useCallback(async (targets: Target[]): Promise<TargetProgress[]> => {
    const progressData: TargetProgress[] = [];
    
    for (const target of targets) {
      // Get all target-specific transactions within target period
      const targetTransactions = await db.transactions
        .filter(transaction => {
          const transactionDate = new Date(transaction.date);
          const transactionMonth = transactionDate.getMonth() + 1;
          const transactionYear = transactionDate.getFullYear();
          
          const startDate = new Date(target.tahunMulai, target.bulanMulai - 1, 1);
          const endDate = new Date(target.tahunSelesai, target.bulanSelesai - 1, 31);
          const transDate = new Date(transactionYear, transactionMonth - 1, 1);
          
          return transaction.type === 'transfer_to_target' && 
                 transaction.targetId === target.id &&
                 transDate >= startDate && 
                 transDate <= endDate;
        })
        .toArray();
      
      const totalSaved = targetTransactions.reduce((sum, t) => sum + t.amount, 0);
      const progress = Math.min(totalSaved, target.nominalTarget);
      const percentage = (progress / target.nominalTarget) * 100;
      const remainingAmount = Math.max(0, target.nominalTarget - progress);
      
      // Calculate remaining months
      const currentDate = new Date();
      const endDate = new Date(target.tahunSelesai, target.bulanSelesai - 1, 31);
      const diffTime = endDate.getTime() - currentDate.getTime();
      const remainingMonths = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)));
      
      // Calculate monthly target needed
      const totalMonths = ((target.tahunSelesai - target.tahunMulai) * 12) + (target.bulanSelesai - target.bulanMulai) + 1;
      const monthlyTarget = target.nominalTarget / totalMonths;
      
      // Determine status
      let status: TargetProgress['status'] = 'on-track';
      if (percentage >= 100) {
        status = 'completed';
      } else if (remainingMonths > 0) {
        const expectedProgress = (1 - (remainingMonths / totalMonths)) * 100;
        if (percentage < expectedProgress - 10) {
          status = 'behind';
        } else if (percentage > expectedProgress + 10) {
          status = 'ahead';
        }
      }
      
      progressData.push({
        target,
        progress,
        percentage: Math.min(percentage, 100),
        remainingAmount,
        remainingMonths,
        monthlyTarget,
        status
      });
    }
    
    return progressData;
  }, []);

  const loadTargetProgress = useCallback(async () => {
    setLoading(true);
    try {
      const targets = await db.targets.toArray();
      const progressData = await calculateProgress(targets);
      setTargetProgress(progressData);
    } catch (error) {
      console.error('Error loading target progress:', error);
    } finally {
      setLoading(false);
    }
  }, [calculateProgress]);

  // Get active target progress (within current date range)
  const getActiveTargetProgress = useCallback(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    return targetProgress.filter(tp => {
      const startDate = new Date(tp.target.tahunMulai, tp.target.bulanMulai - 1, 1);
      const endDate = new Date(tp.target.tahunSelesai, tp.target.bulanSelesai - 1, 31);
      const current = new Date(currentYear, currentMonth - 1, 1);
      
      return current >= startDate && current <= endDate;
    });
  }, [targetProgress]);

  useEffect(() => {
    loadTargetProgress();
  }, [loadTargetProgress]);

  return {
    targetProgress,
    loading,
    loadTargetProgress,
    getActiveTargetProgress
  };
};