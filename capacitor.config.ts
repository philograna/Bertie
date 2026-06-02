import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bertie.app',
  appName: 'Bertie',
  webDir: 'dist',
  ios: {
    contentInset: 'never',
    backgroundColor: '#F6ECC8',
  },
};

export default config;
