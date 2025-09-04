import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Download, Upload, Trash2, Sun, Moon, Monitor, User, Save, Image as ImageIcon, X } from 'lucide-react';
import { db } from '@/services/database';
import { useDateFilterHelper } from '@/hooks/useDateFilterHelper';
import { useUserSettings } from '@/hooks/useUserSettings';
import { extractThemeFromImage, applyThemeColors, saveTheme, getSavedThemeImage, clearTheme, removeThemeColors } from '@/utils/theme';

const Pengaturan: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { userSettings, updateUserSettings } = useUserSettings();
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    userName: '',
    userEmail: ''
  });
  const { bulan, tahun, getMonthName } = useDateFilterHelper();
  const [themeImage, setThemeImage] = useState<string | undefined>(undefined);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  React.useEffect(() => {
    (async () => {
      const img = await getSavedThemeImage();
      setThemeImage(img);
    })();
  }, []);

  const handleThemeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingImage(true);
    try {
      const dataUrl = await fileToDataURL(file);
      const theme = await extractThemeFromImage(dataUrl);
      applyThemeColors(theme);
      await saveTheme(theme, dataUrl);
      setThemeImage(dataUrl);
      toast({ title: 'Tema diperbarui', description: 'Warna aplikasi disesuaikan dari gambar Anda.' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Gagal memproses gambar', description: 'Pastikan file gambar valid.', variant: 'destructive' });
    }
    setIsProcessingImage(false);
    e.target.value = '';
  };

  const handleResetThemeImage = async () => {
    try {
      removeThemeColors();
      await clearTheme();
      setThemeImage(undefined);
      toast({ title: 'Tema dikembalikan', description: 'Warna kembali ke bawaan.' });
    } catch (e) {}
  };

  const handleSeedDemoAppend = async () => {
    if (isSeeding) return;
    setIsSeeding(true);
    try {
      const desiredCategories = [
        { name: 'W2-phone', type: 'income' as const, color: '#10B981' },
        { name: 'Amel cake', type: 'income' as const, color: '#059669' },
        { name: 'Bagaskent gaming center', type: 'income' as const, color: '#14B8A6' }
      ];

      const existingThisPeriod = await db.categories
        .where(['bulan','tahun'])
        .equals([bulan, tahun])
        .toArray();

      const toAddCats = desiredCategories.filter(dc => !existingThisPeriod.some(c => c.name === dc.name && c.type === dc.type));
      if (toAddCats.length) {
        await db.categories.bulkAdd(toAddCats.map(c => ({
          name: c.name,
          type: c.type,
          budgetLimit: c.budgetLimit,
          color: c.color,
          bulan,
          tahun,
          createdAt: new Date()
        })));
      }

      const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      const dateStr = (d: number) => `${tahun}-${pad2(bulan)}-${pad2(d)}`;

      const tx = [
        { type: 'income', amount: 5000000, description: 'Pendapatan W2-phone', category: 'W2-phone', date: dateStr(1) },
        { type: 'income', amount: 1200000, description: 'Penjualan Amel cake', category: 'Amel cake', date: dateStr(3) },
        { type: 'expense', amount: 45000, description: 'Sarapan', category: 'Pengeluaran', date: dateStr(2) },
        { type: 'expense', amount: 60000, description: 'Transport Online', category: 'Pengeluaran', date: dateStr(4) },
        { type: 'expense', amount: 120000, description: 'Belanja Harian', category: 'Pengeluaran', date: dateStr(5) },
        { type: 'expense', amount: 80000, description: 'Nonton', category: 'Pengeluaran', date: dateStr(6) },
        { type: 'expense', amount: 70000, description: 'Makan Malam', category: 'Pengeluaran', date: dateStr(8) },
        { type: 'expense', amount: 150000, description: 'Isi Bensin', category: 'Pengeluaran', date: dateStr(10) },
        { type: 'income', amount: 900000, description: 'Sewa PC BGGC', category: 'Bagaskent gaming center', date: dateStr(12) },
        { type: 'expense', amount: 250000, description: 'Belanja Pakaian', category: 'Pengeluaran', date: dateStr(15) },
        { type: 'income', amount: 400000, description: 'Pendapatan Amel cake', category: 'Amel cake', date: dateStr(16) },
        { type: 'expense', amount: 95000, description: 'Makan Siang', category: 'Pengeluaran', date: dateStr(17) },
        { type: 'expense', amount: 40000, description: 'Parkir & Tol', category: 'Pengeluaran', date: dateStr(18) },
        { type: 'transfer_to_target', amount: 300000, description: '', category: 'Tabungan', date: dateStr(19) },
        { type: 'expense', amount: 150000, description: 'Nongkrong', category: 'Pengeluaran', date: dateStr(20) }
      ] as const;

      await db.transactions.bulkAdd(tx.map(t => ({
        type: t.type as any,
        amount: t.amount,
        description: t.type === 'transfer_to_target' ? (t.description || 'Tabungan') : t.description,
        category: t.type === 'transfer_to_target' ? 'Tabungan' : t.category,
        date: t.date,
        createdAt: new Date()
      })));

      toast({
        title: 'Data Demo Ditambahkan',
        description: `Kategori pemasukan tetap dan transaksi demo ditambahkan untuk ${getMonthName(bulan)} ${tahun}.`,
      });
    } catch (err) {
      console.error('Seed demo error:', err);
      toast({
        title: 'Gagal Menambahkan Data Demo',
        description: 'Terjadi kesalahan saat membuat data contoh.',
        variant: 'destructive',
      });
    }
    setIsSeeding(false);
  };

  const handleExportData = async () => {
    try {
      const transactions = await db.transactions.toArray();
      const categories = await db.categories.toArray();
      const settings = await db.settings.toArray();

      const exportData = {
        transactions,
        categories,
        settings,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dompet-bergerak-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data Berhasil Diekspor",
        description: "File backup telah diunduh ke perangkat Anda.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Gagal Mengekspor Data",
        description: "Terjadi kesalahan saat mengekspor data.",
        variant: "destructive",
      });
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        let raw: any = null;
        if (jsonData && typeof jsonData === 'object') {
          if (jsonData.transactions || jsonData.categories || jsonData.settings) {
            raw = jsonData;
          } else if (jsonData.data && (jsonData.data.transactions || jsonData.data.categories)) {
            raw = jsonData.data;
          } else if (Array.isArray((jsonData as any).items)) {
            raw = { transactions: (jsonData as any).items };
          }
        } else if (Array.isArray(jsonData)) {
          raw = { transactions: jsonData };
        }

        if (!raw) {
          throw new Error('Invalid backup file format');
        }

        const txArray = Array.isArray(raw.transactions) ? raw.transactions : [];
        const catArray = Array.isArray(raw.categories) ? raw.categories : [];
        const settingsArray = Array.isArray(raw.settings) ? raw.settings : [];

        if (txArray.length === 0 && catArray.length === 0 && settingsArray.length === 0) {
          throw new Error('Invalid backup file format');
        }

        const normalizeTransactions = txArray.map((t: any) => ({
          type: t.type,
          amount: typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount),
          description: t.type === 'transfer_to_target' ? (t.description || 'Tabungan') : (t.description || ''),
          category: t.category || (t.type === 'transfer_to_target' ? 'Tabungan' : ''),
          date: t.date,
          createdAt: t.createdAt ? new Date(t.createdAt) : new Date()
        }));

        const normalizeCategories = catArray.map((c: any) => ({
          name: c.name || c.title,
          type: c.type,
          budgetLimit: typeof c.budgetLimit === 'string' ? parseFloat(c.budgetLimit) : (c.budgetLimit ?? undefined),
          color: c.color || '#999999',
          bulan: c.bulan ?? new Date().getMonth() + 1,
          tahun: c.tahun ?? new Date().getFullYear(),
          createdAt: c.createdAt ? new Date(c.createdAt) : new Date()
        }));

        const normalizeSettings = settingsArray;

        await db.transaction('rw', db.transactions, db.categories, db.settings, async () => {
          await db.transactions.clear();
          await db.categories.clear();
          await db.settings.clear();

          if (normalizeTransactions.length > 0) {
            await db.transactions.bulkAdd(normalizeTransactions);
          }
          if (normalizeCategories.length > 0) {
            await db.categories.bulkAdd(normalizeCategories);
          }
          if (normalizeSettings.length > 0) {
            await db.settings.bulkAdd(normalizeSettings);
          }
        });

        toast({
          title: "Data Berhasil Diimpor",
          description: "Data backup telah berhasil dipulihkan.",
        });

        window.location.reload();
      } catch (error) {
        console.error('Import error:', error);
        toast({
          title: "Gagal Mengimpor Data",
          description: "File backup tidak valid atau rusak.",
          variant: "destructive",
        });
      }
    };

    reader.readAsText(file);
    event.target.value = '';
  };

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      await db.transaction('rw', db.transactions, db.categories, db.settings, async () => {
        await db.transactions.clear();
        await db.categories.clear();
        await db.settings.clear();
      });

      toast({
        title: "Data Berhasil Dihapus",
        description: "Semua data telah dihapus dari aplikasi.",
      });

      setIsResetDialogOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Reset error:', error);
      toast({
        title: "Gagal Menghapus Data",
        description: "Terjadi kesalahan saat menghapus data.",
        variant: "destructive",
      });
    }
    setIsResetting(false);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', systemTheme === 'dark');
    } else {
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    }

    toast({
      title: "Tema Berhasil Diubah",
      description: `Tema telah diatur ke ${newTheme === 'light' ? 'Terang' : newTheme === 'dark' ? 'Gelap' : 'Mengikuti Sistem'}.`,
    });
  };

  const handleEditProfile = () => {
    setProfileForm({
      userName: userSettings.userName,
      userEmail: userSettings.userEmail || ''
    });
    setEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    try {
      await updateUserSettings({
        userName: profileForm.userName || 'Pengguna',
        userEmail: profileForm.userEmail
      });
      setEditingProfile(false);
    } catch (error) {}
  };

  const handleCancelEdit = () => {
    setEditingProfile(false);
    setProfileForm({
      userName: userSettings.userName,
      userEmail: userSettings.userEmail || ''
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pengaturan</h1>
        <p className="text-gray-600">Kelola data dan tampilan aplikasi Anda</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profil Pengguna
          </CardTitle>
          <CardDescription>
            Kelola informasi profil Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          {editingProfile ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="userName">Nama Pengguna</Label>
                <Input
                  id="userName"
                  value={profileForm.userName}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, userName: e.target.value }))}
                  placeholder="Masukkan nama Anda"
                />
              </div>
              <div>
                <Label htmlFor="userEmail">Email (Opsional)</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={profileForm.userEmail}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, userEmail: e.target.value }))}
                  placeholder="nama@email.com"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveProfile} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Simpan
                </Button>
                <Button variant="outline" onClick={handleCancelEdit}>
                  Batal
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Nama: {userSettings.userName}</h3>
                  {userSettings.userEmail && (
                    <p className="text-sm text-gray-600">Email: {userSettings.userEmail}</p>
                  )}
                </div>
                <Button onClick={handleEditProfile} variant="outline">
                  Edit Profil
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Pengaturan Tema
          </CardTitle>
          <CardDescription>
            Pilih tampilan yang sesuai dengan preferensi Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              onClick={() => handleThemeChange('light')}
              className="flex items-center gap-2"
            >
              <Sun className="h-4 w-4" />
              Terang
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              onClick={() => handleThemeChange('dark')}
              className="flex items-center gap-2"
            >
              <Moon className="h-4 w-4" />
              Gelap
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              onClick={() => handleThemeChange('system')}
              className="flex items-center gap-2"
            >
              <Monitor className="h-4 w-4" />
              Sistem
            </Button>
          </div>

          <div className="mt-2 p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                <h3 className="font-medium">Tema dari Gambar</h3>
              </div>
              {themeImage && (
                <Button size="sm" variant="ghost" onClick={handleResetThemeImage} className="text-red-600">
                  <X className="h-4 w-4" /> Reset
                </Button>
              )}
            </div>

            <p className="text-sm text-gray-600 mb-3">Unggah gambar (logo/foto) untuk menyesuaikan warna utama aplikasi secara otomatis.</p>
            <div className="flex items-center gap-4">
              <input id="theme-image" type="file" accept="image/*" className="hidden" onChange={handleThemeImageUpload} />
              <Button asChild variant="outline" disabled={isProcessingImage}>
                <label htmlFor="theme-image" className="cursor-pointer flex items-center gap-2">
                  <Upload className="h-4 w-4" /> {isProcessingImage ? 'Memproses...' : 'Unggah Gambar'}
                </label>
              </Button>
              {themeImage && (
                <img src={themeImage} alt="Tema" className="h-12 w-12 rounded object-cover border" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kelola Data</CardTitle>
          <CardDescription>
            Backup, restore, atau reset data aplikasi Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg space-y-3">
            <div>
              <h3 className="font-medium">Export Data</h3>
              <p className="text-sm text-gray-600">Unduh backup data dalam format JSON</p>
            </div>
            <Button onClick={handleExportData} className="flex items-center gap-2 w-full sm:w-auto">
              <Download className="h-4 w-4" />
              Unduh Data JSON
            </Button>
          </div>

          <div className="p-4 border rounded-lg space-y-3">
            <div>
              <h3 className="font-medium">Import Data</h3>
              <p className="text-sm text-gray-600">Pulihkan data dari file backup JSON</p>
            </div>
            <div>
              <input
                type="file"
                id="import-file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
              <Button asChild variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
                <label htmlFor="import-file" className="cursor-pointer">
                  <Upload className="h-4 w-4" />
                  Unggah Data JSON
                </label>
              </Button>
            </div>
          </div>

          <div className="p-4 border rounded-lg space-y-3">
            <div>
              <h3 className="font-medium">Isi Data Demo</h3>
              <p className="text-sm text-gray-600">Tambahkan 3 kategori pemasukan tetap dan 15 transaksi demo (append)</p>
            </div>
            <Button onClick={handleSeedDemoAppend} disabled={isSeeding} className="w-full sm:w-auto">
              {isSeeding ? 'Menambahkan...' : 'Isi Data Demo'}
            </Button>
          </div>

          <div className="p-4 border rounded-lg border-red-200 space-y-3">
            <div>
              <h3 className="font-medium text-red-700">Reset Data</h3>
              <p className="text-sm text-gray-600">Hapus semua data dari aplikasi</p>
            </div>
            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2 w-full sm:w-auto">
                  <Trash2 className="h-4 w-4" />
                  Hapus Semua Data
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Konfirmasi Hapus Data</DialogTitle>
                  <DialogDescription>
                    Apakah Anda yakin ingin menghapus semua data? Tindakan ini tidak dapat dibatalkan.
                    Pastikan Anda telah membuat backup data terlebih dahulu.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsResetDialogOpen(false)}
                    disabled={isResetting}
                  >
                    Batal
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleResetData}
                    disabled={isResetting}
                  >
                    {isResetting ? 'Menghapus...' : 'Ya, Hapus Semua'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Penggunaan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <h4 className="font-medium text-blue-800 mb-2">Cara Menggunakan Aplikasi:</h4>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Gunakan menu <strong>Transaksi</strong> untuk menambah pemasukan, pengeluaran, dan setoran tabungan</li>
                <li><strong>Kategori</strong> disederhanakan: pemasukan tetap (W2-phone, Amel cake, Bagaskent gaming center). Daftar tidak dapat diubah</li>
                <li>Lihat <strong>Laporan</strong> untuk analisis keuangan bulanan per periode</li>
                <li>Pantau <strong>Tabungan</strong> untuk melihat setoran dan progres saldo</li>
                <li>Gunakan filter tanggal untuk melihat data periode tertentu</li>
              </ul>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
              <h4 className="font-medium text-green-800 mb-1">Tips Penggunaan:</h4>
              <p className="text-green-700">Backup data secara berkala, dan gunakan export PDF untuk laporan</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default Pengaturan;
