import { useState, useEffect, useCallback } from 'react';
import { db } from '../services/database';
import { toast } from 'sonner';

export interface UserSettings {
  userName: string;
  userEmail?: string;
  profilePicture?: string;
}

export const useUserSettings = () => {
  const [userSettings, setUserSettings] = useState<UserSettings>({
    userName: 'Pengguna'
  });
  const [loading, setLoading] = useState(true);

  const loadUserSettings = useCallback(async () => {
    setLoading(true);
    try {
      const settings = await db.settings.toArray();
      const userNameSetting = settings.find(s => s.key === 'userName');
      const userEmailSetting = settings.find(s => s.key === 'userEmail');
      const profilePictureSetting = settings.find(s => s.key === 'profilePicture');

      setUserSettings({
        userName: userNameSetting?.value || 'Pengguna',
        userEmail: userEmailSetting?.value || '',
        profilePicture: profilePictureSetting?.value || ''
      });
    } catch (error) {
      console.error('Error loading user settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    try {
      // Update each setting in the database
      for (const [key, value] of Object.entries(newSettings)) {
        const existingSetting = await db.settings.where('key').equals(key).first();
        
        if (existingSetting) {
          await db.settings.update(existingSetting.id!, { value });
        } else {
          await db.settings.add({ key, value });
        }
      }

      // Update local state
      setUserSettings(prev => ({ ...prev, ...newSettings }));
      
      toast.success('Pengaturan profil berhasil disimpan');
    } catch (error) {
      console.error('Error updating user settings:', error);
      toast.error('Gagal menyimpan pengaturan profil');
      throw error;
    }
  }, []);

  useEffect(() => {
    loadUserSettings();
  }, [loadUserSettings]);

  return {
    userSettings,
    loading,
    updateUserSettings,
    loadUserSettings
  };
};
