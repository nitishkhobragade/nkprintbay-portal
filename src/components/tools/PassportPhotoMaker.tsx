/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * components/tools/PassportPhotoMaker.tsx
 * Professional Passport & Visa Photo Grid Generator at 300 DPI.
 * Generates ready-to-print 4x6" and A4 photo sheets (6, 8, 12, 16, 32 copies)
 * with face oval alignment guidelines, optional Name/Date-of-Photo banner, and cutting lines.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Printer,
  Download,
  Sliders,
  Scissors,
  Layers,
  Sparkles,
  RefreshCw,
  Eye,
  Type,
  Maximize2,
  CheckCircle2,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { downloadCanvasAsPng, triggerPrintA4 } from '../../lib/canvasUtils';

export type PaperFormat = '4x6' | 'a4';
export type PassportStandard = 'in-standard' | 'us-visa' | 'stamp-size';

interface PaperDimensions {
  widthPx: number;
  heightPx: number;
  widthMm: number;
  heightMm: number;
  dpi: number;
}

const PAPER_SPECS: Record<PaperFormat, PaperDimensions> = {
  '4x6': {
    widthPx: 1800, // 6 inches * 300 DPI
    heightPx: 1200, // 4 inches * 300 DPI (landscape 4x6)
    widthMm: 152.4,
    heightMm: 101.6,
    dpi: 300,
  },
  'a4': {
    widthPx: 2480,
    heightPx: 3508,
    widthMm: 210,
    heightMm: 297,
    dpi: 300,
  },
};

// Dimensions in mm
const PASSPORT_SIZES: Record<PassportStandard, { name: string; widthMm: number; heightMm: number }> = {
  'in-standard': { name: 'Standard Passport (35 × 45 mm)', widthMm: 35, heightMm: 45 },
  'us-visa': { name: 'US Visa / 2×2 inch (51 × 51 mm)', widthMm: 50.8, heightMm: 50.8 },
  'stamp-size': { name: 'Stamp Size (25 × 30 mm)', widthMm: 25, heightMm: 30 },
};

export default function PassportPhotoMaker() {
  const [paperFormat, setPaperFormat] = useState<PaperFormat>('4x6');
  const [passportStandard, setPassportStandard] = useState<PassportStandard>('in-standard');
  const [photoCount, setPhotoCount] = useState<number>(8); // 6, 8, 12, 16, 32
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [showFaceGuide, setShowFaceGuide] = useState<boolean>(true);
  const [hasBorder, setHasBorder] = useState<boolean>(true);
  const [borderColor, setBorderColor] = useState<string>('#94a3b8'); // light gray hairline
  const [hasNameDateBanner, setHasNameDateBanner] = useState<boolean>(false);
  const [candidateName, setCandidateName] = useState<string>('RAJESH SHARMA');
  const [photoDate, setPhotoDate] = useState<string>(
    new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
  );

  // Crop / Zoom / Pan state for source photo
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Final Output Canvas Ref
  const outputCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load default sample portrait photo on mount
  useEffect(() => {
    generateSamplePortrait();
  }, []);

  const generateSamplePortrait = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d')!;

    // Background gradient (clean studio sky blue / white)
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#f0f9ff');
    grad.addColorStop(1, '#bae6fd');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Shoulders / Dark Suit
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(400, 950, 360, 260, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shirt collar
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(330, 750);
    ctx.lineTo(400, 880);
    ctx.lineTo(470, 750);
    ctx.closePath();
    ctx.fill();

    // Tie
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.moveTo(385, 780);
    ctx.lineTo(415, 780);
    ctx.lineTo(425, 960);
    ctx.lineTo(375, 960);
    ctx.closePath();
    ctx.fill();

    // Neck
    ctx.fillStyle = '#d49b6a';
    ctx.fillRect(350, 620, 100, 140);

    // Head / Face Oval
    ctx.fillStyle = '#e2a77a';
    ctx.beginPath();
    ctx.ellipse(400, 480, 150, 195, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(400, 420, 165, Math.PI, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(345, 470, 14, 8, 0, 0, Math.PI * 2);
    ctx.ellipse(455, 470, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyebrows
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(345, 455, 25, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(455, 455, 25, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    // Nose
    ctx.strokeStyle = '#c48252';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(400, 475);
    ctx.lineTo(395, 525);
    ctx.lineTo(412, 525);
    ctx.stroke();

    // Mouth / Gentle Smile
    ctx.strokeStyle = '#99443a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(400, 565, 30, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    const img = new Image();
    img.src = canvas.toDataURL('image/png');
    img.onload = () => {
      setSourceImage(img);
    };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        setSourceImage(img);
        setZoomLevel(1.0);
        setPanOffset({ x: 0, y: 0 });
      };
    };
    reader.readAsDataURL(file);
  };

  // ----------------------------------------------------
  // GENERATE CROPPED PASSPORT UNIT (Single Photo at 300 DPI)
  // ----------------------------------------------------
  const renderSinglePassportUnit = (): HTMLCanvasElement => {
    const spec = PASSPORT_SIZES[passportStandard];
    // 300 DPI conversion: (mm / 25.4) * 300
    const pW = Math.round((spec.widthMm / 25.4) * 300); // e.g. 413 px for 35mm
    const pH = Math.round((spec.heightMm / 25.4) * 300); // e.g. 531 px for 45mm

    const canvas = document.createElement('canvas');
    canvas.width = pW;
    canvas.height = pH;
    const ctx = canvas.getContext('2d')!;

    // Clean white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pW, pH);

    if (sourceImage) {
      ctx.save();
      // Apply zoom & pan centered
      ctx.translate(pW / 2 + panOffset.x, pH / 2 + panOffset.y);
      ctx.scale(zoomLevel, zoomLevel);

      // Fit aspect ratio
      const imgAspect = sourceImage.width / sourceImage.height;
      const targetAspect = pW / pH;
      let drawW = pW;
      let drawH = pH;

      if (imgAspect > targetAspect) {
        drawH = pH;
        drawW = pH * imgAspect;
      } else {
        drawW = pW;
        drawH = pW / imgAspect;
      }

      ctx.drawImage(sourceImage, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    }

    // Name & Date of Photo (DOP) Strip Banner (SSC/Govt job requirement)
    if (hasNameDateBanner) {
      const bannerH = Math.round(pH * 0.16); // 16% height at bottom
      const bannerY = pH - bannerH;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, bannerY, pW, bannerH);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, bannerY, pW, bannerH);

      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.font = `700 ${Math.round(bannerH * 0.42)}px system-ui, sans-serif`;
      ctx.fillText(candidateName.toUpperCase(), pW / 2, bannerY + bannerH * 0.44);

      ctx.font = `600 ${Math.round(bannerH * 0.35)}px monospace`;
      ctx.fillText(`DOP: ${photoDate}`, pW / 2, bannerY + bannerH * 0.84);
    }

    // Hairline border
    if (hasBorder) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, 0, pW, pH);
    }

    return canvas;
  };

  // ----------------------------------------------------
  // ASSEMBLE COMPLETE PHOTO SHEET (4x6 OR A4)
  // ----------------------------------------------------
  useEffect(() => {
    const outputCanvas = outputCanvasRef.current;
    if (!outputCanvas) return;

    const paper = PAPER_SPECS[paperFormat];
    outputCanvas.width = paper.widthPx;
    outputCanvas.height = paper.heightPx;
    const ctx = outputCanvas.getContext('2d')!;

    // Fill glossy photo paper crisp white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, paper.widthPx, paper.heightPx);

    const singlePhoto = renderSinglePassportUnit();
    const photoW = singlePhoto.width;
    const photoH = singlePhoto.height;

    // Calculate Grid Layout: columns & rows based on photoCount & paperFormat
    let cols = 4;
    let rows = 2;

    if (paperFormat === '4x6') {
      if (photoCount <= 6) {
        cols = 3;
        rows = 2;
      } else {
        cols = 4;
        rows = 2; // 8 photos fits perfectly on 4x6" (1800 x 1200 px)
      }
    } else {
      // A4 format
      if (photoCount <= 8) {
        cols = 4;
        rows = 2;
      } else if (photoCount <= 12) {
        cols = 4;
        rows = 3;
      } else if (photoCount <= 16) {
        cols = 4;
        rows = 4;
      } else {
        cols = 5;
        rows = Math.ceil(photoCount / 5);
      }
    }

    const gapPx = Math.round((2.5 / 25.4) * 300); // 2.5mm scissor cutting gap
    const totalGridW = cols * photoW + (cols - 1) * gapPx;
    const totalGridH = rows * photoH + (rows - 1) * gapPx;

    const startX = Math.round((paper.widthPx - totalGridW) / 2);
    const startY = Math.round((paper.heightPx - totalGridH) / 2);

    let placed = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (placed >= photoCount) break;
        const x = startX + c * (photoW + gapPx);
        const y = startY + r * (photoH + gapPx);

        ctx.drawImage(singlePhoto, x, y, photoW, photoH);

        // Outer corner cutting crosshairs
        drawCuttingTicks(ctx, x, y, photoW, photoH);
        placed++;
      }
    }

    // Header sheet watermark / cutting instructions
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `NP PRINT PORTAL · ${paperFormat.toUpperCase()} PHOTO PAPER · ${PASSPORT_SIZES[passportStandard].name} · 300 DPI TRUE SCALE`,
      paper.widthPx / 2,
      startY - 25 > 35 ? startY - 25 : 35
    );
  }, [
    paperFormat,
    passportStandard,
    photoCount,
    sourceImage,
    zoomLevel,
    panOffset,
    hasBorder,
    borderColor,
    hasNameDateBanner,
    candidateName,
    photoDate,
  ]);

  function drawCuttingTicks(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.save();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    const tick = 10;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(x - tick, y);
    ctx.lineTo(x, y);
    ctx.moveTo(x, y - tick);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(x + w, y + h);
    ctx.lineTo(x + w + tick, y + h);
    ctx.moveTo(x + w, y + h);
    ctx.lineTo(x + w, y + h + tick);
    ctx.stroke();
    ctx.restore();
  }

  // ----------------------------------------------------
  // INTERACTIVE CROP CANVAS (Pan & Zoom by dragging)
  // ----------------------------------------------------
  const handleMouseDown = (e: React.MouseEvent<HTMLElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // ----------------------------------------------------
  // EXPORTS & PRINT
  // ----------------------------------------------------
  const handleDownloadSheet = () => {
    const canvas = outputCanvasRef.current;
    if (!canvas) return;
    downloadCanvasAsPng(canvas, `passport-grid-${paperFormat}-${photoCount}copies-300dpi.png`);
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
  };

  const handleDownloadSingle = () => {
    const single = renderSinglePassportUnit();
    downloadCanvasAsPng(single, `passport-single-${PASSPORT_SIZES[passportStandard].widthMm}x${PASSPORT_SIZES[passportStandard].heightMm}mm.png`);
    confetti({ particleCount: 20, spread: 50, origin: { y: 0.8 } });
  };

  const handlePrint = () => {
    const canvas = outputCanvasRef.current;
    if (!canvas) return;
    triggerPrintA4(canvas);
  };

  return (
    <div className="w-full flex-1 flex flex-col lg:flex-row bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      
      {/* LEFT TOOL CONTROLS */}
      <aside className="w-full lg:w-96 border-r border-neutral-800 bg-neutral-900/60 p-5 flex flex-col gap-5 overflow-y-auto shrink-0">
        
        {/* Header / Upload */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Passport Photo Input
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">300 DPI Studio</span>
          </div>

          <label className="w-full px-4 py-2.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 rounded-lg text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm">
            <Camera className="w-4 h-4 text-cyan-400" />
            <span>Upload Portrait Photo</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={generateSamplePortrait}
            className="text-[11px] text-neutral-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Load Sample Studio Portrait</span>
          </button>
        </div>

        <div className="h-px bg-neutral-800" />

        {/* Paper & Grid Format */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Paper Sheet & Copies
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => {
                setPaperFormat('4x6');
                if (photoCount > 8) setPhotoCount(8);
              }}
              className={`p-2.5 rounded-lg border text-left transition-colors ${
                paperFormat === '4x6'
                  ? 'bg-neutral-800 border-cyan-500 text-cyan-300'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400'
              }`}
            >
              <div className="font-semibold text-xs text-white">4 × 6 Inch (10×15 cm)</div>
              <div className="text-[10px] text-neutral-500">Standard Mini Photo Paper</div>
            </button>

            <button
              onClick={() => setPaperFormat('a4')}
              className={`p-2.5 rounded-lg border text-left transition-colors ${
                paperFormat === 'a4'
                  ? 'bg-neutral-800 border-cyan-500 text-cyan-300'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400'
              }`}
            >
              <div className="font-semibold text-xs text-white">A4 Glossy Sheet</div>
              <div className="text-[10px] text-neutral-500">210 × 297 mm Sheet</div>
            </button>
          </div>

          <div>
            <div className="flex justify-between text-xs text-neutral-400 mb-1.5">
              <span>Copies to print:</span>
              <span className="font-mono text-cyan-400 font-bold">{photoCount} Photos</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 text-xs">
              {(paperFormat === '4x6' ? [4, 6, 8] : [6, 8, 12, 16, 32]).map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => setPhotoCount(cnt)}
                  className={`py-1.5 rounded border text-center font-mono font-medium transition-colors ${
                    photoCount === cnt
                      ? 'bg-cyan-500 text-neutral-950 border-cyan-400 font-bold'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-px bg-neutral-800" />

        {/* Passport Standard Size */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Standard Dimensions
          </span>

          <div className="space-y-1.5 text-xs">
            {(Object.keys(PASSPORT_SIZES) as PassportStandard[]).map((key) => {
              const spec = PASSPORT_SIZES[key];
              return (
                <button
                  key={key}
                  onClick={() => setPassportStandard(key)}
                  className={`w-full p-2 rounded-lg border text-left transition-colors flex items-center justify-between ${
                    passportStandard === key
                      ? 'bg-neutral-800 border-cyan-500 text-white'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <span>{spec.name}</span>
                  <span className="font-mono text-[10px] text-neutral-500">
                    {spec.widthMm}×{spec.heightMm}mm
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-neutral-800" />

        {/* Head Alignment & Crop Pan/Zoom */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Face Alignment & Scale
            </span>
            <span className="text-[10px] text-neutral-500">Drag photo to center</span>
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs text-neutral-400 mb-1">
                <span>Zoom Scale:</span>
                <span className="font-mono text-cyan-400">{zoomLevel.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.6"
                max="2.5"
                step="0.05"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
              />
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                <input
                  type="checkbox"
                  checked={showFaceGuide}
                  onChange={(e) => setShowFaceGuide(e.target.checked)}
                  className="rounded bg-neutral-800 border-neutral-700 text-cyan-500 focus:ring-0"
                />
                <span>Show Biometric Face Oval Guide</span>
              </label>

              <button
                onClick={() => {
                  setZoomLevel(1.0);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="text-[10px] text-neutral-500 hover:text-neutral-300"
              >
                Reset Position
              </button>
            </div>
          </div>
        </div>

        <div className="h-px bg-neutral-800" />

        {/* Name & Date of Photo (DOP) Strip Banner */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Govt Name & Date Banner
            </span>
            <input
              type="checkbox"
              checked={hasNameDateBanner}
              onChange={(e) => setHasNameDateBanner(e.target.checked)}
              className="rounded bg-neutral-800 border-neutral-700 text-cyan-500 focus:ring-0 cursor-pointer"
            />
          </div>

          {hasNameDateBanner && (
            <div className="space-y-2 text-xs bg-neutral-950 p-3 rounded-lg border border-neutral-800">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Candidate Full Name:</label>
                <input
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="e.g. RAJESH SHARMA"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Date of Photo (DOP):</label>
                <input
                  type="text"
                  value={photoDate}
                  onChange={(e) => setPhotoDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer">
            <span>Cut Border Hairline (Light Gray)</span>
            <input
              type="checkbox"
              checked={hasBorder}
              onChange={(e) => setHasBorder(e.target.checked)}
              className="rounded bg-neutral-800 border-neutral-700 text-cyan-500 focus:ring-0 cursor-pointer"
            />
          </label>
        </div>
      </aside>

      {/* RIGHT PREVIEW & ACTION WORKSPACE */}
      <main className="flex-1 flex flex-col bg-neutral-950 overflow-hidden">
        
        {/* Top Control Bar */}
        <div className="h-12 border-b border-neutral-800 bg-neutral-900/50 px-6 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-neutral-400">Sheet:</span>
            <span className="font-semibold text-white">
              {paperFormat.toUpperCase()} ({photoCount} Photos Grid)
            </span>
            <span className="text-neutral-600">·</span>
            <span className="font-mono text-cyan-400">
              {PAPER_SPECS[paperFormat].widthPx} × {PAPER_SPECS[paperFormat].heightPx} px @ 300 DPI
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSingle}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Single Photo</span>
            </button>
            <button
              onClick={handleDownloadSheet}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 border border-neutral-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {paperFormat.toUpperCase()} Sheet</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print 1:1 Scale</span>
            </button>
          </div>
        </div>

        {/* Interactive Viewport */}
        <div className="flex-1 p-6 flex flex-col lg:flex-row items-center justify-center gap-8 overflow-auto">
          
          {/* Box 1: Face Alignment Mini Crop Frame */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-xs text-neutral-400 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Align Face inside Biometric Oval:</span>
            </div>

            <div
              className="relative border-2 border-neutral-700 rounded-lg overflow-hidden bg-neutral-900 shadow-xl cursor-grab active:cursor-grabbing select-none"
              style={{
                width: 220,
                height: Math.round(220 * (PASSPORT_SIZES[passportStandard].heightMm / PASSPORT_SIZES[passportStandard].widthMm)),
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Scaled Preview of single unit */}
              {sourceImage && (
                <img
                  src={sourceImage.src}
                  alt="Source Portrait"
                  className="absolute pointer-events-none origin-center"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: `translate(${panOffset.x / 2}px, ${panOffset.y / 2}px) scale(${zoomLevel})`,
                  }}
                />
              )}

              {/* Biometric Face Guide Overlay */}
              {showFaceGuide && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  {/* Head Oval (70-80% height standard) */}
                  <div
                    className="border-2 border-dashed border-cyan-400/80 rounded-full"
                    style={{ width: '68%', height: '74%' }}
                  />
                  {/* Eye line crosshair */}
                  <div className="w-full h-px bg-cyan-400/40 absolute top-[45%]" />
                  {/* Center vertical axis */}
                  <div className="h-full w-px bg-cyan-400/40 absolute left-1/2" />
                </div>
              )}

              {/* Name Date banner preview */}
              {hasNameDateBanner && (
                <div className="absolute bottom-0 inset-x-0 bg-white border-t border-black text-black text-center py-0.5 leading-tight pointer-events-none">
                  <div className="font-bold text-[9px] truncate px-1">{candidateName}</div>
                  <div className="text-[8px] font-mono text-neutral-800">DOP: {photoDate}</div>
                </div>
              )}
            </div>
            <span className="text-[10px] text-neutral-500">Drag inside box to pan portrait</span>
          </div>

          {/* Box 2: Full Sheet Layout Preview (4x6 or A4) */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-xs text-neutral-400">
              Live Ready-to-Print {paperFormat.toUpperCase()} Sheet:
            </div>

            <div className="border border-neutral-800 rounded-lg p-2 bg-neutral-900 shadow-2xl flex items-center justify-center">
              <canvas
                ref={outputCanvasRef}
                className="max-h-[62vh] max-w-full w-auto object-contain rounded shadow-md border border-neutral-800"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
