
import { useDateFilter } from '../store/useDateFilter';

export const useDateFilterHelper = () => {
  const { bulan, tahun } = useDateFilter();

  // Helper function to get month name
  const getMonthName = (monthNumber: number): string => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[monthNumber - 1] || '';
  };

  // Helper function to get date range for filtering
  const getDateRange = () => {
    const startDate = new Date(tahun, bulan - 1, 1); // First day of selected month
    const endDate = new Date(tahun, bulan, 0); // Last day of selected month
    return { startDate, endDate };
  };

  // Helper function to check if a date is in selected month/year
  const isDateInRange = (date: string | Date): boolean => {
    const checkDate = typeof date === 'string' ? new Date(date) : date;
    const checkYear = checkDate.getFullYear();
    const checkMonth = checkDate.getMonth() + 1;
    
    return checkYear === tahun && checkMonth === bulan;
  };

  // Helper function to format current selection
  const getFormattedSelection = (): string => {
    return `${getMonthName(bulan)} ${tahun}`;
  };

  return {
    bulan,
    tahun,
    getMonthName,
    getDateRange,
    isDateInRange,
    getFormattedSelection,
  };
};
