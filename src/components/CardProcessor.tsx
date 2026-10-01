/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CardProcessor.tsx
 * Complete core Document & ID Card Processing Engine for Print Bay & Cyber Cafes.
 * Features:
 * - Canvas Rotation Controls: Rotate Left (-90°), Rotate Right (+90°), Flip 180°
 * - Free-Form 4-Corner Homography Perspective Warp (4 Draggable Corner Pins for tilted phone photos)
 * - "Straighten & Crop" Homography Deskew Engine to True 300 DPI CR80 (1012 × 638 px)
 * - Calibrated UIDAI e-Aadhaar & PAN PDF Coordinates with Fine-Tuning Nudge Controls (↑, ↓, ←, → by 2px)
 * - Toggle Front / Back Card Slot on a single uploaded photo
 * - Strict Date Format: DD/MM/YYYY across all generated cards and sheets
 * - In-Browser Password-Protected PDF Decryption
 * - Real-Time Quality & Enhancement Controls (Brightness, Contrast, Auto-Enhance, Cut-Guide Border)
 * - Strict 1:1 Scale Print Output with 50mm Physical Calibration Scale
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText,
  Camera,
  Printer,
  Download,
  RotateCcw,
  RotateCw,
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
  EyeOff,
  Settings2,
  Move,
  Lock,
  KeyRound,
  Sun,
  Contrast,
  Ruler,
  HelpCircle,
  Check,
  X,
  FlipVertical,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus,
  Maximize
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
  getDefaultQuad,
  rotateCanvas
} from '../lib/canvasUtils';

import {
  executeNativePrint,
  PRINTER_HARDWARE_PRESETS
} from '../lib/nativePrint';

import {
  generateSampleAadhaarCanvas,
  generateSampleAngledMobilePhoto,
  generateSampleDarkScanCanvas
} from '../lib/sampleDocuments';

import { formatDDMMYYYY, formatDDMMYYYYWithTime } from '../lib/dateUtils';
import { SessionUser } from '../lib/authStore';

export interface CardProcessorProps {
  currentUser?: SessionUser | null;
  onRequireAuth?: () => void;
}

type InputMode = 'pdf-preset' | 'raw-image';

export default function CardProcessor({ currentUser, onRequireAuth }: CardProcessorProps = {}) {
  // ----------------------------------------------------
  // ENGINE STATE
  // ----------------------------------------------------
  const [inputMode, setInputMode] = useState<InputMode>('pdf-preset');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Ready for document upload or sample selection');

  // Source High-Res Canvas (300 DPI)
  const [sourceCanvas, setSourceCanvas] = useState<HTMLCanvasElement | null>(null);
  const [sourceFileName, setSourceFileName] = useState<string>('sample-official-aadhaar.pdf');
  const [pdfPageCount, setPdfPageCount] = useState<number>(1);
  const [currentPdfPage, setCurrentPdfPage] = useState<number>(1);

  // PDF Password Decryption Modal State
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [pendingProtectedPdfBuffer, setPendingProtectedPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [pendingPdfFileName, setPendingPdfFileName] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPasswordText, setShowPasswordText] = useState<boolean>(false);
  const [isSamplePasswordTest, setIsSamplePasswordTest] = useState<boolean>(false);

  // Active Presets & Detection Regions (Calibrated UIDAI e-Aadhaar)
  const [selectedPresetId, setSelectedPresetId] = useState<string>('aadhaar-letter');
  const [frontRect, setFrontRect] = useState<NormalizedRect>(DOCUMENT_PRESETS[0].front);
  const [backRect, setBackRect] = useState<NormalizedRect>(DOCUMENT_PRESETS[0].back);
  const [activeNudgeTarget, setActiveNudgeTarget] = useState<'front' | 'back'>('front');

  // Raw Mobile Scan Homography State (4 Corners in pixels)
  const [cropQuad, setCropQuad] = useState<Quadrilateral>([
    { x: 100, y: 100 },
    { x: 900, y: 100 },
    { x: 900, y: 600 },
    { x: 100, y: 600 },
  ]);
  const [rawTargetSide, setRawTargetSide] = useState<'front' | 'back'>('front');

  // Dragging interaction state
  const [activeCornerDrag, setActiveCornerDrag] = useState<number | null>(null);
  const [activeRectDrag, setActiveRectDrag] = useState<'front' | 'back' | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

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
    setStatusMessage('Rendering 300 DPI calibrated Aadhaar document...');
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

        extractAndAssembleCards(
          sampleCanvas,
          'pdf-preset',
          DOCUMENT_PRESETS[0].front,
          DOCUMENT_PRESETS[0].back,
          filterOptions,
          a4Options
        );
        setStatusMessage('Rendered UIDAI Aadhaar document at 300 DPI (2480 × 3508 px). Front & back card extracted.');
      } catch (err: any) {
        setStatusMessage(`Error loading sample: ${err.message}`);
      } finally {
        setIsProcessing(false);
      }
    }, 50);
  };

  const loadSampleRawMobileScan = () => {
    setIsProcessing(true);
    setStatusMessage('Generating skewed mobile camera photo on desk...');
    setTimeout(() => {
      try {
        const { canvas: mobileCanvas, trueQuad } = generateSampleAngledMobilePhoto();
        setSourceCanvas(mobileCanvas);
        setSourceFileName('mobile_scan_camera_capture.jpg');
        setInputMode('raw-image');

        const detected = detectCardCorners(mobileCanvas);
        setCropQuad(detected);

        const cropped = warpQuadrilateralToCard(mobileCanvas, detected, CR80_WIDTH_PX, CR80_HEIGHT_PX);
        const enhanced = enhanceCardCanvas(cropped, filterOptions);

        setFrontCardCanvas(enhanced);
        const a4 = assembleA4Canvas(enhanced, backCardCanvas, a4Options);
        setAssembledA4Canvas(a4);

        setStatusMessage('Loaded mobile photo. Drag corner pins (1-4) or click "Straighten & Crop" to warp.');
      } catch (err: any) {
        setStatusMessage(`Error loading raw scan: ${err.message}`);
      } finally {
        setIsProcessing(false);
      }
    }, 50);
  };

  const loadSampleDarkScan = () => {
    setIsProcessing(true);
    setStatusMessage('Loading underexposed scanner capture with heavy paper haze...');
    setTimeout(() => {
      try {
        const darkCanvas = generateSampleDarkScanCanvas();
        setSourceCanvas(darkCanvas);
        setSourceFileName('dark_scanner_scan.jpg');
        setInputMode('pdf-preset');
        setSelectedPresetId('aadhaar-letter');
        setFrontRect(DOCUMENT_PRESETS[0].front);
        setBackRect(DOCUMENT_PRESETS[0].back);

        const enhancedFilters: FilterOptions = {
          ...filterOptions,
          brightness: 12,
          contrast: 22,
          autoLevels: true,
          unsharpAmount: 0.95,
        };
        setFilterOptions(enhancedFilters);

        extractAndAssembleCards(
          darkCanvas,
          'pdf-preset',
          DOCUMENT_PRESETS[0].front,
          DOCUMENT_PRESETS[0].back,
          enhancedFilters,
          a4Options
        );
        setStatusMessage('Dark scan loaded. 1-Click Auto-Levels & Contrast Boost restored white paper background.');
      } catch (err: any) {
        setStatusMessage(`Error loading dark scan: ${err.message}`);
      } finally {
        setIsProcessing(false);
      }
    }, 50);
  };

  // Demo Password-Protected PDF Simulation
  const loadSamplePasswordLockTest = () => {
    setIsSamplePasswordTest(true);
    setPendingPdfFileName('eAadhaar_Password_Protected_Demo.pdf');
    setPasswordInput('');
    setPasswordError(null);
    setShowPasswordModal(true);
  };

  // ----------------------------------------------------
  // CANVAS ORIENTATION CONTROLS (ROTATE 90°, -90°, 180°)
  // ----------------------------------------------------
  const handleRotate = (angle: 90 | -90 | 180) => {
    if (!sourceCanvas) return;
    setIsProcessing(true);
    setStatusMessage(`Rotating canvas ${angle > 0 ? `+${angle}` : angle}°...`);
    setTimeout(() => {
      try {
        const rotated = rotateCanvas(sourceCanvas, angle);
        setSourceCanvas(rotated);

        if (inputMode === 'raw-image') {
          // Re-center 4 corner quad on the rotated canvas
          const defQuad = getDefaultQuad(rotated.width, rotated.height);
          setCropQuad(defQuad);
          const warped = warpQuadrilateralToCard(rotated, defQuad, CR80_WIDTH_PX, CR80_HEIGHT_PX);
          const enhanced = enhanceCardCanvas(warped, filterOptions);

          if (rawTargetSide === 'front') {
            setFrontCardCanvas(enhanced);
            setAssembledA4Canvas(assembleA4Canvas(enhanced, backCardCanvas, a4Options));
          } else {
            setBackCardCanvas(enhanced);
            setAssembledA4Canvas(assembleA4Canvas(frontCardCanvas, enhanced, a4Options));
          }
        } else {
          extractAndAssembleCards(rotated, inputMode, frontRect, backRect, filterOptions, a4Options);
        }
        setStatusMessage(`Rotated ${angle > 0 ? `+${angle}` : angle}° (${rotated.width} × ${rotated.height} px).`);
      } catch (e: any) {
        setStatusMessage(`Rotation error: ${e.message}`);
      } finally {
        setIsProcessing(false);
      }
    }, 30);
  };

  // ----------------------------------------------------
  // HOMOGRAPHY PERSPECTIVE WARP ("STRAIGHTEN & CROP")
  // ----------------------------------------------------
  const handleStraightenAndCrop = () => {
    if (!sourceCanvas) return;
    setIsProcessing(true);
    setStatusMessage('Computing 2D homography perspective transformation to flat CR80...');
    setTimeout(() => {
      try {
        const warped = warpQuadrilateralToCard(sourceCanvas, cropQuad, CR80_WIDTH_PX, CR80_HEIGHT_PX);
        const enhanced = enhanceCardCanvas(warped, filterOptions);

        if (rawTargetSide === 'front') {
          setFrontCardCanvas(enhanced);
          const a4 = assembleA4Canvas(enhanced, backCardCanvas, a4Options);
          setAssembledA4Canvas(a4);
          setStatusMessage('Front card deskewed and mapped to Front slot (1012 × 638 px @ 300 DPI)!');
        } else {
          setBackCardCanvas(enhanced);
          const a4 = assembleA4Canvas(frontCardCanvas, enhanced, a4Options);
          setAssembledA4Canvas(a4);
          setStatusMessage('Back card deskewed and mapped to Back slot (1012 × 638 px @ 300 DPI)!');
        }
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
      } catch (e: any) {
        setStatusMessage(`Deskew error: ${e.message}`);
      } finally {
        setIsProcessing(false);
      }
    }, 40);
  };

  // ----------------------------------------------------
  // FINE-TUNING NUDGE CONTROLS (↑, ↓, ←, → by 2px & size)
  // ----------------------------------------------------
  const handleNudge = (target: 'front' | 'back', dir: 'up' | 'down' | 'left' | 'right', stepPx = 4) => {
    if (!sourceCanvas) return;
    const isFront = target === 'front';
    const r = isFront ? { ...frontRect } : { ...backRect };
    const stepX = stepPx / sourceCanvas.width;
    const stepY = stepPx / sourceCanvas.height;

    if (dir === 'up') r.y = Math.max(0, r.y - stepY);
    if (dir === 'down') r.y = Math.min(1 - r.height, r.y + stepY);
    if (dir === 'left') r.x = Math.max(0, r.x - stepX);
    if (dir === 'right') r.x = Math.min(1 - r.width, r.x + stepX);

    if (isFront) setFrontRect(r);
    else setBackRect(r);

    extractAndAssembleCards(sourceCanvas, inputMode, isFront ? r : frontRect, isFront ? backRect : r, filterOptions, a4Options);
  };

  const handleResizeNudge = (target: 'front' | 'back', deltaW: number, deltaH: number) => {
    if (!sourceCanvas) return;
    const isFront = target === 'front';
    const r = isFront ? { ...frontRect } : { ...backRect };
    const dW = deltaW / sourceCanvas.width;
    const dH = deltaH / sourceCanvas.height;

    r.width = Math.max(0.1, Math.min(1 - r.x, r.width + dW));
    r.height = Math.max(0.1, Math.min(1 - r.y, r.height + dH));

    if (isFront) setFrontRect(r);
    else setBackRect(r);

    extractAndAssembleCards(sourceCanvas, inputMode, isFront ? r : frontRect, isFront ? backRect : r, filterOptions, a4Options);
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
        setStatusMessage(`Reading PDF "${fileName}"...`);
        const buffer = await file.arrayBuffer();

        try {
          const renderResult = await renderPdfToCanvas(buffer, 1, 300);
          setSourceCanvas(renderResult.canvas);
          setPdfPageCount(renderResult.pageCount);
          setCurrentPdfPage(1);
          setInputMode('pdf-preset');

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
          setStatusMessage(`PDF loaded: 300 DPI canvas (${renderResult.width} × ${renderResult.height} px)`);
        } catch (pdfErr: any) {
          if (
            pdfErr.name === 'PasswordException' ||
            pdfErr.code === 1 ||
            pdfErr.code === 2 ||
            pdfErr.message?.toLowerCase().includes('password')
          ) {
            setPendingProtectedPdfBuffer(buffer);
            setPendingPdfFileName(fileName);
            setIsSamplePasswordTest(false);
            setPasswordInput('');
            setPasswordError(null);
            setShowPasswordModal(true);
            setStatusMessage('Password-protected PDF detected. Enter password to decrypt.');
          } else {
            throw pdfErr;
          }
        }
      } else {
        // Raw Image Upload (JPEG, PNG, WebP)
        setStatusMessage(`Loading image "${fileName}"...`);
        const img = await loadImage(file);
        const imgCanvas = document.createElement('canvas');
        imgCanvas.width = img.naturalWidth || img.width;
        imgCanvas.height = img.naturalHeight || img.height;
        const ctx = imgCanvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);

        setSourceCanvas(imgCanvas);
        setInputMode('raw-image');

        const detectedQuad = detectCardCorners(imgCanvas);
        setCropQuad(detectedQuad);

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

        setStatusMessage(`Loaded image (${imgCanvas.width} × ${imgCanvas.height} px). Drag 4 corner pins or rotate.`);
      }
    } catch (err: any) {
      console.error('File load error:', err);
      setStatusMessage(`Error loading document: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ----------------------------------------------------
  // UNLOCK PASSWORD-PROTECTED PDF
  // ----------------------------------------------------
  const handleUnlockPdfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setPasswordError('Please enter the PDF password');
      return;
    }

    setIsProcessing(true);
    setPasswordError(null);

    if (isSamplePasswordTest) {
      if (passwordInput.toUpperCase().trim() === 'RAJE1990') {
        setShowPasswordModal(false);
        setPasswordInput('');
        loadSampleAadhaar();
        setStatusMessage('Sample e-Aadhaar successfully unlocked with password "RAJE1990"!');
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
        setIsProcessing(false);
        return;
      } else {
        setPasswordError('Incorrect password! Test password is RAJE1990 (First 4 letters of RAJESH + Year 1990).');
        setIsProcessing(false);
        return;
      }
    }

    if (!pendingProtectedPdfBuffer) {
      setIsProcessing(false);
      return;
    }

    try {
      const renderResult = await renderPdfToCanvas(
        pendingProtectedPdfBuffer,
        {
          pageNumber: 1,
          targetDpi: 300,
          password: passwordInput.trim(),
        }
      );

      setSourceCanvas(renderResult.canvas);
      setPdfPageCount(renderResult.pageCount);
      setCurrentPdfPage(1);
      setInputMode('pdf-preset');

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

      setShowPasswordModal(false);
      setPasswordInput('');
      setPendingProtectedPdfBuffer(null);
      setStatusMessage('Password verified! PDF decrypted at True 300 DPI without cloud upload.');
      confetti({ particleCount: 50, spread: 80, origin: { y: 0.6 } });
    } catch (err: any) {
      console.warn('PDF unlock failed:', err);
      setPasswordError('Incorrect password. For e-Aadhaar: First 4 letters of Name (CAPITAL) + Birth Year (e.g. SURE1988).');
    } finally {
      setIsProcessing(false);
    }
  };

  // ----------------------------------------------------
  // EXTRACTION & ASSEMBLY PIPELINE
  // ----------------------------------------------------
  const extractAndAssembleCards = useCallback((
    canvas: HTMLCanvasElement,
    mode: InputMode,
    fRect: NormalizedRect,
    bRect: NormalizedRect,
    filters: FilterOptions,
    a4Opts: A4AssemblyOptions
  ) => {
    try {
      let front: HTMLCanvasElement;
      let back: HTMLCanvasElement;

      if (mode === 'pdf-preset') {
        const rawFront = cropRectToCard(canvas, fRect);
        const rawBack = cropRectToCard(canvas, bRect);

        front = enhanceCardCanvas(rawFront, filters);
        back = enhanceCardCanvas(rawBack, filters);
      } else {
        const rawCard = warpQuadrilateralToCard(canvas, cropQuad, CR80_WIDTH_PX, CR80_HEIGHT_PX);
        const enhancedCard = enhanceCardCanvas(rawCard, filters);

        if (rawTargetSide === 'front') {
          front = enhancedCard;
          back = backCardCanvas || cropRectToCard(canvas, bRect);
        } else {
          front = frontCardCanvas || cropRectToCard(canvas, fRect);
          back = enhancedCard;
        }
      }

      setFrontCardCanvas(front);
      setBackCardCanvas(back);

      const assembled = assembleA4Canvas(front, back, a4Opts);
      setAssembledA4Canvas(assembled);
    } catch (err: any) {
      console.error('Assembly error:', err);
      setStatusMessage(`Error during extraction: ${err.message}`);
    }
  }, [cropQuad, rawTargetSide, frontCardCanvas, backCardCanvas]);

  // ----------------------------------------------------
  // INTERACTIVE RECT & QUAD DRAWING ON EDITOR CANVAS
  // ----------------------------------------------------
  useEffect(() => {
    const canvas = editorCanvasRef.current;
    if (!canvas || !sourceCanvas) return;

    canvas.width = sourceCanvas.width;
    canvas.height = sourceCanvas.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(sourceCanvas, 0, 0);

    // Dark semi-transparent tint
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (inputMode === 'pdf-preset') {
      // 1. Draw Front Rect (Cyan)
      const fx = Math.round(frontRect.x * canvas.width);
      const fy = Math.round(frontRect.y * canvas.height);
      const fw = Math.round(frontRect.width * canvas.width);
      const fh = Math.round(frontRect.height * canvas.height);

      ctx.drawImage(sourceCanvas, fx, fy, fw, fh, fx, fy, fw, fh);
      ctx.strokeStyle = activeNudgeTarget === 'front' ? '#22d3ee' : '#06b6d4';
      ctx.lineWidth = activeNudgeTarget === 'front' ? 4 : 2.5;
      ctx.strokeRect(fx, fy, fw, fh);

      ctx.fillStyle = '#06b6d4';
      ctx.font = `700 ${Math.max(22, Math.round(canvas.width * 0.012))}px system-ui, sans-serif`;
      ctx.fillText(`FRONT CARD ${activeNudgeTarget === 'front' ? '(ACTIVE)' : ''}`, fx, fy - 12);

      drawHandle(ctx, fx, fy, '#06b6d4', canvas.width);
      drawHandle(ctx, fx + fw, fy + fh, '#06b6d4', canvas.width);

      // 2. Draw Back Rect (Amber)
      const bx = Math.round(backRect.x * canvas.width);
      const by = Math.round(backRect.y * canvas.height);
      const bw = Math.round(backRect.width * canvas.width);
      const bh = Math.round(backRect.height * canvas.height);

      ctx.drawImage(sourceCanvas, bx, by, bw, bh, bx, by, bw, bh);
      ctx.strokeStyle = activeNudgeTarget === 'back' ? '#fbbf24' : '#f59e0b';
      ctx.lineWidth = activeNudgeTarget === 'back' ? 4 : 2.5;
      ctx.strokeRect(bx, by, bw, bh);

      ctx.fillStyle = '#f59e0b';
      ctx.font = `700 ${Math.max(22, Math.round(canvas.width * 0.012))}px system-ui, sans-serif`;
      ctx.fillText(`BACK CARD ${activeNudgeTarget === 'back' ? '(ACTIVE)' : ''}`, bx, by - 12);

      drawHandle(ctx, bx + bw, by + bh, '#f59e0b', canvas.width);
      drawHandle(ctx, bx, by, '#f59e0b', canvas.width);
    } else {
      // Raw Image Mode: Free 4-Corner Quadrilateral
      const [p0, p1, p2, p3] = cropQuad;

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

      // Connecting boundary line
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = Math.max(4, Math.round(canvas.width * 0.002));
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();
      ctx.stroke();

      // Draw 4 circular pins with labels
      const pinLabels = ['1: Top-Left (TL)', '2: Top-Right (TR)', '3: Bottom-Right (BR)', '4: Bottom-Left (BL)'];
      cropQuad.forEach((pt, idx) => {
        drawPin(ctx, pt.x, pt.y, '#22c55e', canvas.width, pinLabels[idx]);
      });
    }
  }, [sourceCanvas, inputMode, frontRect, backRect, cropQuad, activeNudgeTarget]);

  function drawHandle(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, w: number) {
    const radius = Math.max(8, Math.round(w * 0.007));
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawPin(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, w: number, label: string) {
    const radius = Math.max(14, Math.round(w * 0.012));
    ctx.save();
    
    // Outer glow
    ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
    ctx.beginPath();
    ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
    ctx.fill();

    // Solid pin
    ctx.fillStyle = '#22c55e';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();

    // Label badge above pin
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.5;
    const textWidth = ctx.measureText(label).width;
    ctx.fillRect(x - 40, y - radius - 24, 80, 20);
    ctx.strokeRect(x - 40, y - radius - 24, 80, 20);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label.split(':')[0], x, y - radius - 10);

    ctx.restore();
  }

  // Mouse handlers for dragging crop boxes and corner pins
  const handleEditorMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = editorCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    if (inputMode === 'raw-image') {
      const hitRadius = Math.max(35, canvas.width * 0.035);
      for (let i = 0; i < 4; i++) {
        const pt = cropQuad[i];
        const dist = Math.hypot(clickX - pt.x, clickY - pt.y);
        if (dist <= hitRadius) {
          setActiveCornerDrag(i);
          return;
        }
      }
    } else {
      const fx = frontRect.x * canvas.width;
      const fy = frontRect.y * canvas.height;
      const fw = frontRect.width * canvas.width;
      const fh = frontRect.height * canvas.height;

      if (clickX >= fx && clickX <= fx + fw && clickY >= fy && clickY <= fy + fh) {
        setActiveRectDrag('front');
        setActiveNudgeTarget('front');
        setDragStartPos({ x: clickX - fx, y: clickY - fy });
        return;
      }

      const bx = backRect.x * canvas.width;
      const by = backRect.y * canvas.height;
      const bw = backRect.width * canvas.width;
      const bh = backRect.height * canvas.height;

      if (clickX >= bx && clickX <= bx + bw && clickY >= by && clickY <= by + bh) {
        setActiveRectDrag('back');
        setActiveNudgeTarget('back');
        setDragStartPos({ x: clickX - bx, y: clickY - by });
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
    } else if (inputMode === 'pdf-preset' && activeRectDrag) {
      if (activeRectDrag === 'front') {
        const newX = Math.max(0, Math.min(canvas.width - frontRect.width * canvas.width, mouseX - dragStartPos.x));
        const newY = Math.max(0, Math.min(canvas.height - frontRect.height * canvas.height, mouseY - dragStartPos.y));
        setFrontRect({
          ...frontRect,
          x: newX / canvas.width,
          y: newY / canvas.height,
        });
      } else {
        const newX = Math.max(0, Math.min(canvas.width - backRect.width * canvas.width, mouseX - dragStartPos.x));
        const newY = Math.max(0, Math.min(canvas.height - backRect.height * canvas.height, mouseY - dragStartPos.y));
        setBackRect({
          ...backRect,
          x: newX / canvas.width,
          y: newY / canvas.height,
        });
      }
    }
  };

  const handleEditorMouseUp = () => {
    if (activeCornerDrag !== null && sourceCanvas) {
      setActiveCornerDrag(null);
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

    if (activeRectDrag && sourceCanvas) {
      setActiveRectDrag(null);
      extractAndAssembleCards(sourceCanvas, inputMode, frontRect, backRect, filterOptions, a4Options);
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
  const checkAuthForExport = () => {
    if (!currentUser) {
      onRequireAuth?.();
      window.dispatchEvent(new CustomEvent('np_trigger_login', {
        detail: { reason: '🔒 Login Required to Print / Download ID Cards. Sign in or register to get 4 Free Prints!' }
      }));
      setStatusMessage('🔒 Login required to print or download ID cards. Please sign in or register.');
      return false;
    }
    return true;
  };

  const handleDownloadFront = () => {
    if (!checkAuthForExport()) return;
    if (!frontCardCanvas) return;
    const dateStamp = formatDDMMYYYY(new Date()).replace(/\//g, '-');
    downloadCanvasAsPng(frontCardCanvas, `${sourceFileName.replace(/\.[^/.]+$/, '')}_front_${dateStamp}.png`);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
  };

  const handleDownloadBack = () => {
    if (!checkAuthForExport()) return;
    if (!backCardCanvas) return;
    const dateStamp = formatDDMMYYYY(new Date()).replace(/\//g, '-');
    downloadCanvasAsPng(backCardCanvas, `${sourceFileName.replace(/\.[^/.]+$/, '')}_back_${dateStamp}.png`);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
  };

  const handleDownloadA4 = () => {
    if (!checkAuthForExport()) return;
    if (!assembledA4Canvas) return;
    const dateStamp = formatDDMMYYYY(new Date()).replace(/\//g, '-');
    downloadCanvasAsPng(assembledA4Canvas, `${sourceFileName.replace(/\.[^/.]+$/, '')}_A4_${dateStamp}.png`);
    confetti({ particleCount: 50, spread: 80, origin: { y: 0.8 } });
  };

  const handleTriggerPrint = async () => {
    if (!checkAuthForExport()) return;
    if (!assembledA4Canvas) return;
    setStatusMessage('Initiating 1:1 scale print stream...');
    const res = await executeNativePrint(assembledA4Canvas, selectedPrinterPreset);
    setStatusMessage(res.message);
  };

  // ----------------------------------------------------
  // REAL-TIME FILTER ADJUSTMENTS
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

  const handleAutoEnhanceOneClick = () => {
    updateFilter({
      brightness: 8,
      contrast: 18,
      autoLevels: true,
      unsharpAmount: 0.85,
      mode: 'unsharp',
    });
    setStatusMessage('1-Click Auto-Enhance applied (Brightness +8, Contrast +18, Auto-Levels & Unsharp Mask).');
  };

  const handleResetFilters = () => {
    updateFilter(DEFAULT_FILTER_OPTIONS);
    setStatusMessage('Filters reset to default.');
  };

  const updateA4Options = (newA4Opts: Partial<A4AssemblyOptions>) => {
    const updated = { ...a4Options, ...newA4Opts };
    setA4Options(updated);
    if (frontCardCanvas || backCardCanvas) {
      setAssembledA4Canvas(assembleA4Canvas(frontCardCanvas, backCardCanvas, updated));
    }
  };

  return (
    <div className="w-full min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      
      {/* ---------------------------------------------------- */}
      {/* 1. TOP HEADER & TEST SUITE BAR                        */}
      {/* ---------------------------------------------------- */}
      <header className="no-print border-b border-neutral-800 bg-neutral-900/90 backdrop-blur px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 z-30 shrink-0">
        
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Printer className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-white text-sm">
              NP Print Portal
            </span>
            <span className="hidden lg:inline text-xs text-neutral-400 ml-2 font-mono">
              · Date: <strong className="text-cyan-400">{formatDDMMYYYY(new Date())}</strong>
            </span>
          </div>
        </div>

        {/* Center: Navigation Mode Tabs */}
        <nav className="flex items-center gap-1 bg-neutral-800/80 p-1 rounded-lg border border-neutral-700/60 text-xs overflow-x-auto max-w-full scrollbar-none">
          <button
            onClick={() => setActiveViewTab('editor')}
            className={`px-2.5 sm:px-3 py-1.5 font-medium rounded-md transition-colors flex items-center gap-1.5 shrink-0 ${
              activeViewTab === 'editor'
                ? 'bg-neutral-900 text-cyan-400 shadow-sm font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 shrink-0" />
            <span>Crop & Deskew</span>
          </button>
          <button
            onClick={() => setActiveViewTab('cards')}
            className={`px-2.5 sm:px-3 py-1.5 font-medium rounded-md transition-colors flex items-center gap-1.5 shrink-0 ${
              activeViewTab === 'cards'
                ? 'bg-neutral-900 text-cyan-400 shadow-sm font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>CR80 Cards</span>
          </button>
          <button
            onClick={() => setActiveViewTab('preview-a4')}
            className={`px-2.5 sm:px-3 py-1.5 font-medium rounded-md transition-colors flex items-center gap-1.5 shrink-0 ${
              activeViewTab === 'preview-a4'
                ? 'bg-neutral-900 text-cyan-400 shadow-sm font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Printer className="w-3.5 h-3.5 shrink-0" />
            <span>A4 Sheet</span>
          </button>
        </nav>

        {/* Right: Print 1:1 Scale Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleTriggerPrint}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-neutral-950 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>Print 1:1</span>
          </button>
        </div>
      </header>

      {/* ---------------------------------------------------- */}
      {/* 2. INTERACTIVE TEST SUITE / DEMO BAR                  */}
      {/* ---------------------------------------------------- */}
      <div className="no-print bg-neutral-900/60 border-b border-neutral-800 px-3 sm:px-6 py-1.5 sm:py-2 flex flex-wrap items-center justify-between gap-2 text-xs w-full overflow-hidden">
        <div className="flex items-center gap-2 text-neutral-400 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-semibold text-neutral-300">Quick Test:</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full pb-0.5 scrollbar-none">
          <button
            onClick={loadSampleAadhaar}
            className="px-2 py-1 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 rounded-md font-medium text-[11px] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
          >
            <FileText className="w-3 h-3 text-cyan-400 shrink-0" />
            <span>1. e-Aadhaar PDF</span>
          </button>

          <button
            onClick={loadSamplePasswordLockTest}
            className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md font-medium text-[11px] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            title="Tests password unlock flow. Test password: RAJE1990"
          >
            <Lock className="w-3 h-3 text-amber-400 shrink-0" />
            <span>2. Password PDF (RAJE1990)</span>
          </button>

          <button
            onClick={loadSampleRawMobileScan}
            className="px-2 py-1 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 rounded-md font-medium text-[11px] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
          >
            <Camera className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>3. Skewed Photo</span>
          </button>

          <button
            onClick={loadSampleDarkScan}
            className="px-2 py-1 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 rounded-md font-medium text-[11px] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
          >
            <Sun className="w-3 h-3 text-rose-400 shrink-0" />
            <span>4. Dark Scan</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. MAIN WORKSPACE & TOOLBOX                          */}
      {/* ---------------------------------------------------- */}
      <div className="no-print flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT CONTROL SIDEBAR */}
        <aside className="w-full lg:w-96 border-r border-neutral-800 bg-neutral-900/60 p-5 flex flex-col gap-5 overflow-y-auto shrink-0">
          
          {/* Document Source Section */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Document Upload
              </span>
              <span className="text-xs font-mono text-cyan-400">
                300 DPI Native
              </span>
            </div>

            <label className="w-full px-4 py-2.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700/80 rounded-lg text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm">
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

            <span className="text-[11px] text-neutral-500 font-mono truncate">
              Loaded: {sourceFileName}
            </span>
          </div>

          <div className="h-px bg-neutral-800" />

          {/* CROP MODE SELECTOR */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Cropping Engine Mode
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setInputMode('pdf-preset')}
                className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                  inputMode === 'pdf-preset'
                    ? 'bg-neutral-800 border-cyan-500 text-cyan-300 font-bold'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div>UIDAI / PAN Preset</div>
                <div className="text-[10px] text-neutral-500 font-normal">Dual Box Split</div>
              </button>

              <button
                onClick={() => setInputMode('raw-image')}
                className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                  inputMode === 'raw-image'
                    ? 'bg-neutral-800 border-cyan-500 text-cyan-300 font-bold'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div>Free 4-Corner Quad</div>
                <div className="text-[10px] text-neutral-500 font-normal">Homography Warp</div>
              </button>
            </div>
          </div>

          {/* FINE-TUNING NUDGE CONTROLS FOR PDF (Image 2 Fix) */}
          {inputMode === 'pdf-preset' && (
            <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3.5 flex flex-col gap-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Precision Nudge (2px)</span>
                </span>
                <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded border border-neutral-800">
                  <button
                    onClick={() => setActiveNudgeTarget('front')}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                      activeNudgeTarget === 'front' ? 'bg-cyan-500 text-neutral-950' : 'text-neutral-400'
                    }`}
                  >
                    Front Box
                  </button>
                  <button
                    onClick={() => setActiveNudgeTarget('back')}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                      activeNudgeTarget === 'back' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400'
                    }`}
                  >
                    Back Box
                  </button>
                </div>
              </div>

              {/* D-Pad Buttons */}
              <div className="flex flex-col items-center gap-1 py-1">
                <button
                  onClick={() => handleNudge(activeNudgeTarget, 'up', 4)}
                  className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300 transition-colors"
                  title="Nudge Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleNudge(activeNudgeTarget, 'left', 4)}
                    className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300 transition-colors"
                    title="Nudge Left"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] text-neutral-500 font-mono">MOVE</span>
                  <button
                    onClick={() => handleNudge(activeNudgeTarget, 'right', 4)}
                    className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300 transition-colors"
                    title="Nudge Right"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  onClick={() => handleNudge(activeNudgeTarget, 'down', 4)}
                  className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300 transition-colors"
                  title="Nudge Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Width & Height Resizers */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-850">
                <div className="flex items-center justify-between bg-neutral-900 p-1.5 rounded border border-neutral-800">
                  <span className="text-[11px] text-neutral-400">Width:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleResizeNudge(activeNudgeTarget, -4, 0)}
                      className="p-1 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleResizeNudge(activeNudgeTarget, 4, 0)}
                      className="p-1 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-neutral-900 p-1.5 rounded border border-neutral-800">
                  <span className="text-[11px] text-neutral-400">Height:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleResizeNudge(activeNudgeTarget, 0, -4)}
                      className="p-1 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleResizeNudge(activeNudgeTarget, 0, 4)}
                      className="p-1 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FREE-FORM 4-CORNER HOMOGRAPHY CONTROLS (Image 1 Fix) */}
          {inputMode === 'raw-image' && (
            <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3.5 flex flex-col gap-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Maximize className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Free 4-Corner Homography</span>
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">4 Pins Active</span>
              </div>

              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Drag the 4 circular green pins to the 4 corners of the ID card on the bed/table photo.
              </p>

              {/* Target Slot Toggle */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-neutral-400">Map Deskewed Output To:</span>
                <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded border border-neutral-800">
                  <button
                    onClick={() => setRawTargetSide('front')}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                      rawTargetSide === 'front' ? 'bg-cyan-500 text-neutral-950' : 'text-neutral-400'
                    }`}
                  >
                    Front Slot
                  </button>
                  <button
                    onClick={() => setRawTargetSide('back')}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                      rawTargetSide === 'back' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400'
                    }`}
                  >
                    Back Slot
                  </button>
                </div>
              </div>

              {/* Straighten & Crop Button */}
              <button
                onClick={handleStraightenAndCrop}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Straighten & Crop (CR80 Homography)</span>
              </button>
            </div>
          )}

          <div className="h-px bg-neutral-800" />

          {/* REAL-TIME ENHANCEMENT CONTROLS */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Quality & Enhancements</span>
              </span>
              <button
                onClick={handleResetFilters}
                className="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                Reset
              </button>
            </div>

            <button
              onClick={handleAutoEnhanceOneClick}
              className="w-full py-2 px-3 bg-gradient-to-r from-cyan-500/20 via-cyan-500/10 to-emerald-500/20 hover:from-cyan-500/30 hover:to-emerald-500/30 border border-cyan-500/40 rounded-lg text-xs font-bold text-cyan-300 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>1-Click Auto-Enhance (White Paper)</span>
            </button>

            <div className="space-y-3 bg-neutral-950/70 p-3 rounded-xl border border-neutral-800/80 text-xs">
              <div>
                <div className="flex justify-between text-neutral-400 mb-1">
                  <span className="flex items-center gap-1">
                    <Sun className="w-3 h-3 text-amber-400" />
                    <span>Brightness:</span>
                  </span>
                  <span className="font-mono text-cyan-400 tabular-nums">
                    {filterOptions.brightness > 0 ? `+${filterOptions.brightness}%` : `${filterOptions.brightness}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={filterOptions.brightness}
                  onChange={(e) => updateFilter({ brightness: parseInt(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between text-neutral-400 mb-1">
                  <span className="flex items-center gap-1">
                    <Contrast className="w-3 h-3 text-cyan-400" />
                    <span>Contrast:</span>
                  </span>
                  <span className="font-mono text-cyan-400 tabular-nums">
                    {filterOptions.contrast > 0 ? `+${filterOptions.contrast}%` : `${filterOptions.contrast}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={filterOptions.contrast}
                  onChange={(e) => updateFilter({ contrast: parseInt(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                />
              </div>

              <label className="flex items-center justify-between text-neutral-300 cursor-pointer pt-1 border-t border-neutral-850">
                <span className="flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Cut-Guide Border (0.5pt Outline)</span>
                </span>
                <input
                  type="checkbox"
                  checked={Boolean(a4Options.cutGuideBorder)}
                  onChange={(e) => updateA4Options({ cutGuideBorder: e.target.checked })}
                  className="rounded bg-neutral-800 border-neutral-700 text-cyan-500 focus:ring-0 cursor-pointer"
                />
              </label>
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
              <span>300 DPI</span>
              <span>·</span>
              <span>A4: {A4_WIDTH_MM}×{A4_HEIGHT_MM}mm</span>
            </div>
          </div>

          {/* Content Views */}
          <div className="flex-1 overflow-auto p-6 flex items-center justify-center relative">
            
            {/* VIEW 1: DETECTION & CROP EDITOR */}
            {activeViewTab === 'editor' && (
              <div className="max-w-4xl w-full flex flex-col items-center gap-3">
                
                {/* CANVAS ORIENTATION & ROTATION TOOLBAR (Image 1 Fix) */}
                <div className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                  
                  {/* Left: Rotate Buttons */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-400 font-medium mr-1 text-[11px]">Orientation:</span>
                    <button
                      onClick={() => handleRotate(-90)}
                      className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      title="Rotate Counter-Clockwise (Left 90°)"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Left 90°</span>
                    </button>

                    <button
                      onClick={() => handleRotate(90)}
                      className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      title="Rotate Clockwise (Right 90°)"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Right 90°</span>
                    </button>

                    <button
                      onClick={() => handleRotate(180)}
                      className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      title="Flip Upside Down (180°)"
                    >
                      <FlipVertical className="w-3.5 h-3.5 text-amber-400" />
                      <span>Flip 180°</span>
                    </button>
                  </div>

                  {/* Right: Deskew / Crop Action */}
                  <div className="flex items-center gap-2">
                    {inputMode === 'raw-image' && (
                      <button
                        onClick={handleStraightenAndCrop}
                        className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Straighten & Crop (To {rawTargetSide.toUpperCase()})</span>
                      </button>
                    )}

                    <span className="font-mono text-neutral-500 text-[11px]">
                      {sourceCanvas ? `${sourceCanvas.width} × ${sourceCanvas.height} px` : ''}
                    </span>
                  </div>
                </div>

                {/* Canvas Mount */}
                <div className="relative border border-neutral-800 rounded-xl overflow-hidden shadow-2xl bg-neutral-900 flex items-center justify-center p-2">
                  <canvas
                    ref={editorCanvasRef}
                    onMouseDown={handleEditorMouseDown}
                    onMouseMove={handleEditorMouseMove}
                    onMouseUp={handleEditorMouseUp}
                    className="max-h-[66vh] max-w-full w-auto object-contain cursor-crosshair rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* VIEW 2: EXTRACTED CR80 CARDS (1012 x 638 px) */}
            {activeViewTab === 'cards' && (
              <div className="max-w-4xl w-full flex flex-col gap-6">
                
                {/* Real-Time Toolbar Directly Over Previews */}
                <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleAutoEnhanceOneClick}
                      className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Auto-Enhance</span>
                    </button>

                    <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                      <input
                        type="checkbox"
                        checked={Boolean(a4Options.cutGuideBorder)}
                        onChange={(e) => updateA4Options({ cutGuideBorder: e.target.checked })}
                        className="rounded bg-neutral-800 border-neutral-700 text-cyan-500 focus:ring-0"
                      />
                      <span>Cut-Guide Border (0.5pt)</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadFront}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Download Front PNG</span>
                    </button>
                    <button
                      onClick={handleDownloadBack}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
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

            {/* VIEW 3: A4 SHEET / TRAY PRINT PREVIEW */}
            {activeViewTab === 'preview-a4' && (
              <div className="max-w-3xl w-full flex flex-col items-center gap-4">
                <div className="w-full flex items-center justify-between text-xs text-neutral-400">
                  <div className="flex items-center gap-2">
                    <Printer className="w-4 h-4 text-cyan-400" />
                    <span>
                      {a4Options.printTargetPreset === 'epson-pvc-tray'
                        ? 'Epson L8050 / L805 Dual PVC Card Tray Layout (1:1 Scale)'
                        : 'A4 Virtual Print Sheet (2480 × 3508 px @ 300 DPI · 1:1 Scale)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadA4}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {!currentUser ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Download className="w-3.5 h-3.5 text-cyan-400" />}
                      <span>Download Sheet PNG</span>
                    </button>
                    <button
                      onClick={handleTriggerPrint}
                      className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {!currentUser ? <Lock className="w-3.5 h-3.5 text-slate-950" /> : <Printer className="w-3.5 h-3.5" />}
                      <span>Print 1:1 Scale</span>
                    </button>
                  </div>
                </div>

                <div className="relative border border-neutral-800 rounded-xl overflow-hidden shadow-2xl bg-neutral-900 flex items-center justify-center p-3">
                  <canvas
                    ref={a4PreviewCanvasRef}
                    className="max-h-[72vh] max-w-full w-auto object-contain rounded-lg border border-neutral-800"
                  />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 4. PASSWORD-PROTECTED PDF DECRYPTION MODAL           */}
      {/* ---------------------------------------------------- */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Password-Protected PDF
                  </h3>
                  <span className="text-[11px] text-neutral-400 font-mono block">
                    {pendingPdfFileName}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-neutral-950/90 border border-neutral-800 rounded-xl p-3.5 text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-[11px]">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Password Format Guidelines:</span>
              </div>
              <ul className="text-neutral-400 space-y-1 text-[11px] list-disc list-inside">
                <li>
                  <strong className="text-neutral-200">e-Aadhaar:</strong> First 4 letters of Name (CAPITAL) + 4-digit Birth Year (e.g.{' '}
                  <span className="font-mono text-cyan-400">RAJE1990</span>).
                </li>
                <li>
                  <strong className="text-neutral-200">e-PAN Card:</strong> Date of Birth in DDMMYYYY format (e.g.{' '}
                  <span className="font-mono text-cyan-400">12051990</span>).
                </li>
              </ul>
            </div>

            {passwordError && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleUnlockPdfSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-neutral-300 block mb-1 font-medium">
                  Enter PDF Password:
                </label>
                <div className="relative">
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    required
                    autoFocus
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="e.g. RAJE1990"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white font-mono text-sm tracking-wider focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 p-1"
                  >
                    {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isProcessing ? 'Decrypting...' : 'Unlock & Process Document'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
