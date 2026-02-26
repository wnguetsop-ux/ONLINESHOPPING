import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mastershoppro.app',
  appName: 'Shopmaster',
  webDir: 'out',
  bundledWebRuntime: false,
  server: {
    // url: 'https://mastershoppro.com',  // ← COMMENTÉ pour dev local
    allowNavigation: [
      'mastershoppro.com',
      '*.mastershoppro.com',
      '*.stripe.com',
      '*.firebaseapp.com',
      'accounts.google.com'
    ]
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '243302666157-je0b9se443rdv4hkup88bll6vg4ofu3h.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;