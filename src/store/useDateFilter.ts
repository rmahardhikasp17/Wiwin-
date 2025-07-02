
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DateFilterState {
  bulan: number;
  tahun: number;
  setBulan: (bulan: number) => void;
  setTahun: (tahun: number) => void;
}

const currentDate = new Date();

export const useDateFilter = create<DateFilterState>()(
  persist(
    (set) => ({
      bulan: currentDate.getMonth() + 1, // getMonth() returns 0-11, we want 1-12
      tahun: currentDate.getFullYear(),
      setBulan: (bulan: number) => set({ bulan }),
      setTahun: (tahun: number) => set({ tahun }),
    }),
    {
      name: 'date-filter-storage',
    }
  )
);
