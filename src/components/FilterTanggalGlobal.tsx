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
    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 w-full sm:w-auto">
      <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
        <Calendar className="h-4 w-4 text-white/80 flex-shrink-0" />
        
        <div className="flex space-x-2 flex-1 sm:flex-initial">
          <Select value={bulan.toString()} onValueChange={(value) => setBulan(Number(value))}>
            <SelectTrigger className="flex-1 sm:w-28 lg:w-32 h-8 border-white/20 bg-white/10 text-white text-sm focus:ring-white/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 z-50">
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  <span className="block sm:hidden text-xs truncate">{month.label.substring(0, 3)}</span>
                  <span className="hidden sm:block text-sm break-words">{month.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={tahun.toString()} onValueChange={(value) => setTahun(Number(value))}>
            <SelectTrigger className="w-auto sm:w-20 h-8 flex-none border-white/20 bg-white/10 text-white text-sm focus:ring-white/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 z-50">
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default FilterTanggalGlobal;
