/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CardProcessor.tsx
 * Complete core Document & ID Card Processing Engine for Print Portal.
 * Handles PDFs (300 DPI via pdfjs-dist), Raw Mobile Scans (contour detection & homography deskew),
 * Ultra-HD quality filters, and A4 300 DPI sheet assembly.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText,
  Camera,
  Printer,
  Download,
  RotateCcw,
  Sliders,
  Sparkles,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Layers,
  CheckCircle2,
  AlertCircle,
  Scissors,
  FileCheck,
  RefreshCw,
  Eye,
  Settings2,
  CornerDownRight,
  Move
} from 'lucide-react';
import confetti from 'canvas-confetti';

import {
  CR80_WIDTH_PX,
  CR80_HEIGHT_PX,
  CR80_WIDTH_MM,
  CR80_HEIGHT_MM,
  A4_WIDTH_PX,
  A4_HEIGHT_PX,
  A4_WIDTH_MM,
  A4_HEIGHT_MM,
  Point2D,
  Quadrilateral,
  NormalizedRect,
  DOCUMENT_PRESETS,
  PresetCardLayout,
  FilterEnhanceMode,
  FilterOptions,
  DEFAULT_FILTER_OPTIONS,
  A4AssemblyOptions,
  DEFAULT_A4_OPTIONS,
  renderPdfToCanvas,
  detectCardCorners,
  cropRectToCard,
  warpQuadrilateralToCard,
  enhanceCardCanvas,
  assembleA4Canvas,
  downloadCanvasAsPng,
  triggerPrintA4,
  loadImage,
  getDefaultQuad
} from '../lib/canvasUtils';

import {
  executeNativePrint,
  PRINTER_HARDWARE_PRESETS,
  detectEnvironment
} from '../lib/nativePrint';

import {
  generateSampleAadhaarCanvas,
  generateSampleAngledMobilePhoto
} from '../lib/sampleDocuments';

type InputMode = 'pdf-preset' | 'raw-image';

export default function CardProcessor() {
  // ----------------------------------------------------
  // ENGINE STATE
  // ----------------------------------------------------
  const [inputMode, setInputMode] = useState<InputMode>('pdf-preset');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Ready for document upload or sample selection');

  // Loaded Source Canvas
  const [sourceCanvas, setSourceCanvas] = useState<HTMLCanvasElement | null>(null);
  const [sourceFileName, setSourceFileName] = useState<string>('sample-aadhaar-letter.pdf');
  const [pdfPageCount, setPdfPageCount] = useState<number>(1);
  const [currentPdfPage, setCurrentPdfPage] = useState<number>(1);

  // Mode 1: PDF Presets & Normalized Boxes
  const [selectedPresetId, setSelectedPresetId] = useState<string>('aadhaar-letter');
  const [frontRect, setFrontRect] = useState<NormalizedRect>(DOCUMENT_PRESETS[0].front);
  const [backRect, setBackRect] = useState<NormalizedRect>(DOCUMENT_PRESETS[0].back);
  const [activeRectDrag, setActiveRectDrag] = useState<'front' | 'back' | null>(null);

  // Mode 2: Raw Scan Perspective Quad (4 Corners)
  const [cropQuad, setCropQuad] = useState<Quadrilateral>([
    { x: 100, y: 100 },
    { x: 900, y: 100 },
    { x: 900, y: 600 },
    { x: 100, y: 600 }
  ]);
  const [activeCornerDrag, setActiveCornerDrag] = useState<number | null>(null); // 0: TL, 1: TR, 2: BR, 3: BL
  const [rawTargetSide, setRawTargetSide] = useState<'front' | 'back'>('front');

  // Ultra-HD Quality & Enhancement Filters
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(DEFAULT_FILTER_OPTIONS);

  // Final Extracted Cards (Ultra-HD 1012x638 @ 300 DPI)
  const [frontCardCanvas, setFrontCardCanvas] = useState<HTMLCanvasElement | null>(null);
  const [backCardCanvas, setBackCardCanvas] = useState<HTMLCanvasElement | null>(null);

  // A4 Assembly Settings & Canvas
  const [a4Options, setA4Options] = useState<A4AssemblyOptions>(DEFAULT_A4_OPTIONS);
  const [assembledA4Canvas, setAssembledA4Canvas] = useState<HTMLCanvasElement | null>(null);
  const [selectedPrinterPreset, setSelectedPrinterPreset] = useState<string>('standard-a4-borderless');

  // UI Viewport / Active Tabs
  const [activeViewTab, setActiveViewTab] = useState<'editor' | 'preview-a4' | 'cards'>('editor');
  const [previewZoom, setPreviewZoom] = useState<number>(1);

  // Canvas Refs
  const editorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const a4PreviewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ----------------------------------------------------
  // INITIALIZATION: Load Default Sample Document
  // ----------------------------------------------------
  useEffect(() => {
    loadSampleAadhaar();
  }, []);

  const loadSampleAadhaar = () => {
    setIsProcessing(true);
    setStatusMessage('Rendering 300 DPI sample Aadhaar document...');
    setTimeout(() => {
      try {
        const sampleCanvas = generateSampleAadhaarCanvas();
        setSourceCanvas(sampleCanvas);
        setSourceFileName('sample-official-aadhaar.pdf');
        setInputMode('pdf-preset');
        setSelectedPresetId('aadhaar-letter');
        setFrontRect(DOCUMENT_PRESETS[0].front);
        setBackRect(DOCUMENT_PRESETS[0].back);
        setPdfPageCount(1);
        setCurrentPdfPage(1);

        // Process cards immediately
        extractAndAssembleCards(sampleCanvas, 'pdf-preset', DOCUMENT_PRESETS[0].front, DOCUMENT_PRESETS[0].back, filterOptions, a4Options);
        setStatusMessage('Rendered Aadhaar document at 300 DPI (2480 × 3508 px). Front & back card extracted.');
      } catch (err: any) {
        setStatusMessage(`Error loading sample: ${err.message}`);
      } finally {
        setIsProcessing(false);
      }
    }, 50);
  };

  const loadSampleRawMobileScan = () => {
    setIsProcessing(true);
    setStatusMessage('Generating skewed mobile camera photo with desk background...');
    setTimeout(() => {
      try {
        const { canvas: mobileCanvas, trueQuad } = generateSampleAngledMobilePhoto();
        setSourceCanvas(mobileCanvas);
        setSourceFileName('mobile_scan_camera_capture.jpg');
        setInputMode('raw-image');

        // Run auto-detection
        const detected = detectCardCorners(mobileCanvas);
        setCropQuad(detected);

        // Extract card side
        const cropped = warpQuadrilateralToCard(mobileCanvas, detected, CR80_WIDTH_PX, CR80_HEIGHT_PX);
        const enhanced = enhanceCardCanvas(cropped, filterOptions);

        setFrontCardCanvas(enhanced);
        const a4 = assembleA4Canvas(enhanced, backCardCanvas, a4Options);
        setAssembledA4Canvas(a4);

        setStatusMessage('Detected card contour via Sobel edge analysis. Perspective deskewed to 1012 × 638 px.');
      } catch (err: any) {
        setStatusMessage(`Error loading raw scan: ${err.message}`);
      } finally {
        setIsProcessing(false);
      }
    }, 50);
  };

  // ----------------------------------------------------
  // UNIFIED FILE UPLOAD HANDLER (PDF & IMAGES)
  // ----------------------------------------------------
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const fileName = file.name;
    setSourceFileName(fileName);

    try {
      if (file.type === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
        setStatusMessage(`Parsing PDF "${fileName}" at True 300 DPI via PDF.js...`);
        const buffer = await file.arrayBuffer();
        const renderResult = await renderPdfToCanvas(buffer, 1, 300);

        setSourceCanvas(renderResult.canvas);
        setPdfPageCount(renderResult.pageCount);
        setCurrentPdfPage(1);
        setInputMode('pdf-preset');

        // Apply preset
        const preset = DOCUMENT_PRESETS.find(p => p.id === selectedPresetId) || DOCUMENT_PRESETS[0];
        setFrontRect(preset.front);
        setBackRect(preset.back);

        extractAndAssembleCards(
          renderResult.canvas,
          'pdf-preset',
          preset.front,
          preset.back,
          filterOptions,
          a4Options
        );
        setStatusMessage(`PDF loaded: 300 DPI canvas (${renderResult.width} × ${renderResult.height} px, Scale: ${renderResult.scale.toFixed(2)}x)`);
      } else {
        // Raw Image Upload (JPEG, PNG, WebP)
        setStatusMessage(`Loading image "${fileName}" and running edge contour analysis...`);
        const img = await loadImage(file);
        const imgCanvas = document.createElement('canvas');
        imgCanvas.width = img.naturalWidth || img.width;
        imgCanvas.height = img.naturalHeight || img.height;
        const ctx = imgCanvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);

        setSourceCanvas(imgCanvas);
        setInputMode('raw-image');

        // Run auto-detection
        const detectedQuad = detectCardCorners(imgCanvas);
        setCropQuad(detectedQuad);

        // Warp detected card
        const warped = warpQuadrilateralToCard(imgCanvas, detectedQuad, CR80_WIDTH_PX, CR80_HEIGHT_PX);
        const enhanced = enhanceCardCanvas(warped, filterOptions);

        if (rawTargetSide === 'front') {
          setFrontCardCanvas(enhanced);
          const a4 = assembleA4Canvas(enhanced, backCardCanvas, a4Options);
          setAssembledA4Canvas(a4);
        } else {
          setBackCardCanvas(enhanced);
          const a4 = assembleA4Canvas(frontCardCanvas, enhanced, a4Options);
          setAssembledA4Canvas(a4);
        }

        setStatusMessage(`Image loaded (${imgCanvas.width} × ${imgCanvas.height} px). Card corners auto-detected.`);
      }
    } catch (error: any) {
      console.error('File load error:', error);
      setStatusMessage(`Upload failed: ${error.message || 'Unknown processing error'}`);
    } finally {
      setIsProcessing(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ----------------------------------------------------
  // EXTRACTION & PROCESSING PIPELINE
  // ----------------------------------------------------
  const extractAndAssembleCards = useCallback((
    source: HTMLCanvasElement | null,
    mode: InputMode,
    fRect: NormalizedRect,
    bRect: NormalizedRect,
    filters: FilterOptions,
    a4Opts: A4AssemblyOptions
  ) => {
    if (!source) return;

    if (mode === 'pdf-preset') {
      // 1. Crop Front Card
      const rawFront = cropRectToCard(source, fRect, CR80_WIDTH_PX, CR80_HEIGHT_PX);
      const enhancedFront = enhanceCardCanvas(rawFront, filters);
      setFrontCardCanvas(enhancedFront);

      // 2. Crop Back Card
      const rawBack = cropRectToCard(source, bRect, CR80_WIDTH_PX, CR80_HEIGHT_PX);
      const enhancedBack = enhanceCardCanvas(rawBack, filters);
      setBackCardCanvas(enhancedBack);

      // 3. Assemble onto 300 DPI A4 Canvas
      const a4 = assembleA4Canvas(enhancedFront, enhancedBack, a4Opts);
      setAssembledA4Canvas(a4);
    }
  }, []);

  // Update extraction when filters or preset boxes change
  const reprocessCurrentDoc = useCallback(() => {
    if (!sourceCanvas) return;
    if (inputMode === 'pdf-preset') {
      extractAndAssembleCards(sourceCanvas, inputMode, frontRect, backRect, filterOptions, a4Options);
    } else {
      // Raw image mode warp
      const warped = warpQuadrilateralToCard(sourceCanvas, cropQuad, CR80_WIDTH_PX, CR80_HEIGHT_PX);
      const enhanced = enhanceCardCanvas(warped, filterOptions);

      if (rawTargetSide === 'front') {
        setFrontCardCanvas(enhanced);
        const a4 = assembleA4Canvas(enhanced, backCardCanvas, a4Options);
        setAssembledA4Canvas(a4);
      } else {
        setBackCardCanvas(enhanced);
        const a4 = assembleA4Canvas(frontCardCanvas, enhanced, a4Options);
        setAssembledA4Canvas(a4);
      }
    }
  }, [sourceCanvas, inputMode, frontRect, backRect, filterOptions, a4Options, cropQuad, rawTargetSide, frontCardCanvas, backCardCanvas, extractAndAssembleCards]);

  // Handle Preset Change
  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = DOCUMENT_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    setFrontRect(preset.front);
    setBackRect(preset.back);

    if (sourceCanvas) {
      extractAndAssembleCards(sourceCanvas, 'pdf-preset', preset.front, preset.back, filterOptions, a4Options);
      setStatusMessage(`Applied coordinate preset: ${preset.name}`);
    }
  };

  // Re-run Auto-detection for raw image
  const handleRunAutoDetect = () => {
    if (!sourceCanvas) return;
    setIsProcessing(true);
    setTimeout(() => {
      const quad = detectCardCorners(sourceCanvas);
      setCropQuad(quad);
      const warped = warpQuadrilateralToCard(sourceCanvas, quad, CR80_WIDTH_PX, CR80_HEIGHT_PX);
      const enhanced = enhanceCardCanvas(warped, filterOptions);

      if (rawTargetSide === 'front') {
        setFrontCardCanvas(enhanced);
        setAssembledA4Canvas(assembleA4Canvas(enhanced, backCardCanvas, a4Options));
      } else {
        setBackCardCanvas(enhanced);
        setAssembledA4Canvas(assembleA4Canvas(frontCardCanvas, enhanced, a4Options));
      }
      setIsProcessing(false);
      setStatusMessage('Card corners re-analyzed via edge contour Sobel detection.');
    }, 20);
  };

  // Reset Quad to Default Centered Card
  const handleResetQuad = () => {
    if (!sourceCanvas) return;
    const def = getDefaultQuad(sourceCanvas.width, sourceCanvas.height);
    setCropQuad(def);
    const warped = warpQuadrilateralToCard(sourceCanvas, def, CR80_WIDTH_PX, CR80_HEIGHT_PX);
    const enhanced = enhanceCardCanvas(warped, filterOptions);

    if (rawTargetSide === 'front') {
      setFrontCardCanvas(enhanced);
      setAssembledA4Canvas(assembleA4Canvas(enhanced, backCardCanvas, a4Options));
    } else {
      setBackCardCanvas(enhanced);
      setAssembledA4Canvas(assembleA4Canvas(frontCardCanvas, enhanced, a4Options));
    }
    setStatusMessage('Reset crop quadrilateral to default center card.');
  };

  // ----------------------------------------------------
  // RENDER INTERACTIVE EDITOR CANVAS OVERLAY
  // ----------------------------------------------------
  useEffect(() => {
    const canvas = editorCanvasRef.current;
    if (!canvas || !sourceCanvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match dimensions to source canvas
    canvas.width = sourceCanvas.width;
    canvas.height = sourceCanvas.height;

    // Draw Source Image
    ctx.drawImage(sourceCanvas, 0, 0);

    // Dim Background for Contrast
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (inputMode === 'pdf-preset') {
      // 1. Draw Front Card Box (Cyan)
      const fx = Math.round(frontRect.x * canvas.width);
      const fy = Math.round(frontRect.y * canvas.height);
      const fw = Math.round(frontRect.width * canvas.width);
      const fh = Math.round(frontRect.height * canvas.height);

      // Clear dark overlay inside Front box to show bright source
      ctx.drawImage(sourceCanvas, fx, fy, fw, fh, fx, fy, fw, fh);
      ctx.strokeStyle = '#06b6d4'; // Cyan
      ctx.lineWidth = Math.max(3, Math.round(canvas.width * 0.0015));
      ctx.strokeRect(fx, fy, fw, fh);

      // Label
      ctx.fillStyle = '#06b6d4';
      ctx.font = `600 ${Math.max(20, Math.round(canvas.width * 0.012))}px system-ui, sans-serif`;
      ctx.fillText('FRONT CARD (CR80 RATIO)', fx, fy - 12);

      // Resize Handle at Bottom-Right
      drawHandle(ctx, fx + fw, fy + fh, '#06b6d4', canvas.width);
      drawHandle(ctx, fx, fy, '#06b6d4', canvas.width);

      // 2. Draw Back Card Box (Amber)
      const bx = Math.round(backRect.x * canvas.width);
      const by = Math.round(backRect.y * canvas.height);
      const bw = Math.round(backRect.width * canvas.width);
      const bh = Math.round(backRect.height * canvas.height);

      ctx.drawImage(sourceCanvas, bx, by, bw, bh, bx, by, bw, bh);
      ctx.strokeStyle = '#f59e0b'; // Amber
      ctx.lineWidth = Math.max(3, Math.round(canvas.width * 0.0015));
      ctx.strokeRect(bx, by, bw, bh);

      // Label
      ctx.fillStyle = '#f59e0b';
      ctx.font = `600 ${Math.max(20, Math.round(canvas.width * 0.012))}px system-ui, sans-serif`;
      ctx.fillText('BACK CARD (CR80 RATIO)', bx, by - 12);

      drawHandle(ctx, bx + bw, by + bh, '#f59e0b', canvas.width);
      drawHandle(ctx, bx, by, '#f59e0b', canvas.width);

    } else {
      // Raw Image Mode: Draw Interactive 4-Corner Quadrilateral
      const [p0, p1, p2, p3] = cropQuad;

      // Clear quadrilateral polygon to show original brightness
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(sourceCanvas, 0, 0);
      ctx.restore();

      // Polygon Outline
      ctx.strokeStyle = '#10b981'; // Emerald
      ctx.lineWidth = Math.max(3, Math.round(canvas.width * 0.002));
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();
      ctx.stroke();

      // Draw Grid / Perspective Alignment Guidelines
      ctx.save();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // mid horizontal
      ctx.moveTo((p0.x + p3.x) / 2, (p0.y + p3.y) / 2);
      ctx.lineTo((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
      // mid vertical
      ctx.moveTo((p0.x + p1.x) / 2, (p0.y + p1.y) / 2);
      ctx.lineTo((p3.x + p2.x) / 2, (p3.y + p2.y) / 2);
      ctx.stroke();
      ctx.restore();

      // Corner Drag Handles
      const cornerNames = ['TL', 'TR', 'BR', 'BL'];
      cropQuad.forEach((pt, idx) => {
        drawHandle(ctx, pt.x, pt.y, '#10b981', canvas.width, cornerNames[idx]);
      });
    }
  }, [sourceCanvas, inputMode, frontRect, backRect, cropQuad]);

  function drawHandle(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, canvasW: number, text?: string) {
    const radius = Math.max(12, Math.round(canvasW * 0.007));
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (text) {
      ctx.fillStyle = '#0f172a';
      ctx.font = `700 ${Math.max(11, Math.round(radius * 0.85))}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y);
    }
    ctx.restore();
  }

  // ----------------------------------------------------
  // INTERACTIVE CANVAS DRAG INTERACTIONS
  // ----------------------------------------------------
  const handleEditorMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = editorCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    if (inputMode === 'raw-image') {
      // Check which corner handle was clicked
      const handleRadius = Math.max(25, canvas.width * 0.02);
      for (let i = 0; i < 4; i++) {
        const pt = cropQuad[i];
        if (Math.hypot(clickX - pt.x, clickY - pt.y) <= handleRadius) {
          setActiveCornerDrag(i);
          return;
        }
      }
    } else {
      // PDF Presets drag
      const fx = frontRect.x * canvas.width;
      const fy = frontRect.y * canvas.height;
      const fw = frontRect.width * canvas.width;
      const fh = frontRect.height * canvas.height;

      if (clickX >= fx && clickX <= fx + fw && clickY >= fy && clickY <= fy + fh) {
        setActiveRectDrag('front');
        return;
      }

      const bx = backRect.x * canvas.width;
      const by = backRect.y * canvas.height;
      const bw = backRect.width * canvas.width;
      const bh = backRect.height * canvas.height;

      if (clickX >= bx && clickX <= bx + bw && clickY >= by && clickY <= by + bh) {
        setActiveRectDrag('back');
        return;
      }
    }
  };

  const handleEditorMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = editorCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    if (inputMode === 'raw-image' && activeCornerDrag !== null) {
      const newQuad: Quadrilateral = [...cropQuad];
      newQuad[activeCornerDrag] = {
        x: Math.max(0, Math.min(canvas.width, Math.round(mouseX))),
        y: Math.max(0, Math.min(canvas.height, Math.round(mouseY)))
      };
      setCropQuad(newQuad);
    }
  };

  const handleEditorMouseUp = () => {
    if (activeCornerDrag !== null) {
      setActiveCornerDrag(null);
      // Auto re-warp and assemble
      if (sourceCanvas) {
        const warped = warpQuadrilateralToCard(sourceCanvas, cropQuad, CR80_WIDTH_PX, CR80_HEIGHT_PX);
        const enhanced = enhanceCardCanvas(warped, filterOptions);
        if (rawTargetSide === 'front') {
          setFrontCardCanvas(enhanced);
          setAssembledA4Canvas(assembleA4Canvas(enhanced, backCardCanvas, a4Options));
        } else {
          setBackCardCanvas(enhanced);
          setAssembledA4Canvas(assembleA4Canvas(frontCardCanvas, enhanced, a4Options));
        }
      }
    }
    if (activeRectDrag !== null) {
      setActiveRectDrag(null);
      if (sourceCanvas) {
        extractAndAssembleCards(sourceCanvas, 'pdf-preset', frontRect, backRect, filterOptions, a4Options);
      }
    }
  };

  // ----------------------------------------------------
  // RENDER A4 PREVIEW CANVAS
  // ----------------------------------------------------
  useEffect(() => {
    const previewCanvas = a4PreviewCanvasRef.current;
    if (!previewCanvas || !assembledA4Canvas) return;

    previewCanvas.width = assembledA4Canvas.width;
    previewCanvas.height = assembledA4Canvas.height;
    const ctx = previewCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(assembledA4Canvas, 0, 0);
  }, [assembledA4Canvas, activeViewTab]);

  // ----------------------------------------------------
  // DOWNLOAD & PRINT ACTIONS
  // ----------------------------------------------------
  const handleDownloadFront = () => {
    if (!frontCardCanvas) return;
    downloadCanvasAsPng(frontCardCanvas, `${sourceFileName.replace(/\.[^/.]+$/, '')}-front-300dpi.png`);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
    setStatusMessage('Front card downloaded (1012 × 638 px @ 300 DPI).');
  };

  const handleDownloadBack = () => {
    if (!backCardCanvas) return;
    downloadCanvasAsPng(backCardCanvas, `${sourceFileName.replace(/\.[^/.]+$/, '')}-back-300dpi.png`);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
    setStatusMessage('Back card downloaded (1012 × 638 px @ 300 DPI).');
  };

  const handleDownloadA4 = () => {
    if (!assembledA4Canvas) return;
    downloadCanvasAsPng(assembledA4Canvas, `${sourceFileName.replace(/\.[^/.]+$/, '')}-A4-print-sheet-300dpi.png`);
    confetti({ particleCount: 50, spread: 80, origin: { y: 0.8 } });
    setStatusMessage('Full A4 Sheet downloaded (2480 × 3508 px @ 300 DPI).');
  };

  const handleTriggerPrint = async () => {
    if (!assembledA4Canvas) return;
    setStatusMessage('Initiating 1:1 scale print stream...');
    const res = await executeNativePrint(assembledA4Canvas, selectedPrinterPreset);
    setStatusMessage(res.message);
  };

  // ----------------------------------------------------
  // FILTER MODIFICATIONS
  // ----------------------------------------------------
  const updateFilter = (newFilters: Partial<FilterOptions>) => {
    const updated = { ...filterOptions, ...newFilters };
    setFilterOptions(updated);
    if (sourceCanvas) {
      if (inputMode === 'pdf-preset') {
        extractAndAssembleCards(sourceCanvas, inputMode, frontRect, backRect, updated, a4Options);
      } else {
        const warped = warpQuadrilateralToCard(sourceCanvas, cropQuad, CR80_WIDTH_PX, CR80_HEIGHT_PX);
        const enhanced = enhanceCardCanvas(warped, updated);
        if (rawTargetSide === 'front') {
          setFrontCardCanvas(enhanced);
          setAssembledA4Canvas(assembleA4Canvas(enhanced, backCardCanvas, a4Options));
        } else {
          setBackCardCanvas(enhanced);
          setAssembledA4Canvas(assembleA4Canvas(frontCardCanvas, enhanced, a4Options));
        }
      }
    }
  };

  const updateA4Options = (newA4: Partial<A4AssemblyOptions>) => {
    const updated = { ...a4Options, ...newA4 };
    setA4Options(updated);
    const a4 = assembleA4Canvas(frontCardCanvas, backCardCanvas, updated);
    setAssembledA4Canvas(a4);
  };

  return (
    <div className="w-full min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      {/* ---------------------------------------------------- */}
      {/* 1. TOP BAR (3-Zone Top Bar Contract)                 */}
      {/* ---------------------------------------------------- */}
      <header className="no-print h-16 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur px-6 flex items-center justify-between z-30 shrink-0">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Printer className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-white text-base">
              NP Print Portal
            </span>
            <span className="hidden sm:inline text-xs text-neutral-400 ml-2">
              · Ultra-HD 300 DPI Card Engine
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation / Mode Tabs */}
        <nav className="flex items-center gap-1 bg-neutral-800/80 p-1 rounded-lg border border-neutral-700/60">
          <button
            onClick={() => setActiveViewTab('editor')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              activeViewTab === 'editor'
                ? 'bg-neutral-900 text-cyan-400 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Detection & Crop</span>
          </button>
          <button
            onClick={() => setActiveViewTab('cards')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              activeViewTab === 'cards'
                ? 'bg-neutral-900 text-cyan-400 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>CR80 Cards ({CR80_WIDTH_PX}×{CR80_HEIGHT_PX})</span>
          </button>
          <button
            onClick={() => setActiveViewTab('preview-a4')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              activeViewTab === 'preview-a4'
                ? 'bg-neutral-900 text-cyan-400 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>A4 Sheet Preview</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action & Quick Print */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerPrint}
            className="px-4 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-neutral-950 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print 1:1 Scale</span>
          </button>
        </div>
      </header>

      {/* ---------------------------------------------------- */}
      {/* 2. MAIN WORKSPACE                                    */}
      {/* ---------------------------------------------------- */}
      <div className="no-print flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT CONTROL SIDEBAR (Toolbox) */}
        <aside className="w-full lg:w-96 border-r border-neutral-800 bg-neutral-900/60 p-5 flex flex-col gap-6 overflow-y-auto shrink-0">
          
          {/* Source Document Card */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Document Source
              </span>
              <span className="text-xs font-mono text-neutral-500 tabular-nums">
                300 DPI Target
              </span>
            </div>

            {/* Upload Button */}
            <div className="flex items-center gap-2">
              <label className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700/80 rounded-lg text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Upload PDF or Image</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Quick Demo Samples */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={loadSampleAadhaar}
                className="px-2.5 py-1.5 bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 hover:border-neutral-700 rounded-md transition-colors text-left"
              >
                <span className="text-cyan-400 font-medium block">Sample Aadhaar</span>
                <span className="text-[10px] text-neutral-500">Official PDF letter</span>
              </button>
              <button
                onClick={loadSampleRawMobileScan}
                className="px-2.5 py-1.5 bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 hover:border-neutral-700 rounded-md transition-colors text-left"
              >
                <span className="text-emerald-400 font-medium block">Skewed Mobile Scan</span>
                <span className="text-[10px] text-neutral-500">Auto-deskew test</span>
              </button>
            </div>

            {/* Active file metadata */}
            <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-md p-2.5 text-xs font-mono text-neutral-400 flex items-center justify-between">
              <div className="truncate pr-2">
                <span className="text-neutral-500">File: </span>
                <span className="text-neutral-200">{sourceFileName}</span>
              </div>
              <span className="text-cyan-400 shrink-0 tabular-nums">
                {sourceCanvas ? `${sourceCanvas.width}×${sourceCanvas.height}px` : 'No file'}
              </span>
            </div>
          </div>

          <div className="h-px bg-neutral-800" />

          {/* Mode-Specific Detection Controls */}
          {inputMode === 'pdf-preset' ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                  Official PDF Preset Ratios
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">Dual-Box Extraction</span>
              </div>

              <div className="space-y-1.5">
                {DOCUMENT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetChange(preset.id)}
                    className={`w-full p-2.5 rounded-lg border text-left text-xs transition-colors flex flex-col gap-0.5 ${
                      selectedPresetId === preset.id
                        ? 'bg-neutral-800/90 border-cyan-500/50 text-white'
                        : 'bg-neutral-900/40 border-neutral-800/80 text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
                    }`}
                  >
                    <span className="font-medium text-neutral-200">{preset.name}</span>
                    <span className="text-[11px] text-neutral-500">{preset.description}</span>
                  </button>
                ))}
              </div>

              {/* Box position indicators */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-md p-2 text-cyan-300">
                  <div className="font-semibold text-[11px] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                    Front Box
                  </div>
                  <div className="font-mono text-[10px] text-cyan-400/80 mt-1">
                    Y: {(frontRect.y * 100).toFixed(1)}% · W: {(frontRect.width * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-amber-950/20 border border-amber-500/30 rounded-md p-2 text-amber-300">
                  <div className="font-semibold text-[11px] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    Back Box
                  </div>
                  <div className="font-mono text-[10px] text-amber-400/80 mt-1">
                    Y: {(backRect.y * 100).toFixed(1)}% · W: {(backRect.width * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                  Raw Scan Contour & Deskew
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">4-Point Homography</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunAutoDetect}
                  className="flex-1 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-Detect Corners</span>
                </button>
                <button
                  onClick={handleResetQuad}
                  className="px-3 py-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                  title="Reset to default center box"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Assign cropped image to front or back slot */}
              <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
                <span>Assign Cropped Card To:</span>
                <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-md border border-neutral-800">
                  <button
                    onClick={() => {
                      setRawTargetSide('front');
                      if (sourceCanvas) {
                        const w = warpQuadrilateralToCard(sourceCanvas, cropQuad);
                        const e = enhanceCardCanvas(w, filterOptions);
                        setFrontCardCanvas(e);
                        setAssembledA4Canvas(assembleA4Canvas(e, backCardCanvas, a4Options));
                      }
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      rawTargetSide === 'front' ? 'bg-cyan-500 text-neutral-950' : 'text-neutral-400'
                    }`}
                  >
                    Front Slot
                  </button>
                  <button
                    onClick={() => {
                      setRawTargetSide('back');
                      if (sourceCanvas) {
                        const w = warpQuadrilateralToCard(sourceCanvas, cropQuad);
                        const e = enhanceCardCanvas(w, filterOptions);
                        setBackCardCanvas(e);
                        setAssembledA4Canvas(assembleA4Canvas(frontCardCanvas, e, a4Options));
                      }
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      rawTargetSide === 'back' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400'
                    }`}
                  >
                    Back Slot
                  </button>
                </div>
              </div>

              {/* 4 Corner Coordinates Info */}
              <div className="bg-neutral-950/70 border border-neutral-800/80 rounded-md p-2.5 text-[11px] font-mono text-neutral-400 space-y-1">
                <div className="flex justify-between">
                  <span>TL: ({cropQuad[0].x}, {cropQuad[0].y})</span>
                  <span>TR: ({cropQuad[1].x}, {cropQuad[1].y})</span>
                </div>
                <div className="flex justify-between">
                  <span>BL: ({cropQuad[3].x}, {cropQuad[3].y})</span>
                  <span>BR: ({cropQuad[2].x}, {cropQuad[2].y})</span>
                </div>
              </div>
            </div>
          )}

          <div className="h-px bg-neutral-800" />

          {/* Ultra-HD 300 DPI Enhancement Filters */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Ultra-HD Print Filters
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">Unsharp & Contrast</span>
            </div>

            {/* Filter Mode Selector */}
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {[
                { id: 'unsharp', label: 'Ultra-HD Crisp', desc: 'Sharpen text & QR' },
                { id: 'clean', label: 'Original Clean', desc: 'No unsharp mask' },
                { id: 'vibrant', label: 'Vibrant Photo', desc: 'Saturated colors' },
                { id: 'grayscale', label: 'Monochrome', desc: 'Grayscale 300 DPI' },
                { id: 'photocopy', label: 'Clean Xerox', desc: 'High-contrast B&W' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => updateFilter({ mode: m.id as FilterEnhanceMode })}
                  className={`p-2 rounded-md border text-left transition-colors ${
                    filterOptions.mode === m.id
                      ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300'
                      : 'bg-neutral-950/40 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <div className="font-medium text-[11px]">{m.label}</div>
                  <div className="text-[9px] text-neutral-500">{m.desc}</div>
                </button>
              ))}
            </div>

            {/* Sliders */}
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs text-neutral-400 mb-1">
                  <span>Unsharp Mask Amount:</span>
                  <span className="font-mono text-cyan-400 tabular-nums">
                    {filterOptions.unsharpAmount.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.8"
                  step="0.05"
                  value={filterOptions.unsharpAmount}
                  onChange={(e) => updateFilter({ unsharpAmount: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-neutral-400 mb-1">
                  <span>Contrast Enhancement:</span>
                  <span className="font-mono text-cyan-400 tabular-nums">
                    {filterOptions.contrast > 0 ? `+${filterOptions.contrast}` : filterOptions.contrast}
                  </span>
                </div>
                <input
                  type="range"
                  min="-25"
                  max="35"
                  step="1"
                  value={filterOptions.contrast}
                  onChange={(e) => updateFilter({ contrast: parseInt(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                />
              </div>

              <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer py-1">
                <span>Auto-Levels (Clean White Paper)</span>
                <input
                  type="checkbox"
                  checked={filterOptions.autoLevels}
                  onChange={(e) => updateFilter({ autoLevels: e.target.checked })}
                  className="rounded bg-neutral-800 border-neutral-700 text-cyan-500 focus:ring-0 cursor-pointer"
                />
              </label>
            </div>
          </div>

          <div className="h-px bg-neutral-800" />

          {/* A4 Sheet Assembly Options */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                A4 Print Assembly
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">2480 × 3508 px</span>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-xs text-neutral-400 block mb-1">Card Layout:</span>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <button
                    onClick={() => updateA4Options({ layout: 'side-by-side' })}
                    className={`py-1.5 px-2 rounded border text-center transition-colors ${
                      a4Options.layout === 'side-by-side'
                        ? 'bg-neutral-800 border-cyan-500 text-cyan-300'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Side-by-Side (Pouch)
                  </button>
                  <button
                    onClick={() => updateA4Options({ layout: 'stacked' })}
                    className={`py-1.5 px-2 rounded border text-center transition-colors ${
                      a4Options.layout === 'stacked'
                        ? 'bg-neutral-800 border-cyan-500 text-cyan-300'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Stacked (Vertical)
                  </button>
                </div>
              </div>

              <div>
                <span className="text-xs text-neutral-400 block mb-1">Card Border:</span>
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <button
                    onClick={() => updateA4Options({ borderStyle: 'solid-hairline' })}
                    className={`py-1 rounded border text-center transition-colors text-[11px] ${
                      a4Options.borderStyle === 'solid-hairline'
                        ? 'bg-neutral-800 border-cyan-500 text-cyan-300'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    Solid
                  </button>
                  <button
                    onClick={() => updateA4Options({ borderStyle: 'dashed-cut' })}
                    className={`py-1 rounded border text-center transition-colors text-[11px] ${
                      a4Options.borderStyle === 'dashed-cut'
                        ? 'bg-neutral-800 border-cyan-500 text-cyan-300'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    Dashed
                  </button>
                  <button
                    onClick={() => updateA4Options({ borderStyle: 'none' })}
                    className={`py-1 rounded border text-center transition-colors text-[11px] ${
                      a4Options.borderStyle === 'none'
                        ? 'bg-neutral-800 border-cyan-500 text-cyan-300'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    None
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-neutral-300 pt-1">
                <span>Crop Marks & Fold Line</span>
                <input
                  type="checkbox"
                  checked={a4Options.showCuttingMarks}
                  onChange={(e) => updateA4Options({ showCuttingMarks: e.target.checked })}
                  className="rounded bg-neutral-800 border-neutral-700 text-cyan-500 focus:ring-0 cursor-pointer"
                />
              </div>

              <div className="pt-2">
                <span className="text-[11px] text-neutral-400 block mb-1">Target Printer Hardware Profile:</span>
                <select
                  value={selectedPrinterPreset}
                  onChange={(e) => setSelectedPrinterPreset(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-cyan-300 focus:outline-none focus:border-cyan-500 font-medium"
                >
                  {PRINTER_HARDWARE_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN VIEWPORT */}
        <main className="flex-1 flex flex-col bg-neutral-950 overflow-hidden">
          
          {/* Status Bar */}
          <div className="h-10 border-b border-neutral-800/80 bg-neutral-900/40 px-5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-neutral-400">
              <span className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
              <span className="truncate max-w-md">{statusMessage}</span>
            </div>

            <div className="flex items-center gap-3 text-neutral-500 font-mono text-[11px]">
              <span>Card: {CR80_WIDTH_MM}×{CR80_HEIGHT_MM}mm</span>
              <span>·</span>
              <span>300 DPI ({CR80_WIDTH_PX}×{CR80_HEIGHT_PX}px)</span>
              <span>·</span>
              <span>A4: {A4_WIDTH_MM}×{A4_HEIGHT_MM}mm</span>
            </div>
          </div>

          {/* Content Views */}
          <div className="flex-1 overflow-auto p-6 flex items-center justify-center relative">
            
            {/* VIEW 1: DETECTION & CROP EDITOR */}
            {activeViewTab === 'editor' && (
              <div className="max-w-4xl w-full flex flex-col items-center gap-4">
                <div className="w-full flex items-center justify-between text-xs text-neutral-400">
                  <div className="flex items-center gap-2">
                    <Move className="w-4 h-4 text-cyan-400" />
                    <span>
                      {inputMode === 'pdf-preset'
                        ? 'Drag boxes to adjust Front (Cyan) & Back (Amber) cropping sections'
                        : 'Drag any of the 4 corner handles to adjust perspective deskewing'}
                    </span>
                  </div>
                  <span className="font-mono text-neutral-500">Interactive Canvas Viewport</span>
                </div>

                <div className="relative border border-neutral-800 rounded-xl overflow-hidden shadow-2xl bg-neutral-900 flex items-center justify-center p-2">
                  <canvas
                    ref={editorCanvasRef}
                    onMouseDown={handleEditorMouseDown}
                    onMouseMove={handleEditorMouseMove}
                    onMouseUp={handleEditorMouseUp}
                    className="max-h-[68vh] max-w-full w-auto object-contain cursor-crosshair rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* VIEW 2: EXTRACTED CR80 CARDS (1012 x 638 px) */}
            {activeViewTab === 'cards' && (
              <div className="max-w-4xl w-full flex flex-col gap-6">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Normalized CR80 Cards (300 DPI · 1012 × 638 pixels each)</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadFront}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-md flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Download Front PNG</span>
                    </button>
                    <button
                      onClick={handleDownloadBack}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-md flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      <span>Download Back PNG</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Front Card Preview */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-cyan-400">FRONT CARD</span>
                      <span className="text-[10px] font-mono text-neutral-500">{CR80_WIDTH_PX} × {CR80_HEIGHT_PX} PX</span>
                    </div>
                    <div className="aspect-[85.6/53.98] bg-white rounded-lg overflow-hidden border border-neutral-700 flex items-center justify-center shadow-md">
                      {frontCardCanvas ? (
                        <img
                          src={frontCardCanvas.toDataURL()}
                          alt="Front Card"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-neutral-400">Front slot empty</span>
                      )}
                    </div>
                  </div>

                  {/* Back Card Preview */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-400">BACK CARD</span>
                      <span className="text-[10px] font-mono text-neutral-500">{CR80_WIDTH_PX} × {CR80_HEIGHT_PX} PX</span>
                    </div>
                    <div className="aspect-[85.6/53.98] bg-white rounded-lg overflow-hidden border border-neutral-700 flex items-center justify-center shadow-md">
                      {backCardCanvas ? (
                        <img
                          src={backCardCanvas.toDataURL()}
                          alt="Back Card"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-neutral-400">Back slot empty</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 3: A4 SHEET PRINT PREVIEW */}
            {activeViewTab === 'preview-a4' && (
              <div className="max-w-3xl w-full flex flex-col items-center gap-4">
                <div className="w-full flex items-center justify-between text-xs text-neutral-400">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span>A4 Print Assembly (2480 × 3508 pixels · 300 DPI true scale)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadA4}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-md flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Download A4 PNG</span>
                    </button>
                    <button
                      onClick={handleTriggerPrint}
                      className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-semibold rounded-md flex items-center gap-1.5 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Document</span>
                    </button>
                  </div>
                </div>

                {/* Virtual A4 Paper Simulation */}
                <div className="border border-neutral-700 rounded-lg p-2 bg-neutral-800 shadow-2xl flex items-center justify-center">
                  <canvas
                    ref={a4PreviewCanvasRef}
                    className="max-h-[72vh] w-auto shadow-xl rounded bg-white object-contain"
                  />
                </div>
              </div>
            )}

          </div>

          {/* Footer Bar */}
          <footer className="h-10 border-t border-neutral-800 bg-neutral-900/60 px-6 flex items-center justify-between text-xs text-neutral-500 shrink-0">
            <div className="flex items-center gap-3">
              <span>NP Print Portal</span>
              <span>·</span>
              <span>CR80 ISO/IEC 7810 ID-1 Standard</span>
              <span>·</span>
              <span>True 300 DPI Canvas Rendering</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span>A4 Print Sheet: 210 × 297 mm</span>
            </div>
          </footer>
        </main>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. PRINT CONTAINER FOR NATIVE WINDOW.PRINT()         */}
      {/* (Only visible to printer via @media print stylesheet) */}
      {/* ---------------------------------------------------- */}
      <div id="a4-print-mount" className="print-only-container hidden" />
    </div>
  );
}
