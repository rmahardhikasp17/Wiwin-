import React, { useState } from 'react';
import { Plus, Target as TargetIcon, TrendingUp, Calendar, Trash2, Edit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTarget } from '@/hooks/useTarget';
import { useTargetProgress } from '@/hooks/useTargetProgress';
import { formatCurrency, formatInputNumber, parseNumber } from '@/utils/formatCurrency';
import { Target } from '@/services/database';

const TargetPage: React.FC = () => {
  const { targets, loading, addTarget, deleteTarget } = useTarget();
  const { targetProgress, getActiveTargetProgress } = useTargetProgress();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nama: '',
    nominalTarget: '',
    bulanMulai: new Date().getMonth() + 1,
    tahunMulai: new Date().getFullYear(),
    bulanSelesai: new Date().getMonth() + 1,
    tahunSelesai: new Date().getFullYear() + 1
  });

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nama || !formData.nominalTarget) {
      return;
    }

    const amount = parseNumber(formData.nominalTarget);
    if (amount <= 0) {
      return;
    }

    try {
      await addTarget({
        nama: formData.nama,
        nominalTarget: amount,
        bulanMulai: formData.bulanMulai,
        tahunMulai: formData.tahunMulai,
        bulanSelesai: formData.bulanSelesai,
        tahunSelesai: formData.tahunSelesai
      });

      setFormData({
        nama: '',
        nominalTarget: '',
        bulanMulai: new Date().getMonth() + 1,
        tahunMulai: new Date().getFullYear(),
        bulanSelesai: new Date().getMonth() + 1,
        tahunSelesai: new Date().getFullYear() + 1
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving target:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus target ini?')) return;
    await deleteTarget(id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'ahead':
        return 'text-blue-600 bg-blue-100';
      case 'behind':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Tercapai';
      case 'ahead':
        return 'Lebih Cepat';
      case 'behind':
        return 'Tertinggal';
      default:
        return 'Sesuai Target';
    }
  };

  const activeTargets = getActiveTargetProgress();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Target Tabungan</h1>
          <p className="text-gray-600 mt-1">Kelola dan pantau target keuangan Anda</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Target
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Tambah Target Tabungan</DialogTitle>
                <DialogDescription>
                  Buat target tabungan baru untuk mencapai tujuan keuangan Anda.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="nama">Nama Target</Label>
                  <Input
                    id="nama"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Contoh: Beli Laptop"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="nominal">Nominal Target</Label>
                  <Input
                    id="nominal"
                    value={formData.nominalTarget}
                    onChange={(e) => {
                      const formatted = formatInputNumber(e.target.value);
                      setFormData({ ...formData, nominalTarget: formatted });
                    }}
                    placeholder="0"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Bulan Mulai</Label>
                    <Select value={formData.bulanMulai.toString()} onValueChange={(value) => setFormData({ ...formData, bulanMulai: parseInt(value) })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month, index) => (
                          <SelectItem key={index} value={(index + 1).toString()}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tahun Mulai</Label>
                    <Select value={formData.tahunMulai.toString()} onValueChange={(value) => setFormData({ ...formData, tahunMulai: parseInt(value) })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Bulan Selesai</Label>
                    <Select value={formData.bulanSelesai.toString()} onValueChange={(value) => setFormData({ ...formData, bulanSelesai: parseInt(value) })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month, index) => (
                          <SelectItem key={index} value={(index + 1).toString()}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tahun Selesai</Label>
                    <Select value={formData.tahunSelesai.toString()} onValueChange={(value) => setFormData({ ...formData, tahunSelesai: parseInt(value) })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
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
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">Simpan Target</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Targets Summary */}
      {activeTargets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Target Aktif</CardTitle>
              <TargetIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTargets.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Target</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(activeTargets.reduce((sum, tp) => sum + tp.target.nominalTarget, 0))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress Rata-rata</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeTargets.length > 0 
                  ? Math.round(activeTargets.reduce((sum, tp) => sum + tp.percentage, 0) / activeTargets.length)
                  : 0}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Target List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {targetProgress.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TargetIcon className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Target</h3>
              <p className="text-gray-600 text-center mb-4">
                Mulai dengan membuat target tabungan pertama Anda
              </p>
              <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Tambah Target Pertama
              </Button>
            </CardContent>
          </Card>
        ) : (
          targetProgress.map((tp) => (
            <Card key={tp.target.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TargetIcon className="h-5 w-5" />
                      {tp.target.nama}
                    </CardTitle>
                    <CardDescription>
                      {months[tp.target.bulanMulai - 1]} {tp.target.tahunMulai} - {months[tp.target.bulanSelesai - 1]} {tp.target.tahunSelesai}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tp.status)}`}>
                      {getStatusText(tp.status)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(tp.target.id!)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-gray-600">
                      {formatCurrency(tp.progress)} / {formatCurrency(tp.target.nominalTarget)}
                    </span>
                  </div>
                  <Progress value={tp.percentage} className="h-2" />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">{tp.percentage.toFixed(1)}%</span>
                    <span className="text-xs text-gray-500">
                      Sisa: {formatCurrency(tp.remainingAmount)}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Target Bulanan:</span>
                    <p className="font-medium">{formatCurrency(tp.monthlyTarget)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Sisa Waktu:</span>
                    <p className="font-medium">{tp.remainingMonths} bulan</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default TargetPage;
