'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * src/components/tools/ImageSizeReducer.tsx
 * Ultra-Fast In-Browser Image Size Reducer (KB/MB) matching Pi7 Image Tool.
 * 100% Client-Side Private, No Server Upload, FREE Without Login!
 */

import React, { useState, useRef, useEffect } from 'react';
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
  RotateCcw
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
  const [targetKb, setTargetKb] = useState<number>(100);
  const [dimensionMode, setDimensionMode] = useState<'pixels' | 'mm' | 'cm'>('pixels');
  const [customWidth, setCustomWidth] = useState<string>('');
  const [customHeight, setCustomHeight] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Result State
  const [compressedDataUrl, setCompressedDataUrl] = useState<string | null>(null);
  const [compressedSizeKb, setCompressedSizeKb] = useState<number>(0);
  const [customFilename, setCustomFilename] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load image from File
  const handleFileSelect = (file: File) => {
    setRawFile(file);
    setOriginalSizeKb(Math.round(file.size / 1024));
    setCustomFilename(file.name.replace(/\.[^/.]+$/, ''));

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setSourceImg(img);
        setOriginalDimensions({ w: img.naturalWidth, h: img.naturalHeight });
        setCustomWidth(img.naturalWidth.toString());
        setCustomHeight(img.naturalHeight.toString());
        // Auto compress with default target
        compressImage(img, targetKb);
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
   * Fast Binary Search Client-Side Compression to Hit Target KB
   */
  const compressImage = async (img: HTMLImageElement, targetSize: number) => {
    setIsProcessing(true);

    try {
      const origW = img.naturalWidth;
      const origH = img.naturalHeight;

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

      // Binary search for optimal JPEG quality (0.05 to 0.98)
      let minQ = 0.05;
      let maxQ = 0.98;
      let bestDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      let bestSizeKb = Math.round((bestDataUrl.length * (3 / 4)) / 1024);

      for (let iter = 0; iter < 7; iter++) {
        const midQ = (minQ + maxQ) / 2;
        const currentDataUrl = canvas.toDataURL('image/jpeg', midQ);
        const currentSizeKb = Math.round((currentDataUrl.length * (3 / 4)) / 1024);

        if (currentSizeKb <= targetSize) {
          bestDataUrl = currentDataUrl;
          bestSizeKb = currentSizeKb;
          minQ = midQ; // try to get better quality while staying <= targetSize
        } else {
          maxQ = midQ;
        }
      }

      // If even lowest quality is larger than target, scale down canvas resolution
      if (bestSizeKb > targetSize * 1.15 && (targetW > 300 || targetH > 300)) {
        let scale = Math.sqrt(targetSize / bestSizeKb) * 0.95;
        const scaledCanvas = document.createElement('canvas');
        scaledCanvas.width = Math.max(120, Math.round(targetW * scale));
        scaledCanvas.height = Math.max(120, Math.round(targetH * scale));
        const sCtx = scaledCanvas.getContext('2d');
        if (sCtx) {
          sCtx.fillStyle = '#ffffff';
          sCtx.fillRect(0, 0, scaledCanvas.width, scaledCanvas.height);
          sCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
          bestDataUrl = scaledCanvas.toDataURL('image/jpeg', 0.82);
          bestSizeKb = Math.round((bestDataUrl.length * (3 / 4)) / 1024);
        }
      }

      setCompressedDataUrl(bestDataUrl);
      setCompressedSizeKb(bestSizeKb);
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
  };

  const savedPercent =
    originalSizeKb > 0
      ? Math.max(0, Math.round(((originalSizeKb - compressedSizeKb) / originalSizeKb) * 100))
      : 0;

  return (
    <div className="w-full min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center">
      {/* Pi7 Style Secondary Utility Top Bar */}
      <div className="w-full bg-[#1e293b] border-b border-slate-700/80 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2 font-bold text-white tracking-wide">
          <span className="bg-blue-600 text-white px-2 py-0.5 rounded font-black text-sm">Pi7</span>
          <span className="text-cyan-300 font-extrabold">IMAGE TOOL</span>
          <span className="text-slate-400 font-normal hidden sm:inline">| 100% Free Without Login</span>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto text-[11px] text-slate-300 font-medium">
          <button
            onClick={() => onNavigateTool?.('images-to-pdf')}
            className="hover:text-cyan-400 transition-colors cursor-pointer whitespace-nowrap"
          >
            Images to PDF
          </button>
          <span className="text-slate-600">|</span>
          <button
            onClick={() => onNavigateTool?.('govt-resizer')}
            className="hover:text-cyan-400 transition-colors cursor-pointer whitespace-nowrap"
          >
            Resize Image Pixel
          </button>
          <span className="text-slate-600">|</span>
          <button
            onClick={() => onNavigateTool?.('passport-studio')}
            className="hover:text-cyan-400 transition-colors cursor-pointer whitespace-nowrap"
          >
            Passport Size Photo
          </button>
          <span className="text-slate-600">|</span>
          <button
            onClick={() => onNavigateTool?.('pdf-compressor')}
            className="hover:text-cyan-400 transition-colors cursor-pointer whitespace-nowrap"
          >
            Compress PDF
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
              Compress an image to 20kb, 50kb, 100KB, 200KB, or any custom size without losing clarity.
            </p>
          </div>

          {/* Upload Dropzone */}
          {!sourceImg ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-slate-800/80 border-2 border-dashed border-blue-500/50 hover:border-cyan-400 rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-4 transition-all cursor-pointer shadow-xl hover:shadow-cyan-500/10 group"
            >
              {/* Dimensions Badge selector in top corner */}
              <div className="self-end bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 text-[11px] text-slate-300 flex items-center gap-1.5 pointer-events-none">
                <span>Image Dimensions:</span>
                <span className="text-cyan-400 font-bold">Pixels · MM · CM</span>
              </div>

              <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8" />
              </div>

              <div>
                <p className="text-base font-bold text-white">Select Or Drag & Drop Images Here</p>
                <p className="text-xs text-slate-400 mt-1">Supports JPG, PNG, WEBP, JPEG</p>
              </div>

              <button
                type="button"
                className="mt-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-md transition-colors cursor-pointer"
              >
                Select Images
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
            </div>
          ) : (
            /* Compressed Result View (Image 3 Style) */
            <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-6 sm:p-8 flex flex-col items-center gap-6 shadow-2xl text-center">
              {/* Image Preview */}
              <div className="w-48 h-56 rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden shadow-inner flex items-center justify-center p-2">
                <img
                  src={compressedDataUrl || ''}
                  alt="Compressed Preview"
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>

              {/* Size Comparison Badge */}
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <span className="text-2xl font-black text-white">{compressedSizeKb} KB</span>
                <span className="text-sm text-slate-400 line-through">was {originalSizeKb} KB</span>
                {savedPercent > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {savedPercent}% smaller
                  </span>
                )}
              </div>

              {/* Rename image input */}
              <div className="w-full max-w-sm text-left">
                <label className="text-[11px] text-slate-400 block mb-1">Rename Image:</label>
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white">
                  <input
                    type="text"
                    value={customFilename}
                    onChange={(e) => setCustomFilename(e.target.value)}
                    className="w-full bg-transparent focus:outline-none"
                  />
                  <span className="text-slate-500">.jpeg</span>
                </div>
              </div>

              {/* Primary Action Download Button (FREE) */}
              <button
                onClick={handleDownload}
                className="w-full max-w-sm py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-2xl text-sm shadow-xl shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Image</span>
              </button>

              <p className="text-[11px] text-slate-400">
                🔒 Compressed on your device. Nothing was uploaded.
              </p>

              <button
                onClick={handleReset}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer mt-1"
              >
                Compress More Images
              </button>
            </div>
          )}

          {/* Control Settings Bar (Matching Image 2) */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Target Size Input */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-200">Size:</span>
                <input
                  type="number"
                  min="5"
                  max="5000"
                  value={targetKb}
                  onChange={(e) => setTargetKb(Number(e.target.value))}
                  className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-mono text-cyan-300 text-center focus:outline-none focus:border-cyan-400"
                />
                <span className="text-xs font-bold text-slate-400">KB</span>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[20, 50, 100, 200, 500].map((kb) => (
                  <button
                    key={kb}
                    onClick={() => {
                      setTargetKb(kb);
                      if (sourceImg) compressImage(sourceImg, kb);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      targetKb === kb
                        ? 'bg-blue-600 text-white border-blue-400'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    {kb} KB
                  </button>
                ))}
              </div>

              {/* Primary Reduce Size Button */}
              <button
                onClick={() => sourceImg && compressImage(sourceImg, targetKb)}
                disabled={!sourceImg || isProcessing}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Minimize2 className="w-3.5 h-3.5" />}
                <span>{isProcessing ? 'Compressing...' : 'Reduce Size'}</span>
              </button>
            </div>

            {/* Optional Dimension Override Accordion */}
            <div className="pt-3 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span>Unit:</span>
                {(['pixels', 'mm', 'cm'] as const).map((unit) => (
                  <button
                    key={unit}
                    onClick={() => setDimensionMode(unit)}
                    className={`px-2 py-0.5 rounded capitalize font-medium ${
                      dimensionMode === unit ? 'bg-slate-700 text-white font-bold' : 'hover:text-white'
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span>W:</span>
                <input
                  type="text"
                  placeholder="Width"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value)}
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-white font-mono text-center"
                />
                <span>H:</span>
                <input
                  type="text"
                  placeholder="Height"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(e.target.value)}
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-white font-mono text-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Quick Tools Sidebar (Matching Image 2) */}
        <div className="flex flex-col gap-2 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-4 shadow-xl text-xs">
          <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-1">
            Quick Image & PDF Tools
          </span>

          {[
            { id: 'increase-size', label: '● Increase Image Size In KB', isHot: true },
            { id: 'pdf-to-images', label: 'PDF To Images' },
            { id: 'remove-bg', label: 'Remove Background' },
            { id: 'pi7-pdf', label: 'Pi7 PDF Tool' },
            { id: 'images-to-pdf', label: '● Images To PDF', isHot: true },
            { id: 'signature-maker', label: 'Signature Maker' },
            { id: 'blur-bg', label: 'Blur Background' },
            { id: 'increase-quality', label: '● Increase Image Quality', isHot: true },
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
        </div>
      </div>
    </div>
  );
}
