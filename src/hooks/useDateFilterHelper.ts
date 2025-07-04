
import { useCallback } from 'react';
import { useDateFilter } from '../store/useDateFilter';

export const useDateFilterHelper = () => {
  const { bulan, tahun } = useDateFilter();

  // Helper function to get month name
  const getMonthName = useCallback((monthNumber: number): string => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[monthNumber - 1] || '';
  }, []);

  // Helper function to get date range for filtering
  const getDateRange = useCallback(() => {
    const startDate = new Date(tahun, bulan - 1, 1); // First day of selected month
    const endDate = new Date(tahun, bulan, 0); // Last day of selected month
    return { startDate, endDate };
  }, [tahun, bulan]);

  // Helper function to check if a date is in selected month/year
  const isDateInRange = useCallback((date: string | Date): boolean => {
    const checkDate = typeof date === 'string' ? new Date(date) : date;
    const checkYear = checkDate.getFullYear();
    const checkMonth = checkDate.getMonth() + 1;
    
    return checkYear === tahun && checkMonth === bulan;
  }, [tahun, bulan]);

  // Helper function to format current selection
  const getFormattedSelection = useCallback((): string => {
    return `${getMonthName(bulan)} ${tahun}`;
  }, [bulan, tahun, getMonthName]);

  return {
    bulan,
    tahun,
    getMonthName,
    getDateRange,
    isDateInRange,
    getFormattedSelection,
  };
};
