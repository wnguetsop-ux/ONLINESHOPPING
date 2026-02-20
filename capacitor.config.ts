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
      '*.firebaseapp.com'
    ]
  }
};

export default config;