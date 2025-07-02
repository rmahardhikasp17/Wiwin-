
import React from 'react';
import { Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDateFilter } from '../store/useDateFilter';

const FilterTanggalGlobal: React.FC = () => {
  const { bulan, tahun, setBulan, setTahun } = useDateFilter();

  const months = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
  ];

  // Generate years from 2020 to 2035
  const years = Array.from({ length: 16 }, (_, i) => 2020 + i);

  return (
    <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
      <Calendar className="h-4 w-4 text-white/80" />
      
      <Select value={bulan.toString()} onValueChange={(value) => setBulan(Number(value))}>
        <SelectTrigger className="w-32 h-8 border-white/20 bg-white/10 text-white text-sm focus:ring-white/30">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-white border border-gray-200">
          {months.map((month) => (
            <SelectItem key={month.value} value={month.value.toString()}>
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={tahun.toString()} onValueChange={(value) => setTahun(Number(value))}>
        <SelectTrigger className="w-20 h-8 border-white/20 bg-white/10 text-white text-sm focus:ring-white/30">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-white border border-gray-200">
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default FilterTanggalGlobal;
