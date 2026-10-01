/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * src/lib/psdExport.ts
 * High-performance client-side Adobe Photoshop (.PSD) multi-layer export utility.
 */

import { writePsd } from 'ag-psd';

export interface PsdPhotoItem {
  name: string;
  canvas: HTMLCanvasElement;
  left: number;
  top: number;
}

export interface ExportPsdOptions {
  width: number;
  height: number;
  dpi: number;
  photos: PsdPhotoItem[];
  backgroundColor?: string;
  filename?: string;
}

export function exportPassportPsd(options: ExportPsdOptions): void {
  const {
    width,
    height,
    dpi,
    photos,
    backgroundColor = '#ffffff',
    filename = `Passport_Sheet_${Date.now()}.psd`,
  } = options;

  // 1. Create Base Background Layer Canvas
  const bgCanvas = document.createElement('canvas');
  bgCanvas.width = width;
  bgCanvas.height = height;
  const bgCtx = bgCanvas.getContext('2d');
  if (bgCtx) {
    bgCtx.fillStyle = backgroundColor;
    bgCtx.fillRect(0, 0, width, height);
  }

  // 2. Build Layer Hierarchy
  const children: any[] = [
    {
      name: 'Background Sheet',
      canvas: bgCanvas,
      top: 0,
      left: 0,
      opacity: 1,
      blendMode: 'normal',
    },
  ];

  // 3. Add Individual Photo Layers with Coordinates
  photos.forEach((p) => {
    children.push({
      name: p.name,
      canvas: p.canvas,
      top: Math.round(p.top),
      left: Math.round(p.left),
      opacity: 1,
      blendMode: 'normal',
    });
  });

  // 4. Construct PSD Document with Resolution Metadata
  const psdDoc = {
    width,
    height,
    channels: 3,
    bitsPerChannel: 8,
    colorMode: 3, // RGB
    imageResources: {
      resolutionInfo: {
        horizontalResolution: dpi,
        horizontalResolutionUnit: 'PixelsPerInch',
        verticalResolution: dpi,
        verticalResolutionUnit: 'PixelsPerInch',
      },
    },
    children,
  };

  try {
    const buffer = writePsd(psdDoc as any, { generateThumbnail: true });
    const blob = new Blob([buffer], { type: 'image/vnd.adobe.photoshop' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (err) {
    console.error('Failed to generate PSD:', err);
    throw err;
  }
}
