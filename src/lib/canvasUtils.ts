/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ultra-HD Document & ID Card Processing Engine
 * High-performance Canvas & Computer Vision utilities for 300 DPI print rendering.
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  try {
    // Prefer unpkg/cdnjs CDN matching current version or local worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn('PDF.js worker initialization warning:', e);
  }
}

// ==========================================
// CONSTANTS & PRINT DIMENSIONS
// ==========================================

export const DPI_300 = 300;
export const MM_PER_INCH = 25.4;

// Standard CR80 Card Dimensions (ISO/IEC 7810 ID-1: 85.60mm x 53.98mm)
export const CR80_WIDTH_MM = 85.6;
export const CR80_HEIGHT_MM = 53.98;
export const CR80_ASPECT_RATIO = CR80_WIDTH_MM / CR80_HEIGHT_MM; // ~1.58577

// At 300 DPI:
// Width:  (85.6 / 25.4) * 300 = 1011.02 -> 1012 px
// Height: (53.98 / 25.4) * 300 = 637.56 -> 638 px
export const CR80_WIDTH_PX = 1012;
export const CR80_HEIGHT_PX = 638;

// Standard ISO A4 Dimensions: 210mm x 297mm
// At 300 DPI:
// Width:  (210 / 25.4) * 300 = 2480 px
// Height: (297 / 25.4) * 300 = 3508 px
export const A4_WIDTH_PX = 2480;
export const A4_HEIGHT_PX = 3508;
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

export interface Point2D {
  x: number;
  y: number;
}

export type Quadrilateral = [Point2D, Point2D, Point2D, Point2D]; // [TL, TR, BR, BL]

export interface NormalizedRect {
  x: number;      // 0.0 - 1.0 (relative to source width)
  y: number;      // 0.0 - 1.0 (relative to source height)
  width: number;  // 0.0 - 1.0
  height: number; // 0.0 - 1.0
}

export interface PresetCardLayout {
  id: string;
  name: string;
  description: string;
  front: NormalizedRect;
  back: NormalizedRect;
}

// Built-in standard coordinate presets for official PDF formats
export const DOCUMENT_PRESETS: PresetCardLayout[] = [
  {
    id: 'aadhaar-letter',
    name: 'Aadhaar Letter (Standard e-Aadhaar)',
    description: 'Bottom strip extraction: Left is Front (Photo & UID), Right is Back (Address & QR).',
    front: { x: 0.048, y: 0.672, width: 0.438, height: 0.282 },
    back: { x: 0.514, y: 0.672, width: 0.438, height: 0.282 },
  },
  {
    id: 'pan-ecard',
    name: 'e-PAN Card (NSDL / UTIITSL)',
    description: 'Bottom half split: Left Front (Photo & PAN), Right Back (QR Code & Hologram).',
    front: { x: 0.062, y: 0.678, width: 0.428, height: 0.272 },
    back: { x: 0.510, y: 0.678, width: 0.428, height: 0.272 },
  },
  {
    id: 'voter-epic',
    name: 'e-EPIC (Voter ID Card)',
    description: 'Standard election commission e-EPIC split page.',
    front: { x: 0.075, y: 0.585, width: 0.415, height: 0.365 },
    back: { x: 0.510, y: 0.585, width: 0.415, height: 0.365 },
  },
  {
    id: 'driving-license',
    name: 'Driving License / Smart Card',
    description: 'Center dual card layout.',
    front: { x: 0.08, y: 0.40, width: 0.41, height: 0.26 },
    back: { x: 0.51, y: 0.40, width: 0.41, height: 0.26 },
  },
  {
    id: 'custom-card',
    name: 'Custom / Full Manual Area',
    description: 'Interactive selection boxes for custom documents.',
    front: { x: 0.05, y: 0.20, width: 0.44, height: 0.28 },
    back: { x: 0.51, y: 0.20, width: 0.44, height: 0.28 },
  }
];

// ==========================================
// 1. UNIFIED INPUT HANDLING: PDF & IMAGES
// ==========================================

export interface RenderPdfResult {
  canvas: HTMLCanvasElement;
  pageCount: number;
  width: number;
  height: number;
  scale: number;
}

/**
 * Renders a PDF page to an HTML5 canvas at True 300 DPI.
 * Standard PDF points are 72 DPI; scale factor 300 / 72 = ~4.166667 ensure crystal clarity.
 */
export async function renderPdfToCanvas(
  pdfData: ArrayBuffer | Uint8Array,
  pageNumber = 1,
  targetDpi = DPI_300
): Promise<RenderPdfResult> {
  // Ensure PDF.js worker
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  }

  const loadingTask = pdfjsLib.getDocument({
    data: pdfData,
    cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
    cMapPacked: true,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const validPageNum = Math.min(Math.max(1, pageNumber), numPages);
  const page = await pdfDoc.getPage(validPageNum);

  // Default viewport is 72 DPI
  const unscaledViewport = page.getViewport({ scale: 1.0 });
  const scale = targetDpi / 72; // ~4.1667x
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);

  const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: false });
  if (!ctx) {
    throw new Error('Failed to create canvas 2D context');
  }

  // Paint white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Render high-res PDF into canvas
  const renderContext = {
    canvasContext: ctx,
    viewport: viewport,
    canvas: canvas,
  };

  await page.render(renderContext).promise;

  return {
    canvas,
    pageCount: numPages,
    width: canvas.width,
    height: canvas.height,
    scale,
  };
}

/**
 * Loads an image from a File, Blob, or URL into an HTMLImageElement.
 */
export function loadImage(source: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image source'));

    if (typeof source === 'string') {
      img.src = source;
    } else {
      img.src = URL.createObjectURL(source);
    }
  });
}

// ==========================================
// 2. AUTO-DETECTION, CROPPING & DESKEWING
// ==========================================

/**
 * Automatically detects the card boundary in a raw mobile photo or scan.
 * Uses adaptive luminance thresholding and edge corner analysis.
 * Returns the 4 corner points [TL, TR, BR, BL] scaled to the original image dimensions.
 */
export function detectCardCorners(
  sourceCanvas: HTMLCanvasElement | HTMLImageElement,
  aspectRatioTarget = CR80_ASPECT_RATIO
): Quadrilateral {
  const origW = 'width' in sourceCanvas ? sourceCanvas.width : (sourceCanvas as HTMLImageElement).naturalWidth;
  const origH = 'height' in sourceCanvas ? sourceCanvas.height : (sourceCanvas as HTMLImageElement).naturalHeight;

  // Process on a downscaled working canvas for fast computer vision operations
  const MAX_PROC_DIM = 640;
  const scaleDown = Math.min(1.0, MAX_PROC_DIM / Math.max(origW, origH));
  const procW = Math.max(100, Math.round(origW * scaleDown));
  const procH = Math.max(100, Math.round(origH * scaleDown));

  const cvCanvas = document.createElement('canvas');
  cvCanvas.width = procW;
  cvCanvas.height = procH;
  const cvCtx = cvCanvas.getContext('2d', { willReadFrequently: true });
  if (!cvCtx) {
    return getDefaultQuad(origW, origH);
  }

  cvCtx.drawImage(sourceCanvas, 0, 0, procW, procH);
  const imgData = cvCtx.getImageData(0, 0, procW, procH);
  const data = imgData.data;

  // 1. Grayscale & Luminance Buffer
  const gray = new Float32Array(procW * procH);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    gray[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  // 2. Compute Sobel Edge Gradients
  const edges = new Float32Array(procW * procH);
  let maxEdge = 0;
  for (let y = 1; y < procH - 1; y++) {
    for (let x = 1; x < procW - 1; x++) {
      const idx = y * procW + x;
      // Horizontal gradient
      const gx =
        -gray[idx - procW - 1] + gray[idx - procW + 1] -
        2 * gray[idx - 1] + 2 * gray[idx + 1] -
        gray[idx + procW - 1] + gray[idx + procW + 1];
      // Vertical gradient
      const gy =
        -gray[idx - procW - 1] - 2 * gray[idx - procW] - gray[idx - procW + 1] +
        gray[idx + procW - 1] + 2 * gray[idx + procW] + gray[idx + procW + 1];

      const mag = Math.hypot(gx, gy);
      edges[idx] = mag;
      if (mag > maxEdge) maxEdge = mag;
    }
  }

  // 3. Adaptive Thresholding to extract candidate card edge points
  const edgeThreshold = Math.max(25, maxEdge * 0.22);
  const edgePoints: Point2D[] = [];

  // Exclude immediate image borders (outer 4%) to prevent picking up frame boundaries
  const borderMarginX = Math.round(procW * 0.04);
  const borderMarginY = Math.round(procH * 0.04);

  for (let y = borderMarginY; y < procH - borderMarginY; y += 2) {
    for (let x = borderMarginX; x < procW - borderMarginX; x += 2) {
      const idx = y * procW + x;
      if (edges[idx] > edgeThreshold) {
        edgePoints.push({ x, y });
      }
    }
  }

  // If insufficient edge points were found, fallback to centered standard card
  if (edgePoints.length < 80) {
    return getDefaultQuad(origW, origH);
  }

  // 4. Find Extreme Quadrilateral Corners
  // Top-Left: minimizes (x + y)
  // Top-Right: maximizes (x - y)
  // Bottom-Right: maximizes (x + y)
  // Bottom-Left: minimizes (x - y)
  let tl = edgePoints[0];
  let tr = edgePoints[0];
  let br = edgePoints[0];
  let bl = edgePoints[0];

  let minSum = tl.x + tl.y;
  let maxSum = br.x + br.y;
  let maxDiff = tr.x - tr.y;
  let minDiff = bl.x - bl.y;

  for (let i = 1; i < edgePoints.length; i++) {
    const pt = edgePoints[i];
    const sum = pt.x + pt.y;
    const diff = pt.x - pt.y;

    if (sum < minSum) {
      minSum = sum;
      tl = pt;
    }
    if (sum > maxSum) {
      maxSum = sum;
      br = pt;
    }
    if (diff > maxDiff) {
      maxDiff = diff;
      tr = pt;
    }
    if (diff < minDiff) {
      minDiff = diff;
      bl = pt;
    }
  }

  // Validate geometry: Check if detected quad has reasonable area & aspect ratio
  const widthTop = Math.hypot(tr.x - tl.x, tr.y - tl.y);
  const widthBottom = Math.hypot(br.x - bl.x, br.y - bl.y);
  const heightLeft = Math.hypot(bl.x - tl.x, bl.y - tl.y);
  const heightRight = Math.hypot(br.x - tr.x, br.y - tr.y);

  const avgWidth = (widthTop + widthBottom) / 2;
  const avgHeight = (heightLeft + heightRight) / 2;
  const detectedAspect = avgWidth / Math.max(1, avgHeight);

  // If detected aspect is wildly off (less than 1.1 or greater than 2.3) or too small, use default
  if (
    avgWidth < procW * 0.25 ||
    avgHeight < procH * 0.2 ||
    detectedAspect < 1.1 ||
    detectedAspect > 2.3
  ) {
    return getDefaultQuad(origW, origH);
  }

  // Scale back up to original image dimensions
  const invScale = 1.0 / scaleDown;
  return [
    { x: Math.round(tl.x * invScale), y: Math.round(tl.y * invScale) },
    { x: Math.round(tr.x * invScale), y: Math.round(tr.y * invScale) },
    { x: Math.round(br.x * invScale), y: Math.round(br.y * invScale) },
    { x: Math.round(bl.x * invScale), y: Math.round(bl.y * invScale) },
  ];
}

/**
 * Returns a fallback default centered CR80 card bounding quad.
 */
export function getDefaultQuad(width: number, height: number): Quadrilateral {
  // Use ~75% of available width or height fitting CR80 ratio
  let cardW = width * 0.76;
  let cardH = cardW / CR80_ASPECT_RATIO;

  if (cardH > height * 0.85) {
    cardH = height * 0.85;
    cardW = cardH * CR80_ASPECT_RATIO;
  }

  const left = Math.round((width - cardW) / 2);
  const top = Math.round((height - cardH) / 2);
  const right = Math.round(left + cardW);
  const bottom = Math.round(top + cardH);

  return [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
  ];
}

/**
 * Extracts a normalized rectangular section [x, y, width, height] from a source canvas
 * and normalizes it to target CR80 print dimensions (1012 x 638 px @ 300 DPI).
 */
export function cropRectToCard(
  sourceCanvas: HTMLCanvasElement,
  rect: NormalizedRect,
  targetWidth = CR80_WIDTH_PX,
  targetHeight = CR80_HEIGHT_PX
): HTMLCanvasElement {
  const destCanvas = document.createElement('canvas');
  destCanvas.width = targetWidth;
  destCanvas.height = targetHeight;
  const ctx = destCanvas.getContext('2d', { willReadFrequently: true, alpha: false });

  if (!ctx) return destCanvas;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const srcX = Math.round(rect.x * sourceCanvas.width);
  const srcY = Math.round(rect.y * sourceCanvas.height);
  const srcW = Math.round(rect.width * sourceCanvas.width);
  const srcH = Math.round(rect.height * sourceCanvas.height);

  ctx.drawImage(
    sourceCanvas,
    srcX, srcY, srcW, srcH,
    0, 0, targetWidth, targetHeight
  );

  return destCanvas;
}

/**
 * Performs true perspective transformation (homography warp/deskew) from an arbitrary
 * 4-corner quadrilateral to exact CR80 1012x638 canvas.
 * Uses high-precision piece-wise triangle affine mapping for GPU/Canvas-accelerated warping.
 */
export function warpQuadrilateralToCard(
  sourceCanvas: HTMLCanvasElement | HTMLImageElement,
  quad: Quadrilateral,
  targetWidth = CR80_WIDTH_PX,
  targetHeight = CR80_HEIGHT_PX
): HTMLCanvasElement {
  const destCanvas = document.createElement('canvas');
  destCanvas.width = targetWidth;
  destCanvas.height = targetHeight;
  const ctx = destCanvas.getContext('2d', { willReadFrequently: true, alpha: false });
  if (!ctx) return destCanvas;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const [p0, p1, p2, p3] = quad; // TL, TR, BR, BL

  // Warp Quad using 2 affine triangles (TL-TR-BL and TR-BR-BL)
  // Triangle 1: Destination: (0,0), (targetWidth, 0), (0, targetHeight)
  //             Source:      p0,    p1,               p3
  warpTriangle(ctx, sourceCanvas,
    0, 0, targetWidth, 0, 0, targetHeight,
    p0.x, p0.y, p1.x, p1.y, p3.x, p3.y
  );

  // Triangle 2: Destination: (targetWidth, targetHeight), (0, targetHeight), (targetWidth, 0)
  //             Source:      p2,                          p3,                p1
  warpTriangle(ctx, sourceCanvas,
    targetWidth, targetHeight, 0, targetHeight, targetWidth, 0,
    p2.x, p2.y, p3.x, p3.y, p1.x, p1.y
  );

  return destCanvas;
}

/**
 * Warps a single triangle from source image coordinates to canvas destination coordinates
 * using affine transformation matrix.
 */
function warpTriangle(
  ctx: CanvasRenderingContext2D,
  image: HTMLCanvasElement | HTMLImageElement,
  dx0: number, dy0: number, dx1: number, dy1: number, dx2: number, dy2: number,
  sx0: number, sy0: number, sx1: number, sy1: number, sx2: number, sy2: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(dx0, dy0);
  ctx.lineTo(dx1, dy1);
  ctx.lineTo(dx2, dy2);
  ctx.closePath();
  ctx.clip();

  // Compute 2D Affine Transformation Matrix
  // [sx] = [m00 m01 m02] [dx]
  // [sy]   [m10 m11 m12] [dy]
  //  [1]   [ 0   0   1 ] [ 1]
  const denom = (dx0 * (dy1 - dy2) - dx1 * dy0 + dx2 * dy0 + (dx1 - dx2) * dy2);
  if (Math.abs(denom) < 1e-7) {
    ctx.restore();
    return;
  }

  // Direct mapping using matrix inversion:
  const deltaX1 = dx1 - dx0;
  const deltaY1 = dy1 - dy0;
  const deltaX2 = dx2 - dx0;
  const deltaY2 = dy2 - dy0;

  const det = deltaX1 * deltaY2 - deltaX2 * deltaY1;
  if (Math.abs(det) < 1e-7) {
    ctx.restore();
    return;
  }

  const sDeltaX1 = sx1 - sx0;
  const sDeltaY1 = sy1 - sy0;
  const sDeltaX2 = sx2 - sx0;
  const sDeltaY2 = sy2 - sy0;

  const a = (sDeltaX1 * deltaY2 - sDeltaX2 * deltaY1) / det;
  const b = (sDeltaY1 * deltaY2 - sDeltaY2 * deltaY1) / det;
  const c = (deltaX1 * sDeltaX2 - deltaX2 * sDeltaX1) / det;
  const d = (deltaX1 * sDeltaY2 - deltaX2 * sDeltaY1) / det;
  const e = sx0 - a * dx0 - c * dy0;
  const f = sy0 - b * dx0 - d * dy0;

  // Invert affine matrix for ctx.transform(a', b', c', d', e', f')
  const idet = 1 / (a * d - b * c);
  const na = d * idet;
  const nb = -b * idet;
  const nc = -c * idet;
  const nd = a * idet;
  const ne = (c * f - d * e) * idet;
  const nf = (b * e - a * f) * idet;

  ctx.transform(na, nb, nc, nd, ne, nf);
  ctx.drawImage(image, 0, 0);
  ctx.restore();
}

// ==========================================
// 3. ULTRA-HD QUALITY & ENHANCEMENT FILTERS
// ==========================================

export type FilterEnhanceMode = 'clean' | 'unsharp' | 'vibrant' | 'grayscale' | 'photocopy';

export interface FilterOptions {
  mode: FilterEnhanceMode;
  unsharpAmount: number;   // 0.0 - 2.0 (e.g. 0.8)
  contrast: number;        // -50 to +50 (e.g. 15)
  brightness: number;      // -50 to +50 (e.g. 0)
  autoLevels: boolean;     // stretches histogram to clean background
}

export const DEFAULT_FILTER_OPTIONS: FilterOptions = {
  mode: 'unsharp',
  unsharpAmount: 0.75,
  contrast: 12,
  brightness: 4,
  autoLevels: true,
};

/**
 * Applies professional 300 DPI print enhancement filters:
 * - Unsharp Mask for micro-text, QR codes, and signatures
 * - Auto-levels contrast enhancement to turn scanner gray into crisp white paper
 * - Optional grayscale or B&W photocopy thresholding
 */
export function enhanceCardCanvas(
  inputCanvas: HTMLCanvasElement,
  options: FilterOptions = DEFAULT_FILTER_OPTIONS
): HTMLCanvasElement {
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = inputCanvas.width;
  outputCanvas.height = inputCanvas.height;
  const ctx = outputCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return inputCanvas;

  ctx.drawImage(inputCanvas, 0, 0);
  const imgData = ctx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
  const data = imgData.data;
  const w = outputCanvas.width;
  const h = outputCanvas.height;

  // 1. Auto-Levels (Histogram stretch 1st to 99th percentile)
  if (options.autoLevels) {
    applyAutoLevels(data);
  }

  // 2. Brightness & Contrast adjustment
  if (options.brightness !== 0 || options.contrast !== 0) {
    applyBrightnessContrast(data, options.brightness, options.contrast);
  }

  // 3. Mode conversions (Grayscale / Photocopy)
  if (options.mode === 'grayscale') {
    applyGrayscale(data);
  } else if (options.mode === 'photocopy') {
    applyPhotocopyThreshold(data);
  } else if (options.mode === 'vibrant') {
    applyVibrantSaturation(data, 1.25);
  }

  // Put filtered pixels back
  ctx.putImageData(imgData, 0, 0);

  // 4. Unsharp Masking filter
  if ((options.mode === 'unsharp' || options.mode === 'vibrant' || options.mode === 'grayscale') && options.unsharpAmount > 0.05) {
    applyUnsharpMask(ctx, w, h, options.unsharpAmount);
  }

  return outputCanvas;
}

/**
 * Normalizes histogram levels: removes washed out scanner haze and clips outer 1%.
 */
function applyAutoLevels(data: Uint8ClampedArray) {
  // Build histogram of luminance
  const hist = new Uint32Array(256);
  const totalPixels = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    hist[lum]++;
  }

  // Find 1st and 99th percentile
  const lowClipCount = totalPixels * 0.015;
  const highClipCount = totalPixels * 0.985;

  let acc = 0;
  let minLum = 0;
  for (let i = 0; i < 256; i++) {
    acc += hist[i];
    if (acc >= lowClipCount) {
      minLum = i;
      break;
    }
  }

  acc = 0;
  let maxLum = 255;
  for (let i = 0; i < 256; i++) {
    acc += hist[i];
    if (acc >= highClipCount) {
      maxLum = i;
      break;
    }
  }

  if (maxLum <= minLum + 10) return; // avoid division by zero or extreme flats

  const range = maxLum - minLum;
  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    lut[i] = Math.min(255, Math.max(0, Math.round(((i - minLum) / range) * 255)));
  }

  for (let i = 0; i < data.length; i += 4) {
    data[i] = lut[data[i]];
    data[i + 1] = lut[data[i + 1]];
    data[i + 2] = lut[data[i + 2]];
  }
}

function applyBrightnessContrast(data: Uint8ClampedArray, brightness: number, contrast: number) {
  // contrast formula: factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128 + brightness));
    data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128 + brightness));
    data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128 + brightness));
  }
}

function applyGrayscale(data: Uint8ClampedArray) {
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }
}

function applyPhotocopyThreshold(data: Uint8ClampedArray) {
  // Clean high-contrast B&W threshold
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const val = gray > 145 ? 255 : 0;
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }
}

function applyVibrantSaturation(data: Uint8ClampedArray, saturation: number) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    data[i] = Math.min(255, Math.max(0, gray + (r - gray) * saturation));
    data[i + 1] = Math.min(255, Math.max(0, gray + (g - gray) * saturation));
    data[i + 2] = Math.min(255, Math.max(0, gray + (b - gray) * saturation));
  }
}

/**
 * 3x3 High-Pass Unsharp Masking Kernel:
 * [  0, -1,  0 ]
 * [ -1,  5, -1 ]
 * [  0, -1,  0 ]
 */
function applyUnsharpMask(ctx: CanvasRenderingContext2D, width: number, height: number, amount: number) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const src = imgData.data;
  const output = new Uint8ClampedArray(src.length);
  output.set(src);

  const centerWeight = 1 + 4 * amount;
  const edgeWeight = -amount;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const top = ((y - 1) * width + x) * 4;
      const bottom = ((y + 1) * width + x) * 4;
      const left = (y * width + (x - 1)) * 4;
      const right = (y * width + (x + 1)) * 4;

      for (let c = 0; c < 3; c++) {
        const val =
          centerWeight * src[idx + c] +
          edgeWeight * (src[top + c] + src[bottom + c] + src[left + c] + src[right + c]);
        output[idx + c] = Math.min(255, Math.max(0, val));
      }
    }
  }

  imgData.data.set(output);
  ctx.putImageData(imgData, 0, 0);
}

// ==========================================
// 4. A4 PRINT CANVAS ASSEMBLY (300 DPI)
// ==========================================

export type A4LayoutMode = 'side-by-side' | 'stacked' | 'multi-badge';
export type CardBorderStyle = 'solid-hairline' | 'dashed-cut' | 'none';

export interface A4AssemblyOptions {
  layout: A4LayoutMode;
  borderStyle: CardBorderStyle;
  showCuttingMarks: boolean;
  showLabels: boolean;
  gapMm: number;             // Gap between cards in mm (e.g. 4mm standard lamination fold)
  marginTopMm: number;       // Top margin in mm (e.g. 20mm)
  cardWidthPx?: number;      // defaults to 1012 px
  cardHeightPx?: number;     // defaults to 638 px
}

export const DEFAULT_A4_OPTIONS: A4AssemblyOptions = {
  layout: 'side-by-side',
  borderStyle: 'solid-hairline',
  showCuttingMarks: true,
  showLabels: true,
  gapMm: 6,
  marginTopMm: 24,
  cardWidthPx: CR80_WIDTH_PX,
  cardHeightPx: CR80_HEIGHT_PX,
};

/**
 * Assembles Front and Back cropped cards onto a virtual 300 DPI A4 Canvas (2480 x 3508 pixels).
 * Adds professional cutting guides, registration marks, and exact card borders.
 */
export function assembleA4Canvas(
  frontCanvas: HTMLCanvasElement | null,
  backCanvas: HTMLCanvasElement | null,
  options: A4AssemblyOptions = DEFAULT_A4_OPTIONS
): HTMLCanvasElement {
  const a4Canvas = document.createElement('canvas');
  a4Canvas.width = A4_WIDTH_PX;
  a4Canvas.height = A4_HEIGHT_PX;
  const ctx = a4Canvas.getContext('2d', { willReadFrequently: true, alpha: false });
  if (!ctx) return a4Canvas;

  // 1. Fill entire A4 canvas with pure crisp white (#ffffff)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, A4_WIDTH_PX, A4_HEIGHT_PX);

  const cardW = options.cardWidthPx || CR80_WIDTH_PX;
  const cardH = options.cardHeightPx || CR80_HEIGHT_PX;
  const gapPx = Math.round((options.gapMm / MM_PER_INCH) * DPI_300);
  const marginTopPx = Math.round((options.marginTopMm / MM_PER_INCH) * DPI_300);

  let frontPos = { x: 0, y: 0 };
  let backPos = { x: 0, y: 0 };

  if (options.layout === 'side-by-side') {
    // Side-by-side layout: Front on left, Back on right, centered horizontally on A4 sheet
    const totalW = cardW * 2 + gapPx;
    const startX = Math.round((A4_WIDTH_PX - totalW) / 2);
    const startY = marginTopPx;

    frontPos = { x: startX, y: startY };
    backPos = { x: startX + cardW + gapPx, y: startY };
  } else if (options.layout === 'stacked') {
    // Stacked layout: Front on top, Back directly underneath
    const startX = Math.round((A4_WIDTH_PX - cardW) / 2);
    frontPos = { x: startX, y: marginTopPx };
    backPos = { x: startX, y: marginTopPx + cardH + gapPx };
  } else {
    // Multi-badge: 5 cards on A4 sheet simulation (or 2-row duplicate)
    const totalW = cardW * 2 + gapPx;
    const startX = Math.round((A4_WIDTH_PX - totalW) / 2);
    frontPos = { x: startX, y: marginTopPx };
    backPos = { x: startX + cardW + gapPx, y: marginTopPx };
  }

  // 2. Draw Front Card
  if (frontCanvas) {
    ctx.drawImage(frontCanvas, frontPos.x, frontPos.y, cardW, cardH);
    drawCardAdornments(ctx, frontPos.x, frontPos.y, cardW, cardH, 'FRONT', options);
  } else {
    drawPlaceholderCard(ctx, frontPos.x, frontPos.y, cardW, cardH, 'FRONT CARD SLOT');
  }

  // 3. Draw Back Card
  if (backCanvas) {
    ctx.drawImage(backCanvas, backPos.x, backPos.y, cardW, cardH);
    drawCardAdornments(ctx, backPos.x, backPos.y, cardW, cardH, 'BACK', options);
  } else {
    drawPlaceholderCard(ctx, backPos.x, backPos.y, cardW, cardH, 'BACK CARD SLOT');
  }

  // 4. Draw Center Fold Line if side-by-side
  if (options.layout === 'side-by-side' && frontCanvas && backCanvas && options.showCuttingMarks) {
    const foldX = frontPos.x + cardW + Math.round(gapPx / 2);
    ctx.save();
    ctx.strokeStyle = '#cbd5e1';
    ctx.setLineDash([8, 8]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(foldX, frontPos.y - 40);
    ctx.lineTo(foldX, frontPos.y + cardH + 40);
    ctx.stroke();

    // Fold indicator text
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FOLD LINE', foldX, frontPos.y - 50);
    ctx.restore();
  }

  // 5. Draw Sheet Header & Print Scale Verification Rule (20mm scale bar)
  drawPrintCalibrationBar(ctx);

  return a4Canvas;
}

/**
 * Draws precision cutting borders, registration marks, and subtle outside labels.
 */
function drawCardAdornments(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  options: A4AssemblyOptions
) {
  ctx.save();

  // Card Outer Border
  if (options.borderStyle === 'solid-hairline') {
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.strokeRect(x, y, w, h);
  } else if (options.borderStyle === 'dashed-cut') {
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 6]);
    ctx.strokeRect(x, y, w, h);
  }

  // Corner Cutting Marks (Crosshairs / Corner Guides)
  if (options.showCuttingMarks) {
    const markLength = 36;
    const markOffset = 10;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);

    // Top-Left corner
    ctx.beginPath();
    ctx.moveTo(x - markOffset - markLength, y);
    ctx.lineTo(x - markOffset, y);
    ctx.moveTo(x, y - markOffset - markLength);
    ctx.lineTo(x, y - markOffset);
    ctx.stroke();

    // Top-Right corner
    ctx.beginPath();
    ctx.moveTo(x + w + markOffset, y);
    ctx.lineTo(x + w + markOffset + markLength, y);
    ctx.moveTo(x + w, y - markOffset - markLength);
    ctx.lineTo(x + w, y - markOffset);
    ctx.stroke();

    // Bottom-Left corner
    ctx.beginPath();
    ctx.moveTo(x - markOffset - markLength, y + h);
    ctx.lineTo(x - markOffset, y + h);
    ctx.moveTo(x, y + h + markOffset);
    ctx.lineTo(x, y + h + markOffset + markLength);
    ctx.stroke();

    // Bottom-Right corner
    ctx.beginPath();
    ctx.moveTo(x + w + markOffset, y + h);
    ctx.lineTo(x + w + markOffset + markLength, y + h);
    ctx.moveTo(x + w, y + h + markOffset);
    ctx.lineTo(x + w, y + h + markOffset + markLength);
    ctx.stroke();
  }

  // Exterior Label
  if (options.showLabels) {
    ctx.fillStyle = '#64748b';
    ctx.font = '600 24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${label} (85.6 × 54.0 mm)`, x + w / 2, y + h + 38);
  }

  ctx.restore();
}

/**
 * Draws placeholder box if card side is not yet uploaded.
 */
function drawPlaceholderCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string
) {
  ctx.save();
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 8]);
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 28px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, x + w / 2, y + h / 2 - 15);
  ctx.font = '400 20px system-ui, sans-serif';
  ctx.fillText('CR80 300 DPI (1012 × 638 px)', x + w / 2, y + h / 2 + 25);
  ctx.restore();
}

/**
 * Draws a millimeter calibration scale at the bottom of the A4 sheet.
 * Users can verify 100% scale accuracy with a physical ruler before laminating.
 */
function drawPrintCalibrationBar(ctx: CanvasRenderingContext2D) {
  const barY = A4_HEIGHT_PX - 120;
  const barX = Math.round((A4_WIDTH_PX - 1000) / 2);
  const px50mm = Math.round((50 / MM_PER_INCH) * DPI_300); // 591 px for 50mm

  ctx.save();
  ctx.fillStyle = '#475569';
  ctx.font = '500 20px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('NP PRINT PORTAL · 300 DPI ULTRA-HD OUTPUT · 1:1 TRUE SCALE CHECK:', barX, barY - 14);

  // 50mm ruler line
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(barX, barY);
  ctx.lineTo(barX + px50mm, barY);
  // ticks
  ctx.moveTo(barX, barY - 12);
  ctx.lineTo(barX, barY + 12);
  ctx.moveTo(barX + px50mm, barY - 12);
  ctx.lineTo(barX + px50mm, barY + 12);
  ctx.stroke();

  ctx.font = '600 18px system-ui, sans-serif';
  ctx.fillText('50.0 mm (Measure with physical ruler)', barX + px50mm + 20, barY + 6);
  ctx.restore();
}

// ==========================================
// 5. EXPORT & DOWNLOAD UTILITIES
// ==========================================

export function canvasToBlob(canvas: HTMLCanvasElement, mimeType = 'image/png', quality = 1.0): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob conversion failed'));
    }, mimeType, quality);
  });
}

export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement('a');
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Triggers native 1:1 scale browser print dialog.
 */
export function triggerPrintA4(a4Canvas: HTMLCanvasElement) {
  const dataUrl = a4Canvas.toDataURL('image/png');
  
  // Find or create print container
  let printContainer = document.getElementById('a4-print-mount');
  if (!printContainer) {
    printContainer = document.createElement('div');
    printContainer.id = 'a4-print-mount';
    printContainer.className = 'print-only-container hidden';
    document.body.appendChild(printContainer);
  }

  printContainer.innerHTML = `
    <img 
      src="${dataUrl}" 
      class="print-page-canvas" 
      alt="A4 Print Sheet" 
      style="width: 100%; max-width: 210mm; height: auto; margin: 0 auto; display: block;" 
    />
  `;

  // Give DOM a microtick to load image then trigger window.print
  const img = printContainer.querySelector('img');
  if (img) {
    if (img.complete) {
      window.print();
    } else {
      img.onload = () => window.print();
    }
  } else {
    window.print();
  }
}
