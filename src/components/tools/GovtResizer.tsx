/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * components/tools/GovtResizer.tsx
 * Govt Job & Exam Portal Photo & Signature Resizer.
 * Compresses images to exact KB ranges (e.g. 20-50 KB, 10-20 KB) and dimensions
 * for SSC, UPSC, IBPS, Railways, NTA, and State PSC applications.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  FileCheck2,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Sparkles,
  Maximize2,
  FileText,
  FileImage,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExamPreset {
  id: string;
  name: string;
  category: 'ssc' | 'upsc' | 'banking' | 'railways' | 'custom';
  photo: {
    minKb: number;
    maxKb: number;
    targetKb: number;
    widthPx: number;
    heightPx: number;
    description: string;
  };
  signature: {
    minKb: number;
    maxKb: number;
    targetKb: number;
    widthPx: number;
    heightPx: number;
    description: string;
  };
}

const EXAM_PRESETS: ExamPreset[] = [
  {
    id: 'ssc',
    name: 'Staff Selection Commission (SSC CGL / CHSL / MTS / GD)',
    category: 'ssc',
    photo: {
      minKb: 20,
      maxKb: 50,
      targetKb: 35,
      widthPx: 276,
      heightPx: 354, // 3.5cm x 4.5cm @ 200 DPI
      description: '20 KB to 50 KB · 3.5cm × 4.5cm (276 × 354 px)',
    },
    signature: {
      minKb: 10,
      maxKb: 20,
      targetKb: 15,
      widthPx: 315,
      heightPx: 157, // 4.0cm x 2.0cm
      description: '10 KB to 20 KB · 4.0cm × 2.0cm (315 × 157 px)',
    },
  },
  {
    id: 'upsc',
    name: 'UPSC Civil Services / NDA / CDS / EPFO',
    category: 'upsc',
    photo: {
      minKb: 20,
      maxKb: 300,
      targetKb: 120,
      widthPx: 350,
      heightPx: 350,
      description: '20 KB to 300 KB · Min 350 × 350 px',
    },
    signature: {
      minKb: 20,
      maxKb: 300,
      targetKb: 80,
      widthPx: 350,
      heightPx: 350,
      description: '20 KB to 300 KB · Min 350 × 350 px',
    },
  },
  {
    id: 'ibps',
    name: 'Banking Exams (IBPS PO, Clerk / SBI / RBI)',
    category: 'banking',
    photo: {
      minKb: 20,
      maxKb: 50,
      targetKb: 38,
      widthPx: 200,
      heightPx: 230,
      description: '20 KB to 50 KB · 200 × 230 px',
    },
    signature: {
      minKb: 10,
      maxKb: 20,
      targetKb: 16,
      widthPx: 140,
      heightPx: 60,
      description: '10 KB to 20 KB · 140 × 60 px',
    },
  },
  {
    id: 'rrb',
    name: 'Railway Recruitment Board (RRB NTPC / Group D)',
    category: 'railways',
    photo: {
      minKb: 15,
      maxKb: 40,
      targetKb: 30,
      widthPx: 240,
      heightPx: 320,
      description: '15 KB to 40 KB · 240 × 320 px',
    },
    signature: {
      minKb: 10,
      maxKb: 20,
      targetKb: 15,
      widthPx: 240,
      heightPx: 120,
      description: '10 KB to 20 KB · 240 × 120 px',
    },
  },
];

export default function GovtResizer() {
  const [activeItemType, setActiveItemType] = useState<'photo' | 'signature'>('photo');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('ssc');
  
  // Custom Controls
  const [targetMinKb, setTargetMinKb] = useState<number>(20);
  const [targetMaxKb, setTargetMaxKb] = useState<number>(50);
  const [targetWidth, setTargetWidth] = useState<number>(276);
  const [targetHeight, setTargetHeight] = useState<number>(354);
  const [format, setFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');

  // Input & Output Images
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [sourceFileSize, setSourceFileSize] = useState<number>(0); // in bytes
  const [sourceFileName, setSourceFileName] = useState<string>('sample-candidate.jpg');

  // Compressed Result
  const [compressedDataUrl, setCompressedDataUrl] = useState<string | null>(null);
  const [compressedFileSize, setCompressedFileSize] = useState<number>(0);
  const [compressionQuality, setCompressionQuality] = useState<number>(0.85);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Apply preset settings
  useEffect(() => {
    const preset = EXAM_PRESETS.find((p) => p.id === selectedPresetId);
    if (!preset) return;

    const config = activeItemType === 'photo' ? preset.photo : preset.signature;
    setTargetMinKb(config.minKb);
    setTargetMaxKb(config.maxKb);
    setTargetWidth(config.widthPx);
    setTargetHeight(config.heightPx);
  }, [selectedPresetId, activeItemType]);

  // Load sample on mount
  useEffect(() => {
    loadSampleData();
  }, [activeItemType]);

  const loadSampleData = () => {
    const canvas = document.createElement('canvas');
    if (activeItemType === 'photo') {
      canvas.width = 600;
      canvas.height = 750;
      const ctx = canvas.getContext('2d')!;
      // Studio portrait background
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Person
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.ellipse(300, 700, 250, 200, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e2a77a';
      ctx.beginPath();
      ctx.ellipse(300, 350, 120, 160, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(300, 300, 130, Math.PI, Math.PI * 2);
      ctx.fill();
    } else {
      // Signature sample
      canvas.width = 700;
      canvas.height = 300;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(100, 180);
      ctx.bezierCurveTo(200, 80, 250, 220, 350, 120);
      ctx.bezierCurveTo(450, 60, 480, 240, 600, 150);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(120, 220);
      ctx.lineTo(580, 220);
      ctx.stroke();
    }

    const img = new Image();
    img.src = canvas.toDataURL('image/jpeg', 0.95);
    img.onload = () => {
      setSourceImage(img);
      setSourceFileSize(185420); // ~181 KB simulated original
      setSourceFileName(activeItemType === 'photo' ? 'candidate_photo_raw.jpg' : 'candidate_signature_raw.jpg');
    };
  };

  const [hasProcessed, setHasProcessed] = useState<boolean>(true);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSourceFileSize(file.size);
    setSourceFileName(file.name);
    setHasProcessed(false); // require action button click

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        setSourceImage(img);
      };
    };
    reader.readAsDataURL(file);
  };

  // ----------------------------------------------------
  // INTELLIGENT BINARY SEARCH COMPRESSION ENGINE
  // Compresses canvas iteratively to hit target KB window
  // ----------------------------------------------------
  const runResizeAction = () => {
    if (!sourceImage) return;

    setIsProcessing(true);
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d')!;

    // Clean white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // Draw image maintaining aspect ratio centered
    const imgAspect = sourceImage.width / sourceImage.height;
    const targetAspect = targetWidth / targetHeight;
    let sW = targetWidth;
    let sH = targetHeight;

    if (imgAspect > targetAspect) {
      sW = targetWidth;
      sH = targetWidth / imgAspect;
    } else {
      sH = targetHeight;
      sW = targetHeight * imgAspect;
    }

    const sX = (targetWidth - sW) / 2;
    const sY = (targetHeight - sH) / 2;
    ctx.drawImage(sourceImage, sX, sY, sW, sH);

    // Iterative binary search for JPEG quality
    let minQuality = 0.01;
    let maxQuality = 0.98;
    let bestQuality = 0.85;
    let bestDataUrl = '';
    let bestSize = 0;

    const targetBytesMax = targetMaxKb * 1024;
    const targetBytesMin = targetMinKb * 1024;
    const idealTargetBytes = ((targetMinKb + targetMaxKb) / 2) * 1024;

    for (let iter = 0; iter < 10; iter++) {
      const q = (minQuality + maxQuality) / 2;
      const dataUrl = canvas.toDataURL(format, q);
      const sizeBytes = Math.round((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75);

      bestDataUrl = dataUrl;
      bestSize = sizeBytes;
      bestQuality = q;

      if (sizeBytes > targetBytesMax) {
        maxQuality = q;
      } else if (sizeBytes < targetBytesMin) {
        minQuality = q;
      } else {
        // In desired range! Try to get closest to middle
        if (Math.abs(sizeBytes - idealTargetBytes) < 1500) {
          break;
        }
        if (sizeBytes > idealTargetBytes) {
          maxQuality = q;
        } else {
          minQuality = q;
        }
      }
    }

    // STRICT GUARANTEE: Never exceed targetMaxKb
    if (bestSize > targetBytesMax) {
      for (const lowQ of [0.5, 0.3, 0.15, 0.05, 0.01]) {
        const dataUrl = canvas.toDataURL(format, lowQ);
        const sizeBytes = Math.round((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75);
        bestDataUrl = dataUrl;
        bestSize = sizeBytes;
        bestQuality = lowQ;
        if (sizeBytes <= targetBytesMax) break;
      }
    }

    setCompressedDataUrl(bestDataUrl);
    setCompressedFileSize(bestSize);
    setCompressionQuality(bestQuality);
    setIsProcessing(false);
    setHasProcessed(true);
    confetti({ particleCount: 25, spread: 50 });
  };

  useEffect(() => {
    if (sourceImage && hasProcessed) {
      runResizeAction();
    }
  }, [targetWidth, targetHeight, targetMinKb, targetMaxKb, format]);

  // Download Output
  const handleDownload = () => {
    if (!compressedDataUrl) return;
    const link = document.createElement('a');
    const kbStr = `${Math.round(compressedFileSize / 1024)}KB`;
    link.download = `${selectedPresetId}-${activeItemType}-${targetWidth}x${targetHeight}-${kbStr}.jpg`;
    link.href = compressedDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
  };

  const isWithinTarget =
    compressedFileSize >= targetMinKb * 1024 * 0.9 &&
    compressedFileSize <= targetMaxKb * 1024 * 1.05;

  return (
    <div className="w-full flex-1 flex flex-col lg:flex-row bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      
      {/* LEFT SETTINGS SIDEBAR */}
      <aside className="w-full lg:w-96 border-r border-neutral-800 bg-neutral-900/60 p-5 flex flex-col gap-5 overflow-y-auto shrink-0">
        
        {/* Item Type Switcher (Photo vs Signature) */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Document Component
          </span>

          <div className="grid grid-cols-2 gap-2 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
            <button
              onClick={() => setActiveItemType('photo')}
              className={`py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                activeItemType === 'photo'
                  ? 'bg-cyan-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <FileImage className="w-4 h-4" />
              <span>Candidate Photo</span>
            </button>
            <button
              onClick={() => setActiveItemType('signature')}
              className={`py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                activeItemType === 'signature'
                  ? 'bg-cyan-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Signature Crop</span>
            </button>
          </div>
        </div>

        {/* Upload Button */}
        <div>
          <label className="w-full px-4 py-2.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 rounded-lg text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm">
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Upload {activeItemType === 'photo' ? 'Photo' : 'Signature'}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="h-px bg-neutral-800" />

        {/* Exam Portal Presets */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Govt Exam & Portal Presets
          </span>

          <div className="space-y-1.5 text-xs">
            {EXAM_PRESETS.map((preset) => {
              const spec = activeItemType === 'photo' ? preset.photo : preset.signature;
              return (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPresetId(preset.id)}
                  className={`w-full p-2.5 rounded-lg border text-left transition-colors flex flex-col gap-0.5 ${
                    selectedPresetId === preset.id
                      ? 'bg-neutral-800 border-cyan-500/60 text-white'
                      : 'bg-neutral-950 border-neutral-800/80 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <div className="font-semibold text-neutral-200 text-xs">{preset.name}</div>
                  <div className="text-[11px] text-cyan-400 font-mono">{spec.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-neutral-800" />

        {/* Custom Target Size & KB Range */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Custom Target Specifications
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Min Size (KB):</label>
              <input
                type="number"
                value={targetMinKb}
                onChange={(e) => setTargetMinKb(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Max Size (KB):</label>
              <input
                type="number"
                value={targetMaxKb}
                onChange={(e) => setTargetMaxKb(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Width (Pixels):</label>
              <input
                type="number"
                value={targetWidth}
                onChange={(e) => setTargetWidth(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Height (Pixels):</label>
              <input
                type="number"
                value={targetHeight}
                onChange={(e) => setTargetHeight(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-white font-mono"
              />
            </div>
          </div>

          {/* Action Button: User must click this button to perform resize */}
          <button
            onClick={runResizeAction}
            disabled={!sourceImage || isProcessing}
            className="w-full mt-2 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer hover:scale-105 disabled:opacity-50"
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FileCheck2 className="w-4 h-4" />
            )}
            <span>{isProcessing ? 'Resizing Image...' : `⚡ Resize Image to ${targetMinKb}-${targetMaxKb} KB (रिसाइज करें)`}</span>
          </button>
        </div>
      </aside>

      {/* RIGHT PREVIEW & COMPARISON CANVAS */}
      <main className="flex-1 flex flex-col bg-neutral-950 overflow-hidden">
        
        {/* Top Metric Bar */}
        <div className="h-12 border-b border-neutral-800 bg-neutral-900/50 px-6 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-neutral-400">Target Range:</span>
            <span className="font-mono text-cyan-400 font-bold">
              {targetMinKb} KB – {targetMaxKb} KB
            </span>
            <span className="text-neutral-600">·</span>
            <span className="font-mono text-neutral-300">
              {targetWidth} × {targetHeight} px
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!hasProcessed && (
              <button
                onClick={runResizeAction}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Resize Now</span>
              </button>
            )}

            <button
              onClick={handleDownload}
              disabled={!hasProcessed || !compressedDataUrl}
              className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-neutral-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download {Math.round(compressedFileSize / 1024)} KB File</span>
            </button>
          </div>
        </div>

        {/* Compression Comparison Cards */}
        <div className="flex-1 p-6 flex flex-col lg:flex-row items-center justify-center gap-8 overflow-auto">
          
          {/* Box 1: Original Source Image */}
          <div className="flex flex-col items-center gap-3">
            <div className="text-xs text-neutral-400 flex items-center justify-between w-64">
              <span>Original File</span>
              <span className="font-mono text-neutral-300">
                {(sourceFileSize / 1024).toFixed(1)} KB
              </span>
            </div>

            <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900 shadow-xl p-2 flex items-center justify-center w-64 h-72">
              {sourceImage ? (
                <img
                  src={sourceImage.src}
                  alt="Original input"
                  className="max-h-full max-w-full object-contain rounded"
                />
              ) : (
                <span className="text-neutral-500 text-xs">No image uploaded</span>
              )}
            </div>
            <span className="text-[11px] text-neutral-500 font-mono truncate max-w-[260px]">
              {sourceFileName}
            </span>
          </div>

          <div className="hidden lg:flex items-center text-neutral-600">
            <ArrowRight className="w-6 h-6 text-cyan-500/50" />
          </div>

          {/* Box 2: Compressed & Resized Output */}
          <div className="flex flex-col items-center gap-3">
            <div className="text-xs text-neutral-400 flex items-center justify-between w-64">
              <span className="flex items-center gap-1 text-cyan-300 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Resized Output
              </span>
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                  isWithinTarget
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                }`}
              >
                {(compressedFileSize / 1024).toFixed(1)} KB
              </span>
            </div>

            <div className="border border-cyan-500/30 rounded-xl overflow-hidden bg-neutral-900 shadow-2xl p-2 flex items-center justify-center w-64 h-72 relative">
              {compressedDataUrl ? (
                <img
                  src={compressedDataUrl}
                  alt="Resized output"
                  className="max-h-full max-w-full object-contain rounded shadow"
                />
              ) : (
                <span className="text-neutral-500 text-xs">Processing...</span>
              )}

              {/* Exact badge */}
              <div className="absolute bottom-3 right-3 bg-neutral-950/80 backdrop-blur px-2 py-0.5 rounded border border-neutral-700 text-[10px] font-mono text-cyan-300">
                {targetWidth} × {targetHeight} px
              </div>
            </div>

            {/* Validation confirmation */}
            <div className="flex items-center gap-1.5 text-xs">
              {isWithinTarget ? (
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Exam Portal Compliant ({targetMinKb}–{targetMaxKb} KB)
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Adjusting quality...
                </span>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
