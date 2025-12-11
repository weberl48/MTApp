import type { CapacitorConfig } from '@capacitor/cli';

// Environment-aware configuration
const isProduction = process.env.NODE_ENV === 'production';
const PRODUCTION_URL = 'https://maycreativearts.vercel.app';
const DEVELOPMENT_URL = 'http://localhost:3000';

const config: CapacitorConfig = {
  appId: 'com.maycreativearts.manager',
  appName: 'MCA Manager',
  webDir: '.next',
  server: {
    // Use production URL for builds, localhost for development
    url: isProduction ? PRODUCTION_URL : DEVELOPMENT_URL,
    cleartext: !isProduction, // Allow HTTP only in development
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
