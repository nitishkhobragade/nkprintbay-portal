/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * electron/preload.js
 * Secure context bridge for Desktop Electron runtime.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  printDirect: (options) => ipcRenderer.invoke('print-direct', options),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  getHardwareId: () => ipcRenderer.invoke('get-hardware-id'),
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
});
