import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Download, Upload, Trash2, Sun, Moon, Monitor, User, Save, Mail, Bell } from 'lucide-react';
import { db } from '@/services/database';
import { useUserSettings } from '@/hooks/useUserSettings';
import { emailService, EmailConfig } from '@/services/emailService';

const Pengaturan: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { userSettings, loading: userLoading, updateUserSettings } = useUserSettings();
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    userName: '',
    userEmail: ''
  });
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    enabled: false
  });
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailForm, setEmailForm] = useState<EmailConfig>({
    enabled: false
  });

  // Export data to JSON
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

  // Import data from JSON
  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        
        // Validate data structure
        if (!jsonData.transactions || !jsonData.categories) {
          throw new Error('Invalid backup file format');
        }

        // Clear existing data
        await db.transaction('rw', db.transactions, db.categories, db.settings, async () => {
          await db.transactions.clear();
          await db.categories.clear();
          await db.settings.clear();

          // Import data
          if (jsonData.transactions.length > 0) {
            await db.transactions.bulkAdd(jsonData.transactions);
          }
          if (jsonData.categories.length > 0) {
            await db.categories.bulkAdd(jsonData.categories);
          }
          if (jsonData.settings?.length > 0) {
            await db.settings.bulkAdd(jsonData.settings);
          }
        });

        toast({
          title: "Data Berhasil Diimpor",
          description: "Data backup telah berhasil dipulihkan.",
        });

        // Refresh the page to show updated data
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
    // Reset input value
    event.target.value = '';
  };

  // Reset all data
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
      
      // Refresh to show empty state
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

  // Theme management
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
    } catch (error) {
      // Error handling is done in the hook
    }
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

      {/* User Profile Section */}
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

      {/* Theme Settings */}
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
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Kelola Data</CardTitle>
          <CardDescription>
            Backup, restore, atau reset data aplikasi Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Export Data */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Export Data</h3>
              <p className="text-sm text-gray-600">Unduh backup data dalam format JSON</p>
            </div>
            <Button onClick={handleExportData} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Unduh Data JSON
            </Button>
          </div>

          {/* Import Data */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
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
              <Button asChild variant="outline" className="flex items-center gap-2">
                <label htmlFor="import-file" className="cursor-pointer">
                  <Upload className="h-4 w-4" />
                  Unggah Data JSON
                </label>
              </Button>
            </div>
          </div>

          {/* Reset Data */}
          <div className="flex items-center justify-between p-4 border rounded-lg border-red-200">
            <div>
              <h3 className="font-medium text-red-700">Reset Data</h3>
              <p className="text-sm text-gray-600">Hapus semua data dari aplikasi</p>
            </div>
            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2">
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

      {/* Usage Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Penggunaan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <h4 className="font-medium text-blue-800 mb-2">Cara Menggunakan Aplikasi:</h4>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Gunakan menu <strong>Transaksi</strong> untuk menambah pemasukan dan pengeluaran</li>
                <li>Atur <strong>Kategori</strong> untuk mengorganisir jenis transaksi</li>
                <li>Pantau <strong>Laporan</strong> untuk analisis keuangan bulanan</li>
                <li>Buat <strong>Target</strong> tabungan untuk mencapai tujuan keuangan</li>
                <li>Gunakan filter tanggal untuk melihat data periode tertentu</li>
              </ul>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
              <h4 className="font-medium text-green-800 mb-1">Tips Penggunaan:</h4>
              <p className="text-green-700">Backup data secara berkala untuk keamanan dan gunakan export PDF untuk laporan</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Pengaturan;
