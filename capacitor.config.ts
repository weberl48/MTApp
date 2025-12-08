import type { CapacitorConfig } from '@capacitor/cli';

// Your deployed Vercel URL - UPDATE THIS to your actual URL
const PRODUCTION_URL = 'https://maycreativearts.vercel.app';

const config: CapacitorConfig = {
  appId: 'com.maycreativearts.manager',
  appName: 'MCA Manager',
  webDir: '.next',
  server: {
    // Always load from the deployed Vercel URL for mobile builds
    url: PRODUCTION_URL,
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1e40af',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#ffffff',
    },
  },
};

export default config;
