/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * components/tools/MultiCardSheet.tsx
 * Multi-Card Batch Processor for Print Portals & Cyber Cafes.
 * Mounts 2 to 5 different ID cards (Front & Back pairs) onto a single 300 DPI
 * A4 sheet (2480 x 3508 px) with smart auto-spacing, cut marks, and folding guides.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Printer,
  Download,
  Plus,
  Trash2,
  Upload,
  RefreshCw,
  CheckCircle2,
  Sliders,
  Scissors,
  Eye,
  FileText,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  A4_WIDTH_PX,
  A4_HEIGHT_PX,
  CR80_WIDTH_PX,
  CR80_HEIGHT_PX,
  downloadCanvasAsPng,
  triggerPrintA4
} from '../../lib/canvasUtils';
import { executeNativePrint } from '../../lib/nativePrint';
import { SessionUser } from '../../lib/authStore';

export interface MultiCardSheetProps {
  currentUser?: SessionUser | null;
  onRequireAuth?: () => void;
}

export interface CardSlotItem {
  id: string;
  title: string;
  frontCanvas: HTMLCanvasElement | null;
  backCanvas: HTMLCanvasElement | null;
  frontDataUrl: string | null;
  backDataUrl: string | null;
}

export default function MultiCardSheet({ currentUser, onRequireAuth }: MultiCardSheetProps = {}) {
  const [cards, setCards] = useState<CardSlotItem[]>([]);
  const [showCuttingMarks, setShowCuttingMarks] = useState<boolean>(true);
  const [cardBorderStyle, setCardBorderStyle] = useState<'solid' | 'dashed' | 'none'>('solid');
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [gapMm, setGapMm] = useState<number>(5); // 5mm between front & back

  const a4CanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize with 3 pre-seeded demo cards on mount
  useEffect(() => {
    loadDefaultCardBatch();
  }, []);

  const loadDefaultCardBatch = () => {
    const card1 = createDemoCardCanvas('AADHAAR CARD', '#b91c1c', 'RAJESH KUMAR', '4829  1049  8201');
    const card2 = createDemoCardCanvas('INCOME TAX PAN', '#0284c7', 'RAJESH SHARMA', 'ABCPS9912F');
    const card3 = createDemoCardCanvas('VOTER IDENTITY CARD', '#16a34a', 'RAJESH SHARMA', 'WBP0192841');

    setCards([
      {
        id: 'c1',
        title: 'Aadhaar Card (UIDAI)',
        frontCanvas: card1.front,
        backCanvas: card1.back,
        frontDataUrl: card1.front.toDataURL(),
        backDataUrl: card1.back.toDataURL(),
      },
      {
        id: 'c2',
        title: 'PAN Card (NSDL)',
        frontCanvas: card2.front,
        backCanvas: card2.back,
        frontDataUrl: card2.front.toDataURL(),
        backDataUrl: card2.back.toDataURL(),
      },
      {
        id: 'c3',
        title: 'Voter ID (Election Commission)',
        frontCanvas: card3.front,
        backCanvas: card3.back,
        frontDataUrl: card3.front.toDataURL(),
        backDataUrl: card3.back.toDataURL(),
      },
    ]);
  };

  // Helper: Generates realistic CR80 demo canvas pairs
  function createDemoCardCanvas(
    docTitle: string,
    accentColor: string,
    holderName: string,
    idNumber: string
  ) {
    const makeSide = (isFront: boolean) => {
      const c = document.createElement('canvas');
      c.width = CR80_WIDTH_PX;
      c.height = CR80_HEIGHT_PX;
      const ctx = c.getContext('2d')!;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CR80_WIDTH_PX, CR80_HEIGHT_PX);

      // Header Banner
      ctx.fillStyle = accentColor;
      ctx.fillRect(0, 0, CR80_WIDTH_PX, 90);

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 32px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(docTitle, CR80_WIDTH_PX / 2, 58);

      if (isFront) {
        // Photo Box
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(50, 130, 200, 250);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, 130, 200, 250);
        // Silhouette
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(150, 220, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(150, 340, 70, 60, 0, Math.PI, Math.PI * 2);
        ctx.fill();

        // Info
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'left';
        ctx.font = '600 28px system-ui, sans-serif';
        ctx.fillText(`NAME: ${holderName}`, 280, 180);
        ctx.font = '500 24px system-ui, sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText('DOB: 12/05/1990  ·  GENDER: MALE', 280, 230);
        ctx.fillText('VALIDITY: PERMANENT IDENTIFICATION', 280, 280);

        // ID Number
        ctx.fillStyle = accentColor;
        ctx.font = '700 42px monospace';
        ctx.fillText(idNumber, 280, 360);
      } else {
        // Back side: Address & QR Code
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'left';
        ctx.font = '600 26px system-ui, sans-serif';
        ctx.fillText('PERMANENT RESIDENTIAL ADDRESS:', 60, 160);
        ctx.font = '400 22px system-ui, sans-serif';
        ctx.fillStyle = '#334155';
        ctx.fillText('PLOT 42, GREEN PARK RESIDENCY, SECTOR 15', 60, 210);
        ctx.fillText('INDIRAPURAM, GHAZIABAD, UTTAR PRADESH - 201014', 60, 250);

        // QR Box
        const qrSize = 220;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(CR80_WIDTH_PX - qrSize - 60, 130, qrSize, qrSize);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(CR80_WIDTH_PX - qrSize - 50, 140, qrSize - 20, qrSize - 20);
        ctx.fillStyle = '#000000';
        ctx.fillRect(CR80_WIDTH_PX - qrSize - 30, 160, 50, 50);
        ctx.fillRect(CR80_WIDTH_PX - 110, 160, 50, 50);
        ctx.fillRect(CR80_WIDTH_PX - 110, 270, 50, 50);
      }

      // Outer Border
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, CR80_WIDTH_PX, CR80_HEIGHT_PX);

      return c;
    };

    return { front: makeSide(true), back: makeSide(false) };
  }

  // ----------------------------------------------------
  // ASSEMBLE A4 MULTI-CARD PRINT SHEET (300 DPI)
  // ----------------------------------------------------
  useEffect(() => {
    const canvas = a4CanvasRef.current;
    if (!canvas) return;

    canvas.width = A4_WIDTH_PX;
    canvas.height = A4_HEIGHT_PX;
    const ctx = canvas.getContext('2d')!;

    // 1. Fill entire A4 canvas with pure crisp white (#ffffff)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, A4_WIDTH_PX, A4_HEIGHT_PX);

    // Header Sheet Info
    ctx.fillStyle = '#475569';
    ctx.font = '600 24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `NP PRINT PORTAL · MULTI-CARD BATCH SHEET · ${cards.length} ID CARDS · 300 DPI ULTRA-HD`,
      A4_WIDTH_PX / 2,
      70
    );

    // Cards layout metrics:
    // Scale cards slightly if 4 or 5 cards to fit vertically on A4 (3508 px height)
    // 1 card pair: 1012 px width each + gap. Total width: ~2080 px (A4 width is 2480 px)
    const cardCount = cards.length;
    let cardScale = 1.0;

    if (cardCount === 4) cardScale = 0.92;
    if (cardCount >= 5) cardScale = 0.82;

    const scaledW = Math.round(CR80_WIDTH_PX * cardScale);
    const scaledH = Math.round(CR80_HEIGHT_PX * cardScale);

    const gapPx = Math.round((gapMm / 25.4) * 300 * cardScale);
    const pairW = scaledW * 2 + gapPx;
    const startX = Math.round((A4_WIDTH_PX - pairW) / 2);

    // Vertical spacing
    const availableH = A4_HEIGHT_PX - 200;
    const totalCardsH = cardCount * scaledH;
    const rowGapPx = Math.max(30, Math.round((availableH - totalCardsH) / (cardCount + 1)));

    let curY = 120 + rowGapPx;

    cards.forEach((card, idx) => {
      const frontX = startX;
      const backX = startX + scaledW + gapPx;

      // Draw Front Card
      if (card.frontCanvas) {
        ctx.drawImage(card.frontCanvas, frontX, curY, scaledW, scaledH);
      } else {
        drawEmptyCardSlot(ctx, frontX, curY, scaledW, scaledH, `${card.title} (FRONT)`);
      }

      // Draw Back Card
      if (card.backCanvas) {
        ctx.drawImage(card.backCanvas, backX, curY, scaledW, scaledH);
      } else {
        drawEmptyCardSlot(ctx, backX, curY, scaledW, scaledH, `${card.title} (BACK)`);
      }

      // Border and Cut Marks
      if (cardBorderStyle === 'solid') {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(frontX, curY, scaledW, scaledH);
        ctx.strokeRect(backX, curY, scaledW, scaledH);
      } else if (cardBorderStyle === 'dashed') {
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.strokeRect(frontX, curY, scaledW, scaledH);
        ctx.strokeRect(backX, curY, scaledW, scaledH);
        ctx.setLineDash([]);
      }

      // Center fold line between front & back
      const foldX = frontX + scaledW + Math.round(gapPx / 2);
      ctx.save();
      ctx.strokeStyle = '#cbd5e1';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(foldX, curY - 15);
      ctx.lineTo(foldX, curY + scaledH + 15);
      ctx.stroke();
      ctx.restore();

      // Exterior Label
      if (showLabels) {
        ctx.fillStyle = '#64748b';
        ctx.font = '600 20px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`CARD #${idx + 1}: ${card.title.toUpperCase()}`, frontX, curY - 8);
      }

      curY += scaledH + rowGapPx;
    });
  }, [cards, showCuttingMarks, cardBorderStyle, showLabels, gapMm]);

  function drawEmptyCardSlot(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    label: string
  ) {
    ctx.save();
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + h / 2);
    ctx.restore();
  }

  // ----------------------------------------------------
  // CARD MANAGEMENT (ADD / REMOVE / UPLOAD)
  // ----------------------------------------------------
  const handleAddNewCardSlot = () => {
    if (cards.length >= 5) return;
    const newId = `c_${Date.now()}`;
    const newSlot: CardSlotItem = {
      id: newId,
      title: `ID Card #${cards.length + 1}`,
      frontCanvas: null,
      backCanvas: null,
      frontDataUrl: null,
      backDataUrl: null,
    };
    setCards([...cards, newSlot]);
  };

  const handleRemoveCard = (id: string) => {
    setCards(cards.filter((c) => c.id !== id));
  };

  const handleUploadSlot = (
    cardId: string,
    side: 'front' | 'back',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = CR80_WIDTH_PX;
        c.height = CR80_HEIGHT_PX;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0, CR80_WIDTH_PX, CR80_HEIGHT_PX);

        const updated = cards.map((card) => {
          if (card.id === cardId) {
            if (side === 'front') {
              return { ...card, frontCanvas: c, frontDataUrl: c.toDataURL() };
            } else {
              return { ...card, backCanvas: c, backDataUrl: c.toDataURL() };
            }
          }
          return card;
        });
        setCards(updated);
      };
    };
    reader.readAsDataURL(file);
  };

  // ----------------------------------------------------
  // PRINT & DOWNLOAD
  // ----------------------------------------------------
  const checkAuthForExport = () => {
    if (!currentUser) {
      onRequireAuth?.();
      window.dispatchEvent(new CustomEvent('np_trigger_login', {
        detail: { reason: '🔒 Login Required to Print / Download Batch Sheets. Sign in or register to get 4 Free Prints!' }
      }));
      return false;
    }
    return true;
  };

  const handleDownloadSheet = () => {
    if (!checkAuthForExport()) return;
    const canvas = a4CanvasRef.current;
    if (!canvas) return;
    downloadCanvasAsPng(canvas, `multi-card-batch-${cards.length}-cards-300dpi.png`);
    confetti({ particleCount: 40, spread: 70, origin: { y: 0.8 } });
  };

  const handlePrint = async () => {
    if (!checkAuthForExport()) return;
    const canvas = a4CanvasRef.current;
    if (!canvas) return;
    await executeNativePrint(canvas, 'standard-a4-borderless');
  };

  return (
    <div className="w-full flex-1 flex flex-col lg:flex-row bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      
      {/* LEFT SIDEBAR: BATCH CARD MANAGER */}
      <aside className="w-full lg:w-96 border-r border-neutral-800 bg-neutral-900/60 p-5 flex flex-col gap-5 overflow-y-auto shrink-0">
        
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Batch Card Queue
            </h2>
            <span className="text-[10px] text-neutral-500">
              {cards.length} of 5 Cards on 1 A4 Sheet
            </span>
          </div>

          <button
            onClick={handleAddNewCardSlot}
            disabled={cards.length >= 5}
            className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-neutral-950 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Card</span>
          </button>
        </div>

        {/* Card Slots List */}
        <div className="space-y-3">
          {cards.map((card, idx) => (
            <div
              key={card.id}
              className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-[10px] flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span>{card.title}</span>
                </span>

                <button
                  onClick={() => handleRemoveCard(card.id)}
                  className="text-neutral-500 hover:text-rose-400 transition-colors p-1"
                  title="Remove card from sheet"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Upload Slots for Front & Back */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Front Slot */}
                <label className="border border-neutral-800 hover:border-neutral-700 bg-neutral-900/50 p-2 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors relative overflow-hidden group">
                  {card.frontDataUrl ? (
                    <img
                      src={card.frontDataUrl}
                      alt="Front preview"
                      className="w-full h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="flex flex-col items-center py-2 text-neutral-500 group-hover:text-neutral-300">
                      <Upload className="w-3.5 h-3.5 mb-1" />
                      <span className="text-[10px]">Upload Front</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadSlot(card.id, 'front', e)}
                    className="hidden"
                  />
                </label>

                {/* Back Slot */}
                <label className="border border-neutral-800 hover:border-neutral-700 bg-neutral-900/50 p-2 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors relative overflow-hidden group">
                  {card.backDataUrl ? (
                    <img
                      src={card.backDataUrl}
                      alt="Back preview"
                      className="w-full h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="flex flex-col items-center py-2 text-neutral-500 group-hover:text-neutral-300">
                      <Upload className="w-3.5 h-3.5 mb-1" />
                      <span className="text-[10px]">Upload Back</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadSlot(card.id, 'back', e)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={loadDefaultCardBatch}
          className="text-xs text-neutral-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reload Sample 3-Card Batch</span>
        </button>

        <div className="h-px bg-neutral-800" />

        {/* Layout & Border Options */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Sheet Layout Preferences
          </span>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-neutral-400 block mb-1">Card Border:</span>
              <div className="grid grid-cols-3 gap-1">
                {(['solid', 'dashed', 'none'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => setCardBorderStyle(style)}
                    className={`py-1 rounded border text-center capitalize transition-colors ${
                      cardBorderStyle === style
                        ? 'bg-neutral-800 border-cyan-500 text-cyan-300'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between text-neutral-300 cursor-pointer pt-1">
              <span>Card Identification Labels</span>
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
                className="rounded bg-neutral-800 border-neutral-700 text-cyan-500 focus:ring-0"
              />
            </label>
          </div>
        </div>
      </aside>

      {/* RIGHT PREVIEW & ACTIONS */}
      <main className="flex-1 flex flex-col bg-neutral-950 overflow-hidden">
        
        {/* Top Action Bar */}
        <div className="h-12 border-b border-neutral-800 bg-neutral-900/50 px-6 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-neutral-400">Sheet:</span>
            <span className="font-semibold text-white">
              A4 Batch Sheet ({cards.length} Cards · {cards.length * 2} Sides)
            </span>
            <span className="text-neutral-600">·</span>
            <span className="font-mono text-cyan-400">2480 × 3508 px @ 300 DPI</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSheet}
              className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 border border-neutral-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download A4 Sheet</span>
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

        {/* Live A4 Sheet Preview Canvas */}
        <div className="flex-1 p-6 flex items-center justify-center overflow-auto">
          <div className="border border-neutral-800 rounded-xl p-2 bg-neutral-900 shadow-2xl flex items-center justify-center">
            <canvas
              ref={a4CanvasRef}
              className="max-h-[76vh] max-w-full w-auto object-contain rounded shadow-lg border border-neutral-800"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
