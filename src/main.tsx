import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeDatabase } from './services/database'

import { loadThemeFromSettings } from './utils/theme'

;(async () => {
  // Initialize database and load theme before first paint
  try {
    await initializeDatabase();
    await loadThemeFromSettings();
  } catch (e) {
    // noop
  }

  // Register service worker for PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }

  createRoot(document.getElementById('root')!).render(<App />);
})();
