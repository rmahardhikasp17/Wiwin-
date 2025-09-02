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
import { useDateFilterHelper } from '@/hooks/useDateFilterHelper';
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
  const { bulan, tahun, getMonthName } = useDateFilterHelper();
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedDemoAppend = async () => {
    if (isSeeding) return;
    setIsSeeding(true);
    try {
      // 1) Ensure baseline categories for current period
      const desiredCategories = [
        { name: 'Gaji', type: 'income' as const, color: '#10B981' },
        { name: 'Freelance', type: 'income' as const, color: '#059669' },
        { name: 'Makanan', type: 'expense' as const, color: '#EF4444', budgetLimit: 500000 },
        { name: 'Transport', type: 'expense' as const, color: '#F97316', budgetLimit: 200000 },
        { name: 'Hiburan', type: 'expense' as const, color: '#8B5CF6', budgetLimit: 300000 },
        { name: 'Belanja', type: 'expense' as const, color: '#EC4899', budgetLimit: 400000 }
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

      // 2) Ensure some targets exist
      const existingTargets = await db.targets.toArray();
      let targetIds = existingTargets.map(t => t.id!).filter(Boolean);
      if (targetIds.length === 0) {
        const now = new Date();
        const addedIds = await db.targets.bulkAdd([
          {
            nama: 'Liburan Bali',
            nominalTarget: 5000000,
            bulanMulai: now.getMonth() + 1,
            tahunMulai: now.getFullYear(),
            bulanSelesai: ((now.getMonth() + 1 + 6 - 1) % 12) + 1,
            tahunSelesai: now.getFullYear() + (now.getMonth() + 1 + 6 > 12 ? 1 : 0),
            createdAt: new Date()
          },
          {
            nama: 'Dana Darurat',
            nominalTarget: 10000000,
            bulanMulai: now.getMonth() + 1,
            tahunMulai: now.getFullYear(),
            bulanSelesai: ((now.getMonth() + 1 + 12 - 1) % 12) + 1,
            tahunSelesai: now.getFullYear() + (now.getMonth() + 1 + 12 > 12 ? 1 : 0),
            createdAt: new Date()
          }
        ], { allKeys: true } as any);
        // Dexie returns keys if allKeys supported; fallback get again
        const refreshed = await db.targets.toArray();
        targetIds = refreshed.map(t => t.id!).filter(Boolean);
      }

      const anyTargetId = targetIds[0];

      // 3) Append transactions in current bulan/tahun
      const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      const dateStr = (d: number) => `${tahun}-${pad2(bulan)}-${pad2(d)}`;

      const tx = [
        { type: 'income', amount: 5000000, description: 'Gaji Bulanan', category: 'Gaji', date: dateStr(1) },
        { type: 'income', amount: 1500000, description: 'Proyek Website', category: 'Freelance', date: dateStr(3) },
        { type: 'expense', amount: 45000, description: 'Sarapan', category: 'Makanan', date: dateStr(2) },
        { type: 'expense', amount: 60000, description: 'Transport Online', category: 'Transport', date: dateStr(4) },
        { type: 'expense', amount: 120000, description: 'Belanja Harian', category: 'Belanja', date: dateStr(5) },
        { type: 'expense', amount: 80000, description: 'Nonton', category: 'Hiburan', date: dateStr(6) },
        { type: 'expense', amount: 70000, description: 'Makan Malam', category: 'Makanan', date: dateStr(8) },
        { type: 'expense', amount: 150000, description: 'Isi Bensin', category: 'Transport', date: dateStr(10) },
        { type: 'income', amount: 1000000, description: 'Project Design', category: 'Freelance', date: dateStr(12) },
        { type: 'expense', amount: 250000, description: 'Belanja Pakaian', category: 'Belanja', date: dateStr(15) },
        { type: 'income', amount: 500000, description: 'Bonus Kecil', category: 'Gaji', date: dateStr(16) },
        { type: 'expense', amount: 95000, description: 'Makan Siang', category: 'Makanan', date: dateStr(17) },
        { type: 'expense', amount: 40000, description: 'Parkir & Tol', category: 'Transport', date: dateStr(18) },
        { type: 'transfer_to_target', amount: 300000, description: 'Setor ke Target', category: 'Transfer ke Target', date: dateStr(19), targetId: anyTargetId },
        { type: 'expense', amount: 150000, description: 'Nongkrong', category: 'Hiburan', date: dateStr(20) }
      ] as const;

      await db.transactions.bulkAdd(tx.map(t => ({
        type: t.type as any,
        amount: t.amount,
        description: t.description,
        category: t.type === 'transfer_to_target' ? 'Transfer ke Target' : t.category,
        date: t.date,
        targetId: (t as any).targetId,
        createdAt: new Date()
      })));

      toast({
        title: 'Data Demo Ditambahkan',
        description: `Kategori, target, dan transaksi contoh ditambahkan untuk ${getMonthName(bulan)} ${tahun}.`,
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
        
        // Validate and normalize data structure
        // Tolerant parsing: support various shapes and partial content
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

        // If everything is empty, reject
        if (txArray.length === 0 && catArray.length === 0 && settingsArray.length === 0) {
          throw new Error('Invalid backup file format');
        }

        const normalizeTransactions = txArray.map((t: any) => ({
          type: t.type,
          amount: typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount),
          description: t.description || '',
          category: t.category || (t.type === 'transfer_to_target' ? 'Transfer ke Target' : ''),
          date: t.date,
          targetId: t.targetId ?? (t.target_id ?? undefined),
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

        // Clear existing data and import
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

  // Load email configuration
  React.useEffect(() => {
    const loadEmailConfig = async () => {
      try {
        const config = await emailService.loadConfig();
        setEmailConfig(config);
        setEmailForm(config);
      } catch (error) {
        console.error('Error loading email config:', error);
      }
    };
    loadEmailConfig();
  }, []);

  const handleEditEmail = () => {
    setEmailForm(emailConfig);
    setEditingEmail(true);
  };

  const handleSaveEmail = async () => {
    try {
      await emailService.saveConfig(emailForm);
      setEmailConfig(emailForm);
      setEditingEmail(false);
      toast({
        title: "Pengaturan Email Berhasil Disimpan",
        description: "Konfigurasi notifikasi email telah diperbarui.",
      });
    } catch (error) {
      toast({
        title: "Gagal Menyimpan Pengaturan Email",
        description: "Terjadi kesalahan saat menyimpan konfigurasi email.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEmailEdit = () => {
    setEditingEmail(false);
    setEmailForm(emailConfig);
  };

  const handleTestEmail = async () => {
    try {
      const isValid = await emailService.testConnection();
      if (isValid) {
        toast({
          title: "Konfigurasi Email Valid",
          description: "Pengaturan email sudah benar dan siap digunakan.",
        });
      } else {
        toast({
          title: "Konfigurasi Email Tidak Lengkap",
          description: "Harap lengkapi semua field yang diperlukan.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error Testing Email",
        description: "Terjadi kesalahan saat mengetes konfigurasi email.",
        variant: "destructive",
      });
    }
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

      {/* Email Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Notifikasi Email
          </CardTitle>
          <CardDescription>
            Konfigurasi email untuk menerima notifikasi otomatis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {editingEmail ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="email-enabled"
                  checked={emailForm.enabled}
                  onCheckedChange={(enabled) => setEmailForm(prev => ({ ...prev, enabled }))}
                />
                <Label htmlFor="email-enabled">Aktifkan notifikasi email</Label>
              </div>

              {emailForm.enabled && (
                <>
                  <div>
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={emailForm.smtpHost || ''}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, smtpHost: e.target.value }))}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={emailForm.smtpPort || 587}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, smtpPort: parseInt(e.target.value) }))}
                      placeholder="587"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpUser">Email/Username</Label>
                    <Input
                      id="smtpUser"
                      type="email"
                      value={emailForm.smtpUser || ''}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, smtpUser: e.target.value }))}
                      placeholder="your.email@gmail.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpPassword">Password/App Password</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      value={emailForm.smtpPassword || ''}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, smtpPassword: e.target.value }))}
                      placeholder="Password atau App Password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fromEmail">Email Pengirim</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      value={emailForm.fromEmail || ''}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, fromEmail: e.target.value }))}
                      placeholder="noreply@example.com"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSaveEmail} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Simpan
                </Button>
                <Button variant="outline" onClick={handleCancelEmailEdit}>
                  Batal
                </Button>
                {emailForm.enabled && (
                  <Button variant="outline" onClick={handleTestEmail} className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Test Koneksi
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">
                    Status: {emailConfig.enabled ? '✅ Aktif' : '❌ Tidak Aktif'}
                  </h3>
                  {emailConfig.enabled && emailConfig.smtpHost && (
                    <p className="text-sm text-gray-600">Host: {emailConfig.smtpHost}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Notifikasi untuk: peringatan anggaran, target tercapai, laporan bulanan
                  </p>
                </div>
                <Button onClick={handleEditEmail} variant="outline">
                  Konfigurasi Email
                </Button>
              </div>

              <div className="bg-blue-50 rounded-lg p-3">
                <h4 className="font-medium text-blue-800 mb-2">💡 Tips Konfigurasi Email:</h4>
                <ul className="list-disc list-inside space-y-1 text-blue-700 text-sm">
                  <li>Untuk Gmail, gunakan App Password bukan password biasa</li>
                  <li>Aktifkan 2-Factor Authentication dan buat App Password di akun Google</li>
                  <li>SMTP Host Gmail: smtp.gmail.com, Port: 587</li>
                  <li>Notifikasi akan dikirim ke email yang terdaftar di profil</li>
                </ul>
              </div>
            </div>
          )}
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

          {/* Demo Data Seed */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Isi Data Demo</h3>
              <p className="text-sm text-gray-600">Tambahkan kategori, target, dan 15 transaksi contoh (append)</p>
            </div>
            <Button onClick={handleSeedDemoAppend} disabled={isSeeding}>
              {isSeeding ? 'Menambahkan...' : 'Isi Data Demo'}
            </Button>
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
