import { useState, useEffect, useCallback } from 'react';
import { Target, db } from '../services/database';
import { toast } from '@/hooks/use-toast';

export const useTarget = () => {
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all targets
  const loadTargets = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const targetsFromDb = await db.targets.orderBy('createdAt').reverse().toArray();
      setTargets(targetsFromDb);
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
  }, []);

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

  // Get active targets (within date range)
  const getActiveTargets = useCallback(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    return targets.filter(target => {
      const startDate = new Date(target.tahunMulai, target.bulanMulai - 1, 1);
      const endDate = new Date(target.tahunSelesai, target.bulanSelesai - 1, 31);
      const current = new Date(currentYear, currentMonth - 1, 1);
      
      return current >= startDate && current <= endDate;
    });
  }, [targets]);

  // Load targets on mount
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
    getActiveTargets
  };
};