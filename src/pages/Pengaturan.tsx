import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Download, Upload, Trash2, Sun, Moon, Monitor, User, Save } from 'lucide-react';
import { db } from '@/services/database';
import { useUserSettings } from '@/hooks/useUserSettings';

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

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pengaturan</h1>
        <p className="text-gray-600">Kelola data dan tampilan aplikasi Anda</p>
      </div>

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

      {/* App Info - Minimized */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Aplikasi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Gaji-Ku</strong> - Aplikasi Manajemen Keuangan Pribadi</p>
            <p className="text-xs">Data disimpan secara lokal dan aman di perangkat Anda</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Pengaturan;
