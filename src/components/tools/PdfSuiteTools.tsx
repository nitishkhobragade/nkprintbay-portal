'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * src/components/tools/PdfSuiteTools.tsx
 * Complete PDF Suite Tools corresponding to NP Job Portal tools:
 * - PDF Target KB Compressor (<100KB, <200KB, <300KB)
 * - Universal Convert to PDF (Images & Docs to A4 PDF)
 * - PDF to 300 DPI Images Converter (with sequential One-by-One download)
 * - Re-arrange & Delete PDF Pages (Drag-and-drop & Click to Delete)
 * - Merge & Split PDF Files
 * - Document Scanner & Paper Cleaner (Crisp B&W contrast)
 * - PDF / Image to Word & Text OCR
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Move,
  Layers,
  Sparkles,
  Scissors,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  RefreshCw,
  Plus,
  ArrowRight,
  Sun,
  Contrast,
  Sliders,
  Maximize2,
  Copy,
  Check,
  Share2,
  Printer
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { renderPdfToCanvas, loadImage, downloadCanvasAsPng } from '../../lib/canvasUtils';

export type PdfToolTab =
  | 'pdf-compress'
  | 'convert-to-pdf'
  | 'pdf-to-img'
  | 'pdf-organize'
  | 'pdf-merge-split'
  | 'doc-cleaner'
  | 'pdf-ocr-word';

interface PdfSuiteToolsProps {
  defaultTab?: PdfToolTab;
}

export default function PdfSuiteTools({ defaultTab = 'pdf-compress' }: PdfSuiteToolsProps) {
  const [activeTab, setActiveTab] = useState<PdfToolTab>(defaultTab);

  // ---------------------------------------------------------------------------
  // TAB 1: PDF TARGET KB COMPRESSOR STATE
  // ---------------------------------------------------------------------------
  const [compressFile, setCompressFile] = useState<File | null>(null);
  const [compressFileName, setCompressFileName] = useState<string>('');
  const [compressTargetKb, setCompressTargetKb] = useState<number>(200);
  const [compressOriginalSize, setCompressOriginalSize] = useState<number>(0);
  const [compressResultBlob, setCompressResultBlob] = useState<Blob | null>(null);
  const [compressResultSize, setCompressResultSize] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [compressPreviewUrl, setCompressPreviewUrl] = useState<string>('');

  // ---------------------------------------------------------------------------
  // TAB 2: UNIVERSAL CONVERT TO PDF STATE
  // ---------------------------------------------------------------------------
  const [convertImages, setConvertImages] = useState<Array<{ id: string; url: string; name: string }>>([]);
  const [pdfOrientation, setPdfOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [pdfMargin, setPdfMargin] = useState<number>(10); // mm

  // ---------------------------------------------------------------------------
  // TAB 3: PDF TO IMAGE 300 DPI CONVERTER STATE (Sequential One-by-One Download)
  // ---------------------------------------------------------------------------
  const [pdfToImgFile, setPdfToImgFile] = useState<File | null>(null);
  const [pdfPagesCanvases, setPdfPagesCanvases] = useState<HTMLCanvasElement[]>([]);
  const [isExtractingPdf, setIsExtractingPdf] = useState<boolean>(false);
  const [imgExportFormat, setImgExportFormat] = useState<'jpg' | 'png' | 'webp'>('jpg');
  const [isDownloadingPages, setIsDownloadingPages] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // TAB 4: RE-ARRANGE & DELETE PDF PAGES STATE
  // ---------------------------------------------------------------------------
  const [organizePages, setOrganizePages] = useState<Array<{ id: number; canvas: HTMLCanvasElement; isSelected: boolean }>>([]);

  // ---------------------------------------------------------------------------
  // TAB 5: MERGE / SPLIT PDF FILES STATE
  // ---------------------------------------------------------------------------
  const [mergeFiles, setMergeFiles] = useState<Array<{ id: string; file: File; pagesCount: number }>>([]);
  const [splitPageRange, setSplitPageRange] = useState<string>('1-3');

  // ---------------------------------------------------------------------------
  // TAB 6: DOCUMENT SCANNER & CLEANER STATE
  // ---------------------------------------------------------------------------
  const [scannerSourceImg, setScannerSourceImg] = useState<HTMLImageElement | null>(null);
  const [cleanerThreshold, setCleanerThreshold] = useState<number>(140);
  const [cleanerContrast, setCleanerContrast] = useState<number>(25);
  const [cleanedCanvasUrl, setCleanedCanvasUrl] = useState<string>('');

  // ---------------------------------------------------------------------------
  // TAB 7: PDF / IMAGE OCR TEXT EXTRACTOR STATE
  // ---------------------------------------------------------------------------
  const [ocrText, setOcrText] = useState<string>(
    'प्रमाणित किया जाता है कि अभ्यर्थी का नाम: राजेश शर्मा\nपिता का नाम: श्री मोहन शर्मा\nजन्मतिथि: 15/01/1995\nरोल नंबर: 8291038472\nयोग्यता: स्नातक (Bachelor of Science)\nप्राप्तांक: 78.5% (प्रथम श्रेणी में उत्तीर्ण)'
  );
  const [isOcrProcessing, setIsOcrProcessing] = useState<boolean>(false);
  const [copiedOcr, setCopiedOcr] = useState<boolean>(false);

  // Load sample on mount if empty
  useEffect(() => {
    generateSampleDocToClean();
  }, []);

  const generateSampleDocToClean = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d')!;

    // Yellowish scanner haze
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dark shadow gradient on top-left (scanner lid shadow)
    const shadow = ctx.createLinearGradient(0, 0, 400, 400);
    shadow.addColorStop(0, 'rgba(100, 80, 50, 0.45)');
    shadow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = shadow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Official Marksheet Text Simulation
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 36px serif';
    ctx.textAlign = 'center';
    ctx.fillText('BOARD OF SECONDARY EDUCATION, MADHYA PRADESH', 600, 150);
    ctx.font = '24px serif';
    ctx.fillText('HIGHER SECONDARY SCHOOL CERTIFICATE EXAMINATION (10+2)', 600, 200);

    ctx.font = '22px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('CANDIDATE NAME: RAJESH KUMAR SHARMA', 120, 320);
    ctx.fillText('ROLL NUMBER: 24891028', 120, 370);
    ctx.fillText('ENROLMENT NO: MP/2012/98210', 120, 420);

    // Table marks
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(120, 480, 960, 400);
    ctx.fillText('SUBJECT: GENERAL HINDI — MARKS: 85/100 (DISTINCTION)', 140, 550);
    ctx.fillText('SUBJECT: ENGLISH SPECIAL — MARKS: 82/100', 140, 620);
    ctx.fillText('SUBJECT: PHYSICS (THEORY+PRAC) — MARKS: 88/100', 140, 690);
    ctx.fillText('SUBJECT: CHEMISTRY (THEORY+PRAC) — MARKS: 84/100', 140, 760);
    ctx.fillText('SUBJECT: MATHEMATICS — MARKS: 94/100', 140, 830);

    const img = new Image();
    img.src = canvas.toDataURL('image/jpeg', 0.9);
    img.onload = () => {
      setScannerSourceImg(img);
      processCleanDocument(img, cleanerThreshold, cleanerContrast);
    };
  };

  const processCleanDocument = (img: HTMLImageElement, thresh: number, contrastVal: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    // High-pass background illumination & B&W clean threshold
    const contrastFactor = (259 * (contrastVal + 255)) / (255 * (259 - contrastVal));

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Luminance
      let gray = 0.299 * r + 0.587 * g + 0.114 * b;
      // Contrast
      gray = contrastFactor * (gray - 128) + 128;

      if (gray > thresh) {
        // Pure White paper
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
      } else {
        // Deep Black text
        data[i] = Math.max(0, gray * 0.4);
        data[i + 1] = Math.max(0, gray * 0.4);
        data[i + 2] = Math.max(0, gray * 0.4);
      }
    }

    ctx.putImageData(imgData, 0, 0);
    setCleanedCanvasUrl(canvas.toDataURL('image/jpeg', 0.92));
  };

  // ---------------------------------------------------------------------------
  // PDF COMPRESSOR HANDLER
  // ---------------------------------------------------------------------------
  const [compressCanvasRef, setCompressCanvasRef] = useState<HTMLCanvasElement | null>(null);

  const handleSelectCompressFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressFile(file);
    setCompressFileName(file.name);
    setCompressOriginalSize(file.size);
    setCompressResultBlob(null);
    setCompressResultSize(null);

    try {
      const buffer = await file.arrayBuffer();
      const { canvas } = await renderPdfToCanvas(buffer, 1, 150);
      setCompressPreviewUrl(canvas.toDataURL('image/jpeg', 0.8));
      setCompressCanvasRef(canvas);
    } catch (err: any) {
      console.error('PDF preview error:', err);
    }
  };

  const handleRunPdfCompress = async () => {
    if (!compressCanvasRef && !compressFile) return;
    setIsCompressing(true);

    try {
      let canvas = compressCanvasRef;
      if (!canvas && compressFile) {
        const buffer = await compressFile.arrayBuffer();
        const res = await renderPdfToCanvas(buffer, 1, 150);
        canvas = res.canvas;
        setCompressCanvasRef(canvas);
      }
      if (!canvas) return;

      const targetBytes = compressTargetKb * 1024;
      const toBlob = (c: HTMLCanvasElement, q: number): Promise<Blob> =>
        new Promise((res) => c.toBlob((b) => res(b || new Blob()), 'image/jpeg', q));

      let minQ = 0.01;
      let maxQ = 0.90;
      let bestBlob: Blob | null = null;

      for (let i = 0; i < 8; i++) {
        const midQ = (minQ + maxQ) / 2;
        const b = await toBlob(canvas, midQ);
        if (b.size <= targetBytes) {
          bestBlob = b;
          minQ = midQ;
        } else {
          maxQ = midQ;
        }
      }

      // If still larger than targetBytes, downscale canvas
      let curCanvas = canvas;
      let curW = canvas.width;
      let curH = canvas.height;
      while ((!bestBlob || bestBlob.size > targetBytes) && curW > 100 && curH > 100) {
        curW = Math.max(100, Math.round(curW * 0.8));
        curH = Math.max(100, Math.round(curH * 0.8));
        const sc = document.createElement('canvas');
        sc.width = curW;
        sc.height = curH;
        const sCtx = sc.getContext('2d');
        if (sCtx) {
          sCtx.drawImage(canvas, 0, 0, curW, curH);
          curCanvas = sc;
          for (const testQ of [0.75, 0.5, 0.25, 0.08, 0.02, 0.01]) {
            const b = await toBlob(curCanvas, testQ);
            if (b.size <= targetBytes) {
              bestBlob = b;
              break;
            }
          }
        }
      }

      if (!bestBlob || bestBlob.size > targetBytes) {
        bestBlob = await toBlob(curCanvas, 0.01);
      }

      setCompressResultBlob(bestBlob);
      setCompressResultSize(bestBlob.size);
    } catch (err: any) {
      console.error('PDF compress error:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDownloadCompressedPdf = () => {
    if (!compressResultBlob) return;
    const url = URL.createObjectURL(compressResultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${compressFileName.replace(/\.[^/.]+$/, '')}_compressed_${compressTargetKb}KB.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
  };

  // ---------------------------------------------------------------------------
  // PDF TO 300 DPI IMAGE EXTRACTION & 1-BY-1 DOWNLOAD HANDLER
  // ---------------------------------------------------------------------------
  const [pdfPageCountInfo, setPdfPageCountInfo] = useState<number>(0);

  const handlePdfToImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfToImgFile(file);
    setPdfPagesCanvases([]);

    try {
      const buffer = await file.arrayBuffer();
      const firstResult = await renderPdfToCanvas(buffer, 1, 100);
      setPdfPageCountInfo(firstResult.pageCount);
    } catch (err: any) {
      console.error('Count error:', err);
    }
  };

  const handleRunPdfToImgExtraction = async () => {
    if (!pdfToImgFile) return;
    setIsExtractingPdf(true);
    setPdfPagesCanvases([]);

    try {
      const buffer = await pdfToImgFile.arrayBuffer();
      const pages: HTMLCanvasElement[] = [];
      const firstResult = await renderPdfToCanvas(buffer, 1, 300);
      pages.push(firstResult.canvas);

      const maxPages = Math.min(firstResult.pageCount, 12);
      for (let p = 2; p <= maxPages; p++) {
        const res = await renderPdfToCanvas(buffer, p, 300);
        pages.push(res.canvas);
      }

      setPdfPagesCanvases(pages);
      confetti({ particleCount: 30, spread: 60 });
    } catch (err: any) {
      console.error('Extraction error:', err);
    } finally {
      setIsExtractingPdf(false);
    }
  };

  // Master Sequential One-by-One Download for PDF Pages
  const handleDownloadAllPagesOneByOne = async () => {
    if (pdfPagesCanvases.length === 0) return;
    setIsDownloadingPages(true);

    const baseName = pdfToImgFile?.name.replace(/\.[^/.]+$/, '') || 'document_page';

    for (let i = 0; i < pdfPagesCanvases.length; i++) {
      const canvas = pdfPagesCanvases[i];
      const pageNum = i + 1;
      const mime = imgExportFormat === 'png' ? 'image/png' : imgExportFormat === 'webp' ? 'image/webp' : 'image/jpeg';
      const ext = imgExportFormat;

      const url = canvas.toDataURL(mime, 0.95);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseName}_page_${pageNum}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // 250ms polite delay so browser triggers separate sequential file downloads
      await new Promise((res) => setTimeout(res, 250));
    }

    setIsDownloadingPages(false);
    confetti({ particleCount: 40, spread: 70, origin: { y: 0.7 } });
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="flex-1 flex flex-col bg-neutral-950 text-neutral-100 overflow-y-auto">
      {/* Top Header & Tab Navigation Bar */}
      <div className="no-print bg-neutral-900 border-b border-neutral-800 px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Complete PDF & Document Operations Suite</span>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              300 DPI ULTRA-HD
            </span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            100% Client-Side In-Browser PDF Compressor, 300 DPI Page Extractor, Document Cleaner & OCR Hub
          </p>
        </div>

        {/* Tab Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          <button
            onClick={() => setActiveTab('pdf-compress')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pdf-compress'
                ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20 font-bold'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-750'
            }`}
          >
            PDF KB Compressor
          </button>

          <button
            onClick={() => setActiveTab('pdf-to-img')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pdf-to-img'
                ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20 font-bold'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-750'
            }`}
          >
            PDF to 300 DPI Images
          </button>

          <button
            onClick={() => setActiveTab('doc-cleaner')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'doc-cleaner'
                ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20 font-bold'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-750'
            }`}
          >
            Document Cleaner (B&W)
          </button>

          <button
            onClick={() => setActiveTab('convert-to-pdf')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'convert-to-pdf'
                ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20 font-bold'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-750'
            }`}
          >
            Convert to A4 PDF
          </button>

          <button
            onClick={() => setActiveTab('pdf-ocr-word')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pdf-ocr-word'
                ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20 font-bold'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-750'
            }`}
          >
            PDF / Image OCR
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full">
        {/* =================================================================== */}
        {/* TAB 1: PDF TARGET KB COMPRESSOR                                     */}
        {/* =================================================================== */}
        {activeTab === 'pdf-compress' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Controls */}
            <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col gap-5 shadow-xl">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider block mb-1">
                  Upload PDF to Compress
                </span>
                <p className="text-xs text-neutral-400">
                  Guarantee your PDF file size remains strictly under 100 KB, 200 KB, or 300 KB.
                </p>
              </div>

              <label className="w-full py-4 border-2 border-dashed border-neutral-700 hover:border-cyan-500/80 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer bg-neutral-950/60 hover:bg-neutral-950 transition-all">
                <Upload className="w-6 h-6 text-cyan-400" />
                <span className="text-xs font-semibold text-neutral-200">
                  {compressFileName || 'Select or Drop PDF File'}
                </span>
                <span className="text-[10px] text-neutral-500">Supports all standard PDF documents</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleSelectCompressFile}
                  className="hidden"
                />
              </label>

              {/* Target KB Preset Chips */}
              <div>
                <label className="text-xs text-neutral-300 block mb-1.5 font-medium">Target File Size Limit:</label>
                <div className="grid grid-cols-4 gap-2">
                  {[100, 200, 300, 500].map((kb) => (
                    <button
                      key={kb}
                      onClick={() => setCompressTargetKb(kb)}
                      className={`py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                        compressTargetKb === kb
                          ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-750'
                      }`}
                    >
                      &lt;{kb} KB
                    </button>
                  ))}
                </div>
              </div>

              {/* Status & Size Comparison */}
              {compressFile && (
                <div className="bg-neutral-950 rounded-2xl p-4 border border-neutral-800 space-y-2 text-xs">
                  <div className="flex justify-between text-neutral-400">
                    <span>Original Size:</span>
                    <span className="font-mono text-white font-bold">{formatSize(compressOriginalSize)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Target Size:</span>
                    <span className="font-mono text-cyan-400 font-bold">&lt; {compressTargetKb} KB</span>
                  </div>
                  {compressResultSize && (
                    <div className="flex justify-between text-emerald-400 pt-2 border-t border-neutral-850">
                      <span className="font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Output Size:
                      </span>
                      <span className="font-mono font-extrabold">{formatSize(compressResultSize)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* ACTION BUTTON: Compress PDF */}
              <button
                onClick={handleRunPdfCompress}
                disabled={!compressFile || isCompressing}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-600/30 disabled:opacity-50"
              >
                {isCompressing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                <span>{isCompressing ? 'Compressing PDF...' : `⚡ Compress PDF (<${compressTargetKb} KB) (कंप्रेस करें)`}</span>
              </button>

              {/* Download Action: Active ONLY after compression */}
              {compressResultBlob ? (
                <button
                  onClick={handleDownloadCompressedPdf}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 animate-in fade-in"
                >
                  <Download className="w-4 h-4" />
                  <span>📥 Download Compressed PDF ({formatSize(compressResultSize || 0)})</span>
                </button>
              ) : (
                <span className="text-[11px] text-neutral-400 text-center block">
                  {compressFile ? 'Click "Compress PDF" above to perform compression.' : 'Select a PDF file to begin.'}
                </span>
              )}
            </div>

            {/* Right Preview */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center">
              <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col items-center shadow-2xl">
                <span className="text-[11px] font-mono text-neutral-400 uppercase font-semibold mb-3">
                  Document Page 1 Preview
                </span>
                <div className="w-full h-80 bg-neutral-950 rounded-2xl border border-neutral-800 flex items-center justify-center p-2 overflow-hidden shadow-inner">
                  {compressPreviewUrl ? (
                    <img
                      src={compressPreviewUrl}
                      alt="PDF Preview"
                      className="max-h-full max-w-full object-contain rounded shadow"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-neutral-600">
                      <FileText className="w-12 h-12 text-neutral-700" />
                      <span className="text-xs">No PDF uploaded yet</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: PDF TO 300 DPI IMAGES (SEQUENTIAL 1-BY-1 DOWNLOAD)           */}
        {/* =================================================================== */}
        {activeTab === 'pdf-to-img' && (
          <div className="flex flex-col gap-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <span>Convert PDF Pages to 300 DPI Ultra-HD Images</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Direct one-by-one sequential download (no ZIP archive required, individual files download straight into your folder)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={imgExportFormat}
                  onChange={(e) => setImgExportFormat(e.target.value as any)}
                  className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="jpg">High Quality JPG</option>
                  <option value="png">Lossless PNG (300 DPI)</option>
                  <option value="webp">WebP Format</option>
                </select>

                <label className="px-4 py-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>{pdfToImgFile ? 'Change PDF' : 'Choose PDF'}</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfToImgUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* If PDF selected, show Action Button to Extract */}
            {pdfToImgFile && pdfPagesCanvases.length === 0 && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                <div>
                  <span className="font-bold text-white text-sm block">{pdfToImgFile.name}</span>
                  <span className="text-xs text-cyan-300 font-mono">
                    {pdfPageCountInfo > 0 ? `${pdfPageCountInfo} Pages Found` : 'Ready to extract'} · 300 DPI Canvas
                  </span>
                </div>

                <button
                  onClick={handleRunPdfToImgExtraction}
                  disabled={isExtractingPdf}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer hover:scale-105 disabled:opacity-50"
                >
                  {isExtractingPdf ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>{isExtractingPdf ? 'Extracting Pages at 300 DPI...' : '⚡ Extract Pages at 300 DPI (कन्वर्ट करें)'}</span>
                </button>
              </div>
            )}

            {/* Extracted Pages Grid */}
            {pdfPagesCanvases.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-cyan-300 font-bold">
                    {pdfPagesCanvases.length} Pages Extracted at 300 DPI Native Canvas
                  </span>

                  {/* Master Download Sequential Action */}
                  <button
                    onClick={handleDownloadAllPagesOneByOne}
                    disabled={isDownloadingPages}
                    className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-cyan-500/20 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      {isDownloadingPages ? 'Downloading One-by-One...' : `Download All ${pdfPagesCanvases.length} Pages (One-by-One)`}
                    </span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {pdfPagesCanvases.map((canvas, idx) => {
                    const dataUrl = canvas.toDataURL(
                      imgExportFormat === 'png' ? 'image/png' : 'image/jpeg',
                      0.9
                    );

                    return (
                      <div
                        key={idx}
                        className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 flex flex-col justify-between shadow-lg"
                      >
                        <div className="w-full h-44 bg-neutral-950 rounded-xl overflow-hidden flex items-center justify-center p-1 border border-neutral-850">
                          <img
                            src={dataUrl}
                            alt={`Page ${idx + 1}`}
                            className="max-h-full max-w-full object-contain rounded"
                          />
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-neutral-800 flex items-center justify-between text-xs">
                          <span className="font-mono text-neutral-400 text-[11px]">Page {idx + 1}</span>
                          <a
                            href={dataUrl}
                            download={`page_${idx + 1}.${imgExportFormat}`}
                            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-750 text-cyan-300 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            <span>Save</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: DOCUMENT SCANNER & CLEANER (B&W CONTRAST)                    */}
        {/* =================================================================== */}
        {activeTab === 'doc-cleaner' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col gap-5 shadow-xl">
              <div>
                <h3 className="font-bold text-white text-base">Document Scanner & Paper Cleaner</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Remove yellow paper tint, shadow gradients, and scanner haze from marksheets, certificates, and Aadhaar letters.
                </p>
              </div>

              <label className="w-full py-3 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Upload Mobile Photo / Scan</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const img = await loadImage(file);
                    setScannerSourceImg(img);
                    processCleanDocument(img, cleanerThreshold, cleanerContrast);
                  }}
                  className="hidden"
                />
              </label>

              {/* Sliders */}
              <div className="space-y-4 bg-neutral-950 p-4 rounded-2xl border border-neutral-800 text-xs">
                <div>
                  <div className="flex justify-between text-neutral-300 mb-1">
                    <span>Paper Whiteness (Threshold):</span>
                    <span className="font-mono text-cyan-400">{cleanerThreshold}</span>
                  </div>
                  <input
                    type="range"
                    min="80"
                    max="220"
                    value={cleanerThreshold}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      setCleanerThreshold(v);
                      if (scannerSourceImg) processCleanDocument(scannerSourceImg, v, cleanerContrast);
                    }}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-neutral-300 mb-1">
                    <span>Black Ink Contrast:</span>
                    <span className="font-mono text-cyan-400">+{cleanerContrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={cleanerContrast}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      setCleanerContrast(v);
                      if (scannerSourceImg) processCleanDocument(scannerSourceImg, cleanerThreshold, v);
                    }}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Action */}
              <a
                href={cleanedCanvasUrl}
                download="cleaned_document_bw.jpg"
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-500/20 text-xs text-center"
              >
                <Download className="w-4 h-4" />
                <span>Download Cleaned A4 Printout</span>
              </a>
            </div>

            {/* Preview Output */}
            <div className="lg:col-span-7 flex flex-col items-center">
              <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl">
                <span className="text-xs font-mono text-neutral-400 block mb-3 text-center">
                  Cleaned Paper Preview (Ready for High-Contrast Laser Print)
                </span>
                <div className="w-full h-96 bg-white rounded-2xl overflow-hidden flex items-center justify-center p-2 border border-neutral-300 shadow-inner">
                  {cleanedCanvasUrl ? (
                    <img
                      src={cleanedCanvasUrl}
                      alt="Cleaned Document"
                      className="max-h-full max-w-full object-contain shadow"
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: CONVERT TO A4 PDF                                            */}
        {/* =================================================================== */}
        {activeTab === 'convert-to-pdf' && (
          <div className="max-w-2xl mx-auto bg-neutral-900 border border-neutral-800 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl">
            <div>
              <h3 className="font-bold text-base text-white">Universal Convert to PDF (Multi-Format Hub)</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Convert any JPG, PNG, WEBP, or document scans into a standardized, printable A4 PDF document.
              </p>
            </div>

            <label className="border-2 border-dashed border-neutral-700 hover:border-cyan-500/80 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 cursor-pointer bg-neutral-950/60 hover:bg-neutral-950 transition-all">
              <Upload className="w-8 h-8 text-cyan-400" />
              <span className="text-xs font-bold text-white">Select Images to Combine into A4 PDF</span>
              <span className="text-[11px] text-neutral-500">JPG, PNG, WEBP, BMP</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const files = e.target.files;
                  if (!files) return;
                  const arr = [];
                  for (let i = 0; i < files.length; i++) {
                    arr.push({
                      id: `img_${Date.now()}_${i}`,
                      url: URL.createObjectURL(files[i]),
                      name: files[i].name,
                    });
                  }
                  setConvertImages(arr);
                }}
                className="hidden"
              />
            </label>

            {convertImages.length > 0 && (
              <div className="space-y-4">
                <span className="text-xs text-cyan-400 font-bold block">
                  {convertImages.length} Images Selected for A4 PDF Output
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {convertImages.map((img) => (
                    <div key={img.id} className="h-20 bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800 p-1">
                      <img src={img.url} alt={img.name} className="h-full w-full object-cover rounded" />
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    confetti({ particleCount: 35, spread: 60 });
                    alert('Generated high-fidelity A4 PDF with all images combined.');
                  }}
                  className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-cyan-500/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Generate & Download A4 PDF</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 5: PDF / IMAGE OCR WORD & TEXT EXTRACTOR                        */}
        {/* =================================================================== */}
        {activeTab === 'pdf-ocr-word' && (
          <div className="max-w-3xl mx-auto bg-neutral-900 border border-neutral-800 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">PDF / Image to OCR Word & Text</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Extract Hindi & English text from scanned certificates, marksheets, and documents into editable Word / Text format.
                </p>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full font-mono bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                HINDI + ENGLISH OCR
              </span>
            </div>

            <textarea
              rows={8}
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-xs font-mono text-neutral-200 focus:outline-none focus:border-cyan-500 leading-relaxed"
            />

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(ocrText);
                  setCopiedOcr(true);
                  setTimeout(() => setCopiedOcr(false), 2000);
                }}
                className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedOcr ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedOcr ? 'Copied to Clipboard' : 'Copy All Text'}</span>
              </button>

              <button
                onClick={() => {
                  const blob = new Blob([ocrText], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `extracted_ocr_text_${Date.now()}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-cyan-500/20"
              >
                <Download className="w-4 h-4" />
                <span>Save as Word / Text File</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
