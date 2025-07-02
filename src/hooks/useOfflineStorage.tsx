
import { useState, useEffect } from 'react';

interface OfflineStorageOptions {
  key: string;
  defaultValue: any;
}

export const useOfflineStorage = <T,>({ key, defaultValue }: OfflineStorageOptions) => {
  const [data, setData] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateData = (newData: T) => {
    try {
      setData(newData);
      localStorage.setItem(key, JSON.stringify(newData));
      
      // Also store in IndexedDB as backup for PWA
      if ('indexedDB' in window) {
        const request = indexedDB.open('GajiKuOfflineDB', 1);
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('data')) {
            db.createObjectStore('data');
          }
        };
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['data'], 'readwrite');
          const store = transaction.objectStore('data');
          store.put(newData, key);
        };
      }
    } catch (error) {
      console.error(`Error saving to localStorage key "${key}":`, error);
    }
  };

  // Sync with IndexedDB on mount for PWA persistence
  useEffect(() => {
    if ('indexedDB' in window) {
      const request = indexedDB.open('GajiKuOfflineDB', 1);
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['data'], 'readonly');
        const store = transaction.objectStore('data');
        const getRequest = store.get(key);
        
        getRequest.onsuccess = () => {
          if (getRequest.result && !localStorage.getItem(key)) {
            localStorage.setItem(key, JSON.stringify(getRequest.result));
            setData(getRequest.result);
          }
        };
      };
    }
  }, [key]);

  return {
    data,
    updateData,
    isOnline,
    isOffline: !isOnline
  };
};
