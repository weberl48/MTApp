import type { CapacitorConfig } from '@capacitor/cli';

// For production, set your deployed Vercel URL
const PRODUCTION_URL = process.env.CAPACITOR_SERVER_URL || 'https://your-app.vercel.app';

const config: CapacitorConfig = {
  appId: 'com.maycreativearts.manager',
  appName: 'MCA Manager',
  // For production builds, we load from the Vercel server
  // For local dev, we can use a local build or dev server
  webDir: '.next',
  server: {
    // In production, load from the deployed Vercel URL
    // This means the mobile app is essentially a native wrapper around the web app
    url: process.env.NODE_ENV === 'production' ? PRODUCTION_URL : 'http://localhost:3000',
    // Allow cleartext traffic for development
    cleartext: true,
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
