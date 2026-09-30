/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * electron/main.js
 * Electron Main Process for Windows Desktop (.exe) / Desktop App.
 * Handles:
 * - Native frameless window with custom titlebar
 * - Immutable Hardware Machine ID (Motherboard UUID) detection for single-device lock
 * - Silent direct print IPC bridge for Epson L8050/L805 PVC Card Trays and A4 printers
 */

const { app, BrowserWindow, ipcMain, nativeTheme } = require('electron');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

let mainWindow = null;

/**
 * Retrieves the hardware motherboard/system UUID to enforce single-device active session lock.
 */
function getSystemHardwareUUID() {
  try {
    let rawId = '';
    if (process.platform === 'win32') {
      // Windows: Query BIOS / Motherboard UUID
      rawId = execSync('wmic csproduct get uuid', { encoding: 'utf8', timeout: 3000 })
        .replace(/UUID/g, '')
        .trim();
    } else if (process.platform === 'darwin') {
      // macOS: IOPlatformUUID
      rawId = execSync('ioreg -d2 -c IOPlatformExpertDevice | awk -F\\" \'/IOPlatformUUID/{print $(NF-1)}\'', {
        encoding: 'utf8',
        timeout: 3000,
      }).trim();
    } else {
      // Linux: machine-id
      rawId = execSync('cat /etc/machine-id || cat /var/lib/dbus/machine-id', {
        encoding: 'utf8',
        timeout: 3000,
      }).trim();
    }

    if (rawId && rawId.length > 5) {
      return crypto.createHash('sha256').update(rawId).digest('hex');
    }
  } catch (err) {
    console.warn('System hardware ID command failed, falling back to network MAC hash:', err.message);
  }

  // Fallback to network interfaces MAC address hash
  const os = require('os');
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const net of ifaces[name] || []) {
      if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
        return crypto.createHash('sha256').update(net.mac).digest('hex');
      }
    }
  }

  return 'hw_fallback_generic_desktop_uuid';
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'NP Print Portal - Ultra-HD 300 DPI Engine',
    backgroundColor: '#09090b',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#09090b',
      symbolColor: '#f4f4f5',
      height: 36,
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });

  nativeTheme.themeSource = 'dark';

  // In production load local dist/index.html; in development load dev server
  const isDev = !app.isPackaged;
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ----------------------------------------------------
// IPC HANDLERS
// ----------------------------------------------------

// 1. Hardware ID Handler (for single-device session lock)
ipcMain.handle('get-hardware-id', () => {
  return getSystemHardwareUUID();
});

// 2. Direct Silent Print Handler
ipcMain.handle('print-direct', async (event, options = {}) => {
  if (!mainWindow) return { success: false, error: 'Window not initialized' };

  return new Promise((resolve) => {
    const printOptions = {
      silent: Boolean(options.silent),
      printBackground: true,
      deviceName: options.deviceName || '',
      color: options.color !== false,
      copies: options.copies || 1,
      margins: options.margins || { marginType: 'none' },
    };

    if (options.pageSize) {
      printOptions.pageSize = options.pageSize;
    }

    mainWindow.webContents.print(printOptions, (success, failureReason) => {
      if (success) {
        resolve({ success: true });
      } else {
        resolve({ success: false, error: failureReason });
      }
    });
  });
});

// 3. Printer Devices Enumeration
ipcMain.handle('get-printers', async () => {
  if (!mainWindow) return [];
  return mainWindow.webContents.getPrintersAsync();
});

// 4. Window Controls
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.on('window-close', () => mainWindow?.close());

// ----------------------------------------------------
// APP LIFECYCLE
// ----------------------------------------------------

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
