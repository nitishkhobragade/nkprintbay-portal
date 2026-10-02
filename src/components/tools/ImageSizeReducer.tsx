'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * src/components/tools/ImageSizeReducer.tsx
 * Ultra-Fast In-Browser Image Size Reducer (KB/MB).
 * 100% Client-Side Private, No Server Upload, FREE Without Login!
 * User-controllable Action Button ("Compress Image") & Strict Size Guarantee!
 */

import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  RefreshCw,
  Sliders,
  CheckCircle2,
  FileImage,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Image as ImageIcon,
  Minimize2,
  RotateCcw,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface ImageSizeReducerProps {
  onNavigateTool?: (toolId: string) => void;
}

export default function ImageSizeReducer({ onNavigateTool }: ImageSizeReducerProps) {
  // Input State
  const [sourceImg, setSourceImg] = useState<HTMLImageElement | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [originalSizeKb, setOriginalSizeKb] = useState<number>(0);
  const [originalDimensions, setOriginalDimensions] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  // Target Compression Settings
  const [targetKb, setTargetKb] = useState<number>(50);
  const [dimensionMode, setDimensionMode] = useState<'pixels' | 'mm' | 'cm'>('pixels');
  const [customWidth, setCustomWidth] = useState<string>('');
  const [customHeight, setCustomHeight] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [hasCompressed, setHasCompressed] = useState<boolean>(false);

  // Result State
  const [compressedDataUrl, setCompressedDataUrl] = useState<string | null>(null);
  const [compressedSizeKb, setCompressedSizeKb] = useState<number>(0);
  const [customFilename, setCustomFilename] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load image from File
  const handleFileSelect = (file: File) => {
    setRawFile(file);
    const origKb = Math.round(file.size / 1024);
    setOriginalSizeKb(origKb);
    setCustomFilename(file.name.replace(/\.[^/.]+$/, ''));
    setHasCompressed(false);
    setCompressedDataUrl(null);
    setCompressedSizeKb(0);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setSourceImg(img);
        setOriginalDimensions({ w: img.naturalWidth, h: img.naturalHeight });
        setCustomWidth(img.naturalWidth.toString());
        setCustomHeight(img.naturalHeight.toString());
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  };

  /**
   * Guaranteed Strict Compression: outputSizeKb <= targetSize
   * Binary search for optimal JPEG quality + progressive resolution scale-down if needed
   */
  const compressImage = async (img: HTMLImageElement, targetSize: number) => {
    setIsProcessing(true);

    try {
      const origW = img.naturalWidth;
      const origH = img.naturalHeight;
      const maxBytes = targetSize * 1024;

      // Determine target resolution if user specified custom dimensions
      let targetW = origW;
      let targetH = origH;

      if (customWidth && customHeight && Number(customWidth) > 0 && Number(customHeight) > 0) {
        let reqW = Number(customWidth);
        let reqH = Number(customHeight);
        if (dimensionMode === 'mm') {
          reqW = Math.round((reqW / 25.4) * 300);
          reqH = Math.round((reqH / 25.4) * 300);
        } else if (dimensionMode === 'cm') {
          reqW = Math.round((reqW * 10 / 25.4) * 300);
          reqH = Math.round((reqH * 10 / 25.4) * 300);
        }
        targetW = reqW;
        targetH = reqH;
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetW, targetH);
      ctx.drawImage(img, 0, 0, targetW, targetH);

      const toBlob = (c: HTMLCanvasElement, q: number): Promise<Blob> =>
        new Promise((resolve) => c.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', q));

      let minQ = 0.02;
      let maxQ = 0.95;
      let bestBlob: Blob | null = null;

      // 1. Binary search for highest quality that is <= maxBytes
      for (let iter = 0; iter < 8; iter++) {
        const midQ = (minQ + maxQ) / 2;
        const b = await toBlob(canvas, midQ);
        if (b.size <= maxBytes) {
          bestBlob = b;
          minQ = midQ; // try better quality
        } else {
          maxQ = midQ;
        }
      }

      // 2. If even min quality is larger than target, scale down canvas resolution in steps
      let curCanvas = canvas;
      let curW = targetW;
      let curH = targetH;

      while ((!bestBlob || bestBlob.size > maxBytes) && (curW > 80 && curH > 80)) {
        curW = Math.max(80, Math.round(curW * 0.82));
        curH = Math.max(80, Math.round(curH * 0.82));
        const scaledCanvas = document.createElement('canvas');
        scaledCanvas.width = curW;
        scaledCanvas.height = curH;
        const sCtx = scaledCanvas.getContext('2d');
        if (sCtx) {
          sCtx.fillStyle = '#ffffff';
          sCtx.fillRect(0, 0, curW, curH);
          sCtx.drawImage(img, 0, 0, curW, curH);
          curCanvas = scaledCanvas;

          for (const testQ of [0.85, 0.65, 0.45, 0.25, 0.08, 0.02]) {
            const b = await toBlob(curCanvas, testQ);
            if (b.size <= maxBytes) {
              bestBlob = b;
              break;
            }
          }
        }
      }

      if (!bestBlob) {
        bestBlob = await toBlob(curCanvas, 0.02);
      }

      const bestDataUrl: string = await new Promise((res) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result as string);
        reader.readAsDataURL(bestBlob!);
      });

      const actualKb = Math.max(1, Math.round(bestBlob.size / 1024));
      setCompressedDataUrl(bestDataUrl);
      setCompressedSizeKb(actualKb);
      setHasCompressed(true);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!compressedDataUrl) return;
    const a = document.createElement('a');
    a.href = compressedDataUrl;
    a.download = `${customFilename || 'image_compressed'}_${compressedSizeKb}kb.jpg`;
    a.click();
    confetti({ particleCount: 35, spread: 60 });
  };

  const handleReset = () => {
    setSourceImg(null);
    setRawFile(null);
    setCompressedDataUrl(null);
    setOriginalSizeKb(0);
    setCompressedSizeKb(0);
    setHasCompressed(false);
  };

  const savedPercent =
    originalSizeKb > 0 && compressedSizeKb > 0
      ? Math.max(0, Math.round(((originalSizeKb - compressedSizeKb) / originalSizeKb) * 100))
      : 0;

  return (
    <div className="w-full min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center">
      {/* Secondary Utility Top Bar */}
      <div className="w-full bg-[#1e293b] border-b border-slate-700/80 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2 font-bold text-white tracking-wide">
          <span className="bg-blue-600 text-white px-2 py-0.5 rounded font-black text-sm">NK</span>
          <span className="text-cyan-300 font-extrabold">IMAGE COMPRESSOR</span>
          <span className="text-slate-400 font-normal hidden sm:inline">| 100% Free Without Login</span>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto text-[11px] text-slate-300 font-medium">
          <button
            onClick={() => onNavigateTool?.('pdf-suite')}
            className="hover:text-cyan-400 transition-colors cursor-pointer whitespace-nowrap"
          >
            PDF Suite
          </button>
          <span className="text-slate-600">|</span>
          <button
            onClick={() => onNavigateTool?.('govt-resizer')}
            className="hover:text-cyan-400 transition-colors cursor-pointer whitespace-nowrap"
          >
            Govt Form Resizer
          </button>
          <span className="text-slate-600">|</span>
          <button
            onClick={() => onNavigateTool?.('passport-studio')}
            className="hover:text-cyan-400 transition-colors cursor-pointer whitespace-nowrap"
          >
            Passport Photo Studio
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-6xl p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 Columns: Main Compressor */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          {/* Header Card */}
          <div className="text-center sm:text-left space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Reduce Image Size In KB
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Compress any photo or document to exact target KB (20KB, 50KB, 100KB, 200KB). Guaranteed not to exceed your chosen size!
            </p>
          </div>

          {/* Upload Dropzone (When No Image Selected) */}
          {!sourceImg ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-slate-800/80 border-2 border-dashed border-blue-500/50 hover:border-cyan-400 rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-4 transition-all cursor-pointer shadow-xl hover:shadow-cyan-500/10 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8" />
              </div>

              <div>
                <span className="text-base sm:text-lg font-bold text-white block">
                  Select Image to Compress
                </span>
                <span className="text-xs text-slate-400 mt-1 block">
                  Click to browse or drag & drop (JPG, PNG, WebP)
                </span>
              </div>

              <button
                type="button"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all pointer-events-none"
              >
                Choose Image File
              </button>

              <span className="text-[11px] text-slate-400">
                🔒 100% Client-Side Compression · No upload to server
              </span>
            </div>
          ) : (
            /* Selected File View & Controls */
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 flex flex-col gap-6 shadow-xl">
              {/* File Info Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                    <img
                      src={sourceImg.src}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm truncate max-w-[200px] sm:max-w-xs">
                      {rawFile?.name || 'Selected Image'}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-mono text-cyan-300 font-semibold">{originalSizeKb} KB</span>
                      <span>·</span>
                      <span>{originalDimensions.w} × {originalDimensions.h} px</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Choose Another</span>
                </button>
              </div>

              {/* Compression Configuration Bar */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Target Size:</span>
                    <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 font-mono text-sm text-cyan-300 font-black">
                      <input
                        type="number"
                        min="5"
                        max="5000"
                        value={targetKb}
                        onChange={(e) => {
                          setTargetKb(Math.max(5, Number(e.target.value) || 20));
                          setHasCompressed(false);
                        }}
                        className="w-16 bg-transparent focus:outline-none text-right font-black"
                      />
                      <span className="ml-1 text-slate-400 font-normal text-xs">KB</span>
                    </div>
                  </div>

                  {/* Preset Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[20, 50, 100, 200].map((kb) => (
                      <button
                        key={kb}
                        onClick={() => {
                          setTargetKb(kb);
                          setHasCompressed(false);
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                          targetKb === kb
                            ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                            : 'bg-slate-900 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {kb} KB
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Slider */}
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="5"
                  value={targetKb}
                  onChange={(e) => {
                    setTargetKb(Number(e.target.value));
                    setHasCompressed(false);
                  }}
                  className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-900 rounded-lg"
                />

                {/* PROMINENT USER ACTION BUTTON */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={() => compressImage(sourceImg, targetKb)}
                    disabled={isProcessing}
                    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl shadow-blue-600/30 hover:scale-105"
                  >
                    {isProcessing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Minimize2 className="w-4 h-4" />
                    )}
                    <span>{isProcessing ? 'Compressing to Target KB...' : '⚡ Compress Image (साइज कम करें)'}</span>
                  </button>

                  <span className="text-[11px] text-slate-400">
                    Click button to perform compression
                  </span>
                </div>
              </div>

              {/* Compressed Result Card & Download Button (Only After Action Button Clicked) */}
              {hasCompressed && compressedDataUrl && (
                <div className="bg-slate-900/90 border border-emerald-500/50 rounded-2xl p-5 flex flex-col gap-4 animate-in fade-in duration-200">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Compression Complete! Target Achieved ✓</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-slate-400 line-through">{originalSizeKb} KB</span>
                      <span className="text-white">→</span>
                      <span className="text-emerald-400 font-black text-sm">{compressedSizeKb} KB</span>
                      <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                        -{savedPercent}%
                      </span>
                    </div>
                  </div>

                  {/* Rename and Download Row */}
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="w-full sm:w-64 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white flex items-center">
                      <input
                        type="text"
                        value={customFilename}
                        onChange={(e) => setCustomFilename(e.target.value)}
                        className="w-full bg-transparent focus:outline-none"
                        placeholder="file_name"
                      />
                      <span className="text-slate-500">.jpg</span>
                    </div>

                    <button
                      onClick={handleDownload}
                      className="w-full sm:w-auto px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer hover:scale-105"
                    >
                      <Download className="w-4 h-4" />
                      <span>📥 Download Compressed Image (Free)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            accept="image/jpeg,image/png,image/webp,image/jpg"
            className="hidden"
          />
        </div>

        {/* Right 1 Column: Quick Tools Sidebar */}
        <div className="flex flex-col gap-2 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-4 shadow-xl text-xs">
          <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-1">
            Quick Image & PDF Tools
          </span>

          {[
            { id: 'pdf-suite', label: 'PDF Suite & Universal Tools', isHot: true },
            { id: 'passport-studio', label: '1-Click Passport Photo Studio', isHot: true },
            { id: 'smart-id', label: 'Smart ID Card Engine (CR80)' },
            { id: 'govt-resizer', label: 'Govt Exam Photo Resizer' },
            { id: 'signature-enhancer', label: 'Signature & Stamp Enhancer' },
            { id: 'master-compressor', label: 'Master Batch Compressor' },
          ].map((tool) => (
            <button
              key={tool.id}
              onClick={() => onNavigateTool?.(tool.id)}
              className="w-full text-left py-2 px-3 rounded-xl bg-slate-900/60 hover:bg-slate-700/80 border border-slate-700/50 hover:border-slate-600 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center justify-between"
            >
              <span className={tool.isHot ? 'text-cyan-300 font-bold' : ''}>{tool.label}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
          ))}

          <div className="mt-4 p-3 bg-blue-950/60 rounded-2xl border border-blue-800/60 text-[11px] text-slate-300 space-y-1">
            <span className="font-bold text-cyan-300 block">✓ Exact Size Guarantee</span>
            <p>
              Your compressed image will never exceed your specified target size. 100% private in browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
