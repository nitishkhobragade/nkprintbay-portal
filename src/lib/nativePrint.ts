/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * lib/nativePrint.ts
 * Native & Direct Silent Print Utilities for Desktop (Electron) & Mobile (Capacitor APK).
 * Provides printer hardware profiles (Epson L8050/L805 PVC tray, Canon, Standard A4)
 * and seamless environment detection.
 */

// Window extension for Electron and Capacitor APIs
declare global {
  interface Window {
    electronAPI?: {
      printDirect: (options: DirectPrintOptions) => Promise<{ success: boolean; error?: string }>;
      getPrinters: () => Promise<Array<{ name: string; isDefault: boolean; status: number }>>;
      getHardwareId: () => Promise<string>;
      minimize: () => void;
      maximize: () => void;
      close: () => void;
    };
    Capacitor?: {
      isNativePlatform: () => boolean;
      getPlatform: () => string;
    };
  }
}

export type PlatformEnvironment = 'electron-desktop' | 'capacitor-android' | 'standard-browser';

export interface PrinterHardwarePreset {
  id: string;
  name: string;
  category: 'pvc-card' | 'document-a4' | 'thermal-receipt';
  description: string;
  mediaSize: {
    widthMm: number;
    heightMm: number;
    name: string;
  };
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  silentRecommended: boolean;
}

export const PRINTER_HARDWARE_PRESETS: PrinterHardwarePreset[] = [
  {
    id: 'epson-l8050-pvc-tray',
    name: 'Epson L8050 / L805 (Dual PVC Card Tray)',
    category: 'pvc-card',
    description: 'Direct PVC tray slot for 2 CR80 cards simultaneously (85.6 × 54.0 mm, Zero Margin).',
    mediaSize: {
      widthMm: 85.6,
      heightMm: 53.98,
      name: 'Custom.CR80',
    },
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    silentRecommended: true,
  },
  {
    id: 'canon-g-series-card',
    name: 'Canon Pixma G-Series (ID Card Slot)',
    category: 'pvc-card',
    description: 'Dedicated ID card multi-tray for Canon inkjet printers.',
    mediaSize: {
      widthMm: 85.6,
      heightMm: 54.0,
      name: 'Custom.Card',
    },
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    silentRecommended: true,
  },
  {
    id: 'standard-a4-borderless',
    name: 'Standard A4 Document (Borderless 300 DPI)',
    category: 'document-a4',
    description: 'Standard 210 × 297 mm paper for Epson, HP, Canon, and Brother printers.',
    mediaSize: {
      widthMm: 210,
      heightMm: 297,
      name: 'A4',
    },
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    silentRecommended: false,
  },
  {
    id: 'thermal-pos-80mm',
    name: 'Thermal POS Receipt (80mm Roll)',
    category: 'thermal-receipt',
    description: 'Instant customer acknowledgment receipt with QR code verification.',
    mediaSize: {
      widthMm: 80,
      heightMm: 120,
      name: 'Custom.Thermal80',
    },
    margins: { top: 2, bottom: 2, left: 2, right: 2 },
    silentRecommended: true,
  },
];

export interface DirectPrintOptions {
  silent?: boolean;
  deviceName?: string;
  pageSize?: 'A4' | 'Letter' | { width: number; height: number };
  margins?: {
    marginType: 'none' | 'default' | 'printableArea';
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  color?: boolean;
  copies?: number;
  dpi?: number;
}

/**
 * Detects the runtime environment: Electron Desktop, Capacitor Android APK, or Standard Browser.
 */
export function detectEnvironment(): PlatformEnvironment {
  if (typeof window === 'undefined') return 'standard-browser';

  // 1. Check Electron
  if (
    Boolean(window.electronAPI) ||
    window.navigator.userAgent.toLowerCase().includes('electron') ||
    Boolean((window as any).process?.versions?.electron)
  ) {
    return 'electron-desktop';
  }

  // 2. Check Capacitor
  if (
    Boolean(window.Capacitor?.isNativePlatform()) ||
    window.navigator.userAgent.toLowerCase().includes('capacitor') ||
    window.location.protocol === 'capacitor:'
  ) {
    return 'capacitor-android';
  }

  return 'standard-browser';
}

/**
 * Retrieves the hardware device fingerprint:
 * - If running in Electron: uses native CPU/Motherboard UUID via IPC
 * - If running in Capacitor/Browser: uses crypto UUID persisted in localStorage
 */
export async function getHardwareDeviceUUID(): Promise<string> {
  const env = detectEnvironment();

  if (env === 'electron-desktop' && window.electronAPI?.getHardwareId) {
    try {
      const hwId = await window.electronAPI.getHardwareId();
      if (hwId) return hwId;
    } catch (e) {
      console.warn('Failed to retrieve native hardware ID:', e);
    }
  }

  // Browser / Mobile Fallback
  const STORAGE_KEY = 'np_device_hardware_uuid';
  let stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    stored = `hw_${env.slice(0, 3)}_${crypto.randomUUID()}`;
    localStorage.setItem(STORAGE_KEY, stored);
  }
  return stored;
}

/**
 * Executes direct native print with hardware preset configuration:
 * In Electron: silently sends buffer to printer driver bypassing OS dialog
 * In Browser/Capacitor: mounts zero-margin print container and triggers calibrated print
 */
export async function executeNativePrint(
  canvas: HTMLCanvasElement,
  presetId = 'standard-a4-borderless',
  customOptions?: DirectPrintOptions
): Promise<{ success: boolean; message: string }> {
  const env = detectEnvironment();
  const preset = PRINTER_HARDWARE_PRESETS.find((p) => p.id === presetId) || PRINTER_HARDWARE_PRESETS[2];
  const dataUrl = canvas.toDataURL('image/png');

  // CASE 1: Electron Desktop Silent Print
  if (env === 'electron-desktop' && window.electronAPI?.printDirect) {
    try {
      const result = await window.electronAPI.printDirect({
        silent: customOptions?.silent ?? preset.silentRecommended,
        deviceName: customOptions?.deviceName,
        pageSize: {
          width: preset.mediaSize.widthMm * 1000, // microns
          height: preset.mediaSize.heightMm * 1000,
        },
        margins: {
          marginType: 'none',
        },
        color: true,
        copies: customOptions?.copies || 1,
      });

      if (result.success) {
        return { success: true, message: `Sent to ${preset.name} (Silent Direct Print)` };
      } else {
        throw new Error(result.error || 'Electron print error');
      }
    } catch (err: any) {
      console.warn('Direct print fallback to standard dialog:', err.message);
    }
  }

  // CASE 2: Browser & Capacitor Android Fallback
  return new Promise((resolve) => {
    let printContainer = document.getElementById('native-print-mount');
    if (!printContainer) {
      printContainer = document.createElement('div');
      printContainer.id = 'native-print-mount';
      printContainer.className = 'print-only-container';
      document.body.appendChild(printContainer);
    }

    printContainer.innerHTML = `
      <img
        src="${dataUrl}"
        alt="Print Document"
        style="width: 100%; max-width: ${preset.mediaSize.widthMm}mm; height: auto; margin: 0 auto; display: block; image-rendering: -webkit-optimize-contrast;"
      />
    `;

    const img = printContainer.querySelector('img');
    const trigger = () => {
      window.print();
      resolve({
        success: true,
        message: `Print dialog opened with 1:1 scale for ${preset.name}`,
      });
    };

    if (img && !img.complete) {
      img.onload = trigger;
    } else {
      trigger();
    }
  });
}
