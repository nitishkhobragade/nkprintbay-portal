import type { CapacitorConfig } from '@capacitor/cli';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * capacitor.config.ts
 * Mobile APK packaging configuration for NKPrintBay / NP Print Portal.
 * Target: Android 13+ & Mobile WebView.
 */

const config: CapacitorConfig = {
  appId: 'com.nkprintbay.portal',
  appName: 'NKPrintBay',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#09090b',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#09090b',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
