import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mastershoppro.app',
  appName: 'Shopmaster',
  webDir: 'out',
  bundledWebRuntime: false,
  server: {
    url: 'https://mastershoppro.com',
    // Forza il sito a restare dentro l'icona dell'app
    allowNavigation: [
      'mastershoppro.com',
      '*.mastershoppro.com',
      '*.stripe.com',
      '*.firebaseapp.com',
      'accounts.google.com' // Necessario per il login Google
    ]
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      // Il tuo Web Client ID (client_type: 3) dal file JSON
      serverClientId: '243302666157-je0b9se443rdv4hkup88bll6vg4ofu3h.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;