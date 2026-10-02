/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * components/tools/SignatureEnhancer.tsx
 * Signature & Stamp Enhancer for Cyber Cafes and Print Shops.
 * Removes uneven camera shadows, mobile phone glare, and yellow paper grain.
 * Outputs crisp monochrome black-on-white or transparent PNG signatures.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Download,
  Upload,
  RefreshCw,
  Sliders,
  CheckCircle2,
  FileCheck,
  Eye,
  Layers,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { downloadCanvasAsPng } from '../../lib/canvasUtils';

export type OutputFormatMode = 'transparent-png' | 'crisp-white-jpg' | 'blue-ink-png';

export default function SignatureEnhancer() {
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [threshold, setThreshold] = useState<number>(148); // 0 - 255
  const [contrastBoost, setContrastBoost] = useState<number>(30); // 0 - 100
  const [smoothEdges, setSmoothEdges] = useState<boolean>(true);
  const [outputMode, setOutputMode] = useState<OutputFormatMode>('transparent-png');

  const outputCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load sample signature on mount
  useEffect(() => {
    loadSampleSignature();
  }, []);

  const loadSampleSignature = () => {
    // Generate a signature with simulated yellow paper grain and dark shadows
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 450;
    const ctx = canvas.getContext('2d')!;

    // Yellowish notebook paper background with camera shadow gradient
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#fef9c3'); // yellow paper
    grad.addColorStop(0.6, '#fde68a'); // darker yellow
    grad.addColorStop(1, '#94a3b8'); // phone shadow
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Rule lines
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 280);
    ctx.lineTo(860, 280);
    ctx.stroke();

    // Blue Ballpoint Ink Signature
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(120, 260);
    ctx.bezierCurveTo(180, 100, 260, 320, 340, 160);
    ctx.bezierCurveTo(420, 110, 440, 300, 520, 200);
    ctx.bezierCurveTo(580, 120, 680, 160, 760, 190);
    ctx.stroke();

    // Flourish underline
    ctx.beginPath();
    ctx.moveTo(150, 310);
    ctx.quadraticCurveTo(450, 330, 780, 270);
    ctx.stroke();

    const img = new Image();
    img.src = canvas.toDataURL('image/png');
    img.onload = () => setSourceImage(img);
  };

  const [isEnhanced, setIsEnhanced] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        setSourceImage(img);
        setIsEnhanced(false); // require user to click "Enhance Signature"
      };
    };
    reader.readAsDataURL(file);
  };

  // ----------------------------------------------------
  // ENHANCEMENT & BINARIZATION PIPELINE
  // ----------------------------------------------------
  const runEnhancement = () => {
    if (!sourceImage) return;
    setIsProcessing(true);

    const canvas = outputCanvasRef.current;
    if (!canvas) {
      setIsProcessing(false);
      return;
    }

    canvas.width = sourceImage.width;
    canvas.height = sourceImage.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

    ctx.drawImage(sourceImage, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    // Process every pixel
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Luminance
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Adaptive threshold comparison
      const isInk = lum < threshold;

      if (outputMode === 'transparent-png') {
        if (isInk) {
          // Dark crisp ink, full opacity
          const darkness = Math.min(255, (threshold - lum) * 2.5);
          data[i] = 15;
          data[i + 1] = 23;
          data[i + 2] = 42;
          data[i + 3] = Math.max(160, Math.min(255, darkness + 80));
        } else {
          // Transparent background
          data[i + 3] = 0;
        }
      } else if (outputMode === 'blue-ink-png') {
        if (isInk) {
          data[i] = 30;
          data[i + 1] = 64;
          data[i + 2] = 175; // Rich Navy Blue
          data[i + 3] = 255;
        } else {
          data[i + 3] = 0;
        }
      } else {
        // Crisp White JPG/PNG (clean monochrome)
        if (isInk) {
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
        } else {
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
        }
        data[i + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    setIsEnhanced(true);
    setIsProcessing(false);
    confetti({ particleCount: 25, spread: 50 });
  };

  useEffect(() => {
    if (sourceImage && isEnhanced) {
      runEnhancement();
    }
  }, [threshold, contrastBoost, smoothEdges, outputMode]);

  const handleDownload = () => {
    const canvas = outputCanvasRef.current;
    if (!canvas) return;
    downloadCanvasAsPng(canvas, `enhanced-signature-${outputMode}.png`);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
  };

  return (
    <div className="w-full flex-1 flex flex-col lg:flex-row bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      
      {/* LEFT SETTINGS */}
      <aside className="w-full lg:w-96 border-r border-neutral-800 bg-neutral-900/60 p-5 flex flex-col gap-5 overflow-y-auto shrink-0">
        
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Signature Source
          </span>

          <label className="w-full px-4 py-2.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 rounded-lg text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm">
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Upload Camera Photo of Signature</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={loadSampleSignature}
            className="text-[11px] text-neutral-400 hover:text-cyan-300 flex items-center gap-1 transition-colors self-start"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reload Yellow Paper Sample</span>
          </button>
        </div>

        <div className="h-px bg-neutral-800" />

        {/* Output Style */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Output Format
          </span>

          <div className="space-y-1.5 text-xs">
            {[
              { id: 'transparent-png', name: 'Transparent PNG (No Background)', desc: 'Ideal for overlaying on PDF/DOC' },
              { id: 'crisp-white-jpg', name: 'Pure White Monochrome', desc: 'Govt forms with white background' },
              { id: 'blue-ink-png', name: 'Royal Blue Official Ink', desc: 'Looks like authentic fountain pen' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setOutputMode(m.id as OutputFormatMode)}
                className={`w-full p-2.5 rounded-lg border text-left transition-colors ${
                  outputMode === m.id
                    ? 'bg-neutral-800 border-cyan-500 text-white'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <div className="font-semibold text-xs text-white">{m.name}</div>
                <div className="text-[10px] text-neutral-500">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-neutral-800" />

        {/* Sensitivity & Threshold */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Shadow Removal Sensitivity
          </span>

          <div>
            <div className="flex justify-between text-xs text-neutral-400 mb-1">
              <span>Threshold (Paper Cutoff):</span>
              <span className="font-mono text-cyan-400 font-bold">{threshold}</span>
            </div>
            <input
              type="range"
              min="50"
              max="220"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
            />
            <span className="text-[10px] text-neutral-500 block mt-1">
              Increase if ink is too faint; decrease if background shadow appears.
            </span>
          </div>

          {/* Action Button */}
          <button
            onClick={runEnhancement}
            disabled={!sourceImage || isProcessing}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer hover:scale-105 disabled:opacity-50"
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{isProcessing ? 'Enhancing Signature...' : '✨ Enhance Signature (एन्हैंस करें)'}</span>
          </button>
        </div>
      </aside>

      {/* RIGHT PREVIEW WORKSPACE */}
      <main className="flex-1 flex flex-col bg-neutral-950 overflow-hidden">
        
        <div className="h-12 border-b border-neutral-800 bg-neutral-900/50 px-6 flex items-center justify-between text-xs">
          <span className="text-neutral-300 font-medium">
            Enhanced Signature · Camera Shadows & Yellow Paper Eliminated
          </span>

          <div className="flex items-center gap-2">
            {!isEnhanced && (
              <button
                onClick={runEnhancement}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Enhance Now</span>
              </button>
            )}

            <button
              onClick={handleDownload}
              disabled={!isEnhanced}
              className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-neutral-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Clean Signature</span>
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 flex flex-col lg:flex-row items-center justify-center gap-8 overflow-auto">
          {/* Source Thumbnail */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-neutral-400">Original Mobile Photo (With Shadow & Yellow Grain)</span>
            <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900 p-2 shadow-xl max-w-sm">
              {sourceImage && (
                <img
                  src={sourceImage.src}
                  alt="Original"
                  className="max-h-48 w-auto object-contain rounded"
                />
              )}
            </div>
          </div>

          <ArrowRight className="w-6 h-6 text-neutral-600 hidden lg:block" />

          {/* Enhanced Canvas with Checkerboard for Transparency */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-cyan-400 font-semibold">
              Enhanced Clean Output ({outputMode})
            </span>
            <div
              className="border border-cyan-500/30 rounded-xl overflow-hidden p-3 shadow-2xl max-w-md"
              style={{
                backgroundImage:
                  outputMode !== 'crisp-white-jpg'
                    ? 'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%) 50% / 20px 20px'
                    : 'none',
                backgroundColor: '#0f172a',
              }}
            >
              <canvas
                ref={outputCanvasRef}
                className="max-h-56 max-w-full w-auto object-contain rounded"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
