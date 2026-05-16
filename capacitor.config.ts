import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mastershoppro.app',
  appName: 'Mastershop',
  webDir: 'out',
  server: {
    url: 'https://www.mastershoppro.com/admin/orders',
    cleartext: false,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;