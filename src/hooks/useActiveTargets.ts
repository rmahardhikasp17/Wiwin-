import { useState, useEffect, useCallback } from 'react';
import { Target, db } from '../services/database';
import { useDateFilter } from '../store/useDateFilter';

export const useActiveTargets = () => {
  const [activeTargets, setActiveTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const { bulan, tahun } = useDateFilter();

  const loadActiveTargets = useCallback(async () => {
    setLoading(true);
    try {
      const allTargets = await db.targets.toArray();
      
      // Filter targets that are active in the current selected period
      const active = allTargets.filter(target => {
        const startDate = new Date(target.tahunMulai, target.bulanMulai - 1, 1);
        const endDate = new Date(target.tahunSelesai, target.bulanSelesai - 1, 31);
        const currentPeriod = new Date(tahun, bulan - 1, 1);
        
        return currentPeriod >= startDate && currentPeriod <= endDate;
      });
      
      setActiveTargets(active);
    } catch (error) {
      console.error('Error loading active targets:', error);
      setActiveTargets([]);
    } finally {
      setLoading(false);
    }
  }, [bulan, tahun]);

  useEffect(() => {
    loadActiveTargets();
  }, [loadActiveTargets]);

  return {
    activeTargets,
    loading,
    loadActiveTargets
  };
};