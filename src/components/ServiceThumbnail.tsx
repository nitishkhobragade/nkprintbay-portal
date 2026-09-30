'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * src/components/ServiceThumbnail.tsx
 * High-Fidelity Visual Service Mockups & Photos for Cyber Cafe & CSC Center Tools.
 * Replaces generic lucide icons with realistic, vivid previews of cards, printers,
 * documents, and tools as requested by user (matching competitor reference in Image 4).
 */

import React from 'react';

export type ServiceThumbnailType =
  | 'aadhaar-2'
  | 'aadhaar-old'
  | 'epson-printer'
  | 'ayushman'
  | 'apaar'
  | 'passport-grid'
  | 'bg-remover'
  | 'ai-upscaler'
  | 'govt-resizer'
  | 'govt-signer'
  | 'signature-stamp'
  | 'multi-card'
  | 'pvc-sleeve'
  | 'mini-album'
  | 'photo-crop'
  | 'id-cards-trio'
  | 'doc-printer'
  | 'pdf-merge'
  | 'pdf-compress'
  | 'pdf-editor'
  | 'invoice-bill'
  | 'word-letter'
  | 'cash-counter'
  | 'thermal-slip'
  | 'payment-standee'
  | 'rate-banner'
  | 'wa-chat'
  | 'age-calc'
  | 'land-calc';

interface ServiceThumbnailProps {
  type: ServiceThumbnailType | string;
  className?: string;
}

export default function ServiceThumbnail({ type, className = 'w-full h-28 sm:h-32' }: ServiceThumbnailProps) {
  return (
    <div
      className={`relative rounded-xl overflow-hidden flex items-center justify-center p-2.5 transition-transform group-hover:scale-105 select-none ${className}`}
    >
      {/* 1. COLOR AADHAAR 2.0 PVC CARD */}
      {type === 'aadhaar-2' && (
        <div className="w-full h-full bg-gradient-to-tr from-amber-500/20 via-neutral-900 to-emerald-500/20 rounded-lg p-2 flex items-center justify-center border border-neutral-700/60 shadow-inner">
          <div className="w-44 h-24 bg-gradient-to-r from-orange-100 via-white to-emerald-100 rounded-md shadow-md p-1.5 flex flex-col justify-between border border-neutral-300 text-[8px] text-neutral-800 font-sans">
            {/* Tricolor Header */}
            <div className="flex items-center justify-between border-b border-orange-400 pb-0.5">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-amber-500 rounded-full flex items-center justify-center text-[5px] text-white font-bold">🏛️</div>
                <span className="font-bold text-[7px] text-orange-800">भारत सरकार / GOVT OF INDIA</span>
              </div>
              <span className="text-[6px] text-emerald-800 font-bold">mera aadhaar</span>
            </div>

            {/* Middle: Photo + Details */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-11 bg-neutral-300 rounded border border-neutral-400 overflow-hidden flex flex-col items-center justify-center text-[6px]">
                <div className="w-4 h-4 rounded-full bg-neutral-500 mb-0.5" />
                <div className="w-6 h-3 bg-neutral-400 rounded-t" />
              </div>
              <div className="flex flex-col text-[7px] leading-tight">
                <span className="font-bold text-neutral-900">RAMESH KUMAR</span>
                <span className="text-neutral-600 text-[6px]">DOB: 15/01/1995 · MALE</span>
                <span className="font-mono font-bold text-neutral-900 tracking-wider text-[8px] mt-1">
                  XXXX XXXX 8921
                </span>
              </div>
            </div>

            {/* Bottom: Hologram & Barcode */}
            <div className="flex items-center justify-between pt-0.5 border-t border-emerald-400 text-[6px] text-neutral-600">
              <span className="text-[6px] text-orange-600 font-bold">आधार - आम आदमी का अधिकार</span>
              <div className="w-7 h-2 bg-neutral-800 rounded-[1px]" />
            </div>
          </div>
        </div>
      )}

      {/* 2. EPSON L8050 PVC CARD PRINTER & TRAY */}
      {type === 'epson-printer' && (
        <div className="w-full h-full bg-gradient-to-tr from-cyan-950 via-neutral-900 to-neutral-950 rounded-lg p-2 flex items-center justify-center border border-neutral-700/60 shadow-inner">
          <div className="relative flex flex-col items-center">
            {/* Printer Body */}
            <div className="w-40 h-16 bg-gradient-to-b from-neutral-800 to-neutral-950 rounded-md border border-neutral-600 shadow-xl flex flex-col justify-between p-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold font-mono text-[8px] text-cyan-400 tracking-wider">EPSON L8050</span>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                </div>
              </div>

              {/* Ink Tanks View */}
              <div className="flex items-center gap-1 px-1 py-0.5 bg-neutral-900 rounded border border-neutral-700">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="w-2 h-2 rounded-full bg-pink-500" />
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                <span className="w-2 h-2 rounded-full bg-black border border-neutral-600" />
                <span className="w-2 h-2 rounded-full bg-cyan-600" />
                <span className="w-2 h-2 rounded-full bg-pink-700" />
                <span className="text-[6px] text-neutral-400 font-mono ml-auto">6-COLOR</span>
              </div>
            </div>

            {/* Extended PVC Tray with 2 Cards */}
            <div className="w-36 h-9 bg-neutral-900 border-2 border-dashed border-cyan-500/80 rounded-b-md -mt-1 shadow-2xl p-1 flex items-center justify-around">
              <div className="w-14 h-7 bg-gradient-to-r from-orange-200 to-emerald-200 rounded border border-neutral-300 shadow text-[5px] flex items-center justify-center font-bold text-neutral-800">
                FRONT PVC
              </div>
              <div className="w-14 h-7 bg-gradient-to-r from-emerald-200 to-orange-200 rounded border border-neutral-300 shadow text-[5px] flex items-center justify-center font-bold text-neutral-800">
                BACK PVC
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. AYUSHMAN BHARAT PM-JAY GOLDEN CARD */}
      {type === 'ayushman' && (
        <div className="w-full h-full bg-gradient-to-tr from-amber-600/20 via-neutral-900 to-yellow-500/20 rounded-lg p-2 flex items-center justify-center border border-neutral-700/60 shadow-inner">
          <div className="w-44 h-24 bg-gradient-to-r from-amber-100 via-yellow-50 to-orange-100 rounded-md shadow-md p-1.5 flex flex-col justify-between border-2 border-amber-400 text-neutral-900 font-sans">
            <div className="flex items-center justify-between border-b border-amber-500 pb-0.5">
              <span className="font-extrabold text-[7px] text-amber-900">आयुष्मान भारत | PM-JAY</span>
              <span className="text-[6px] bg-amber-500 text-white font-bold px-1 rounded">5 लाख मुफ्त</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-10 bg-amber-200 rounded border border-amber-400 flex items-center justify-center text-xs">
                👤
              </div>
              <div className="flex flex-col text-[7px] leading-tight">
                <span className="font-bold text-amber-950">PRADHAN MANTRI JAN AROGYA</span>
                <span className="text-[6px] text-neutral-700">Beneficiary: SUNITA DEVI</span>
                <span className="font-mono font-bold text-emerald-850 text-[7px] mt-0.5">ABHA ID: 91-8273-1928-10</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[6px] font-bold text-amber-900 border-t border-amber-300 pt-0.5">
              <span>National Health Authority</span>
              <span>1:1 CR80 Auto-Crop</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. APAAR ONE NATION ONE STUDENT ID */}
      {type === 'apaar' && (
        <div className="w-full h-full bg-gradient-to-tr from-emerald-600/20 via-neutral-900 to-teal-500/20 rounded-lg p-2 flex items-center justify-center border border-neutral-700/60 shadow-inner">
          <div className="w-44 h-24 bg-gradient-to-r from-emerald-100 via-teal-50 to-emerald-200 rounded-md shadow-md p-1.5 flex flex-col justify-between border-2 border-emerald-500 text-neutral-900 font-sans">
            <div className="flex items-center justify-between border-b border-emerald-600 pb-0.5">
              <span className="font-extrabold text-[7px] text-emerald-900">APAAR ID CARD</span>
              <span className="text-[6px] text-neutral-600">Govt of India</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-10 bg-emerald-200 rounded border border-emerald-400 flex items-center justify-center text-xs">
                🎓
              </div>
              <div className="flex flex-col text-[7px] leading-tight">
                <span className="font-bold text-emerald-950">ONE NATION ONE STUDENT ID</span>
                <span className="text-[6px] text-neutral-700">Student: AMAN VERMA</span>
                <span className="font-mono font-bold text-emerald-900 text-[8px] mt-0.5">APAAR: 8291 9384 1029</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[6px] font-mono text-emerald-800 border-t border-emerald-400 pt-0.5">
              <span>Edu Ecosystem</span>
              <span>||||||||||||||||||</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. BACKGROUND REMOVER */}
      {type === 'bg-remover' && (
        <div className="w-full h-full bg-neutral-950 rounded-lg p-2 flex items-center justify-center border border-neutral-700/60 shadow-inner">
          <div className="w-36 h-24 rounded-md shadow-md flex items-center justify-center relative overflow-hidden border border-neutral-600">
            {/* Checkerboard Pattern */}
            <div
              className="absolute inset-0 bg-neutral-800"
              style={{
                backgroundImage: `linear-gradient(45deg, #262626 25%, transparent 25%), linear-gradient(-45deg, #262626 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #262626 75%), linear-gradient(-45deg, transparent 75%, #262626 75%)`,
                backgroundSize: '12px 12px',
                backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px',
              }}
            />
            {/* Cutout Silhouette */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 shadow-lg border-2 border-white flex items-center justify-center text-white text-base">
                👩
              </div>
              <div className="px-2 py-0.5 bg-cyan-500 text-neutral-950 text-[7px] font-bold rounded-full mt-1 shadow">
                100% Transparent
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. PASSPORT PHOTO GRID (8-COPIES ON 4x6 / A4) */}
      {type === 'passport-grid' && (
        <div className="w-full h-full bg-gradient-to-tr from-cyan-950/40 via-neutral-900 to-neutral-950 rounded-lg p-2 flex items-center justify-center border border-neutral-700/60 shadow-inner">
          <div className="w-40 h-24 bg-white rounded-md shadow-md p-1.5 grid grid-cols-4 grid-rows-2 gap-1 border border-neutral-300">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-neutral-100 rounded-[2px] border border-neutral-400 flex flex-col items-center justify-center overflow-hidden p-0.5"
              >
                <div className="w-3.5 h-3.5 rounded-full bg-neutral-400" />
                <div className="w-4.5 h-2.5 bg-neutral-300 rounded-t mt-0.5" />
                <span className="text-[4px] text-neutral-500 font-mono mt-0.5">3.5×4.5</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. AI IMAGE UPSCALER 2.0 (REAL-ESRGAN 4X) */}
      {type === 'ai-upscaler' && (
        <div className="w-full h-full bg-gradient-to-tr from-cyan-900/40 via-neutral-900 to-blue-900/40 rounded-lg p-2 flex items-center justify-center border border-neutral-700/60 shadow-inner">
          <div className="w-36 h-24 rounded-md shadow-md border border-cyan-500/60 relative overflow-hidden flex">
            {/* Left: Pixelated side */}
            <div className="w-1/2 h-full bg-neutral-800 flex items-center justify-center filter blur-[1px]">
              <span className="text-xl">👤</span>
            </div>
            {/* Split Laser Line */}
            <div className="w-0.5 h-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] z-10 relative flex items-center justify-center">
              <span className="absolute -top-1 w-2 h-2 rounded-full bg-cyan-300 animate-ping" />
            </div>
            {/* Right: Crisp 4K side */}
            <div className="w-1/2 h-full bg-gradient-to-br from-neutral-850 to-neutral-950 flex items-center justify-center">
              <span className="text-xl drop-shadow-md">✨👤</span>
            </div>
            <div className="absolute bottom-1 right-1 bg-cyan-500 text-neutral-950 text-[6px] font-black px-1 rounded">
              4x REAL-ESRGAN
            </div>
          </div>
        </div>
      )}

      {/* 8. GOVT FORM PHOTO & SIGNATURE RESIZER */}
      {type === 'govt-resizer' && (
        <div className="w-full h-full bg-gradient-to-tr from-amber-950/40 via-neutral-900 to-neutral-950 rounded-lg p-2 flex items-center justify-center border border-neutral-700/60 shadow-inner">
          <div className="w-40 h-24 bg-white rounded-md shadow-md p-1.5 flex flex-col justify-between border-2 border-amber-400 text-neutral-900">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-0.5">
              <span className="text-[7px] font-bold text-neutral-800">SSC / UPSC EXAM FORM</span>
              <span className="text-[6px] bg-emerald-600 text-white font-mono font-bold px-1 rounded">20-50 KB</span>
            </div>

            <div className="flex items-center justify-around gap-2 my-auto">
              <div className="w-12 h-14 bg-neutral-100 rounded border border-neutral-400 flex flex-col items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-neutral-400" />
                <span className="text-[5px] text-neutral-600 font-mono mt-0.5">PHOTO</span>
                <span className="text-[5px] text-emerald-700 font-bold">35 KB</span>
              </div>
              <div className="w-18 h-10 bg-neutral-100 rounded border border-neutral-400 flex flex-col items-center justify-center">
                <span className="text-[9px] font-serif italic text-blue-800">Ramesh Kr.</span>
                <span className="text-[5px] text-neutral-600 font-mono">SIGNATURE (14 KB)</span>
              </div>
            </div>

            <div className="text-[5px] text-center font-bold text-neutral-500 border-t border-neutral-200 pt-0.5">
              VALIDATED AS PER NOTIFICATION SPECS
            </div>
          </div>
        </div>
      )}

      {/* 9. SIGNATURE & STAMP ENHANCER */}
      {type === 'signature-stamp' && (
        <div className="w-full h-full bg-gradient-to-tr from-purple-950/40 via-neutral-900 to-indigo-950/40 rounded-lg p-2 flex items-center justify-center border border-neutral-700/60 shadow-inner">
          <div className="w-40 h-24 bg-white rounded-md shadow-md p-2 flex items-center justify-around border-2 border-indigo-400">
            {/* Signature */}
            <div className="flex flex-col items-center">
              <div className="text-base font-serif italic text-blue-900 tracking-wider">
                Alex Thompson
              </div>
              <span className="text-[6px] font-bold text-indigo-700 mt-1">High Contrast Ink</span>
            </div>

            {/* Stamp / Thumb */}
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-purple-600 flex items-center justify-center text-purple-700 text-xs font-bold">
              STAMP
            </div>
          </div>
        </div>
      )}

      {/* 10. MULTI CARD PRINT TRAY (A4 BATCH) */}
      {type === 'multi-card' && (
        <div className="w-full h-full bg-gradient-to-tr from-emerald-950/40 via-neutral-900 to-neutral-950 rounded-lg p-2 flex items-center justify-center border border-neutral-700/60 shadow-inner">
          <div className="w-32 h-24 bg-white rounded-md shadow-md p-1.5 flex flex-col justify-between border border-neutral-400">
            <div className="text-[6px] font-bold text-center text-neutral-600 border-b border-neutral-200 pb-0.5">
              A4 SHEET · 5 CARDS BATCH
            </div>
            <div className="grid grid-cols-2 gap-1 my-auto">
              <div className="h-5 bg-orange-100 rounded border border-orange-300 text-[5px] flex items-center justify-center font-bold">AADHAAR</div>
              <div className="h-5 bg-blue-100 rounded border border-blue-300 text-[5px] flex items-center justify-center font-bold">PAN CARD</div>
              <div className="h-5 bg-purple-100 rounded border border-purple-300 text-[5px] flex items-center justify-center font-bold">VOTER ID</div>
              <div className="h-5 bg-emerald-100 rounded border border-emerald-300 text-[5px] flex items-center justify-center font-bold">AYUSHMAN</div>
            </div>
            <div className="text-[5px] text-center font-mono text-neutral-400">Epson L805 / L8050 / Inkjet</div>
          </div>
        </div>
      )}

      {/* 11. INVOICE & GST BILL MAKER */}
      {type === 'invoice-bill' && (
        <div className="w-full h-full bg-gradient-to-tr from-blue-950/40 via-neutral-900 to-neutral-950 rounded-lg p-2 flex items-center justify-center border border-neutral-700/60 shadow-inner">
          <div className="w-40 h-24 bg-white rounded-md shadow-md p-2 flex justify-between border-2 border-blue-500 text-neutral-900 font-sans">
            <div className="flex flex-col justify-between w-24">
              <div>
                <span className="font-extrabold text-[8px] text-blue-900 block">TAX INVOICE</span>
                <span className="text-[6px] text-neutral-500">GST: 07AAAAA0000A1Z5</span>
              </div>
              <div className="text-[6px] space-y-0.5">
                <div className="flex justify-between"><span>Xerox (10p):</span><span className="font-bold">₹30</span></div>
                <div className="flex justify-between"><span>PVC Card:</span><span className="font-bold">₹50</span></div>
                <div className="flex justify-between border-t border-neutral-300 pt-0.5"><span className="font-bold">Total:</span><span className="font-black text-blue-800">₹80</span></div>
              </div>
            </div>
            <div className="w-10 h-10 border border-neutral-400 rounded p-0.5 bg-neutral-100 my-auto flex items-center justify-center text-xs">
              🏁
            </div>
          </div>
        </div>
      )}

      {/* 12. DAILY LEDGER & CASH COUNTER */}
      {type === 'cash-counter' && (
        <div className="w-full h-full bg-gradient-to-tr from-amber-950/40 via-neutral-900 to-neutral-950 rounded-lg p-2 flex items-center justify-center border border-neutral-700/60 shadow-inner">
          <div className="w-40 h-24 bg-neutral-900 rounded-md shadow-md p-2 flex items-center justify-between border border-amber-500/60">
            {/* Notes Stack */}
            <div className="flex flex-col gap-1">
              <div className="w-18 h-4 bg-stone-300 rounded border border-neutral-400 text-[6px] text-neutral-900 font-bold px-1 flex items-center justify-between shadow">
                <span>₹500</span><span>×10</span>
              </div>
              <div className="w-18 h-4 bg-orange-300 rounded border border-neutral-400 text-[6px] text-neutral-900 font-bold px-1 flex items-center justify-between shadow">
                <span>₹200</span><span>×5</span>
              </div>
              <div className="w-18 h-4 bg-purple-300 rounded border border-neutral-400 text-[6px] text-neutral-900 font-bold px-1 flex items-center justify-between shadow">
                <span>₹100</span><span>×20</span>
              </div>
            </div>

            {/* Total Display */}
            <div className="text-right">
              <span className="text-[7px] text-neutral-400 font-mono block">CASH TALLY</span>
              <span className="text-xs font-black font-mono text-amber-400 block">₹8,000</span>
              <span className="text-[6px] text-emerald-400 font-bold">Balanced ✓</span>
            </div>
          </div>
        </div>
      )}

      {/* 13. AEPS THERMAL SLIP */}
      {type === 'thermal-slip' && (
        <div className="w-full h-full bg-neutral-950 rounded-lg p-2 flex items-center justify-center border border-neutral-700/60 shadow-inner">
          <div className="w-28 h-24 bg-amber-50 rounded-sm shadow-md p-1.5 flex flex-col justify-between border-x-2 border-b-2 border-dashed border-neutral-400 text-neutral-900 font-mono text-[6px]">
            <div className="text-center font-bold border-b border-neutral-300 pb-0.5">
              *** AEPS RECEIPT ***
            </div>
            <div>
              <div>Txn: SUCCESS ✓</div>
              <div>Aadhaar: XXXX-4829</div>
              <div>Bank: SBI</div>
              <div className="font-bold text-emerald-800 text-[7px] mt-0.5">WITHDRAW: ₹2,000</div>
            </div>
            <div className="text-center text-[5px] text-neutral-500">2-INCH THERMAL POS</div>
          </div>
        </div>
      )}

      {/* 14. PAYMENT STANDEE UPI QR */}
      {type === 'payment-standee' && (
        <div className="w-full h-full bg-gradient-to-tr from-rose-950/40 via-neutral-900 to-orange-950/40 rounded-lg p-2 flex items-center justify-center border border-neutral-700/60 shadow-inner">
          <div className="w-24 h-24 bg-gradient-to-b from-blue-700 to-neutral-950 rounded-xl shadow-xl p-1.5 flex flex-col items-center justify-between border-2 border-blue-400 text-white text-center">
            <span className="text-[6px] font-bold font-mono tracking-widest text-amber-300">PAY HERE</span>
            <div className="w-12 h-12 bg-white rounded-md p-1 flex items-center justify-center text-xs">
              🏁
            </div>
            <div className="flex gap-1 text-[5px] font-bold">
              <span>GPay</span>·<span>PhonePe</span>·<span>Paytm</span>
            </div>
          </div>
        </div>
      )}

      {/* 15. SHOP SERVICE RATE BANNER */}
      {type === 'rate-banner' && (
        <div className="w-full h-full bg-gradient-to-tr from-purple-950/40 via-neutral-900 to-pink-950/40 rounded-lg p-2 flex items-center justify-center border border-neutral-700/60 shadow-inner">
          <div className="w-40 h-24 bg-gradient-to-r from-yellow-400 to-amber-300 rounded-md shadow-md p-1.5 flex flex-col justify-between border-2 border-neutral-900 text-neutral-900 font-sans">
            <div className="text-center font-black text-[8px] bg-neutral-900 text-white rounded px-1 py-0.2 uppercase">
              CSC & CYBER RATE CARD
            </div>
            <div className="text-[6px] font-bold space-y-0.5">
              <div className="flex justify-between border-b border-neutral-400/50"><span>Aadhaar Print:</span><span>₹50</span></div>
              <div className="flex justify-between border-b border-neutral-400/50"><span>Photocopy (B&W):</span><span>₹3</span></div>
              <div className="flex justify-between"><span>Online Form:</span><span>₹60</span></div>
            </div>
            <div className="text-center text-[5px] font-bold text-neutral-700">Ready to Hang A4 Flex</div>
          </div>
        </div>
      )}

      {/* 16. DIRECT WHATSAPP CHAT */}
      {type === 'wa-chat' && (
        <div className="w-full h-full bg-gradient-to-tr from-emerald-950/40 via-neutral-900 to-teal-950/40 rounded-lg p-2 flex items-center justify-center border border-neutral-700/60 shadow-inner">
          <div className="w-36 h-20 bg-neutral-900 rounded-xl shadow-md p-2 flex items-center gap-2 border border-emerald-500/60">
            <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white text-base font-bold shrink-0">
              💬
            </div>
            <div className="flex flex-col text-[7px] leading-tight text-white">
              <span className="font-bold text-emerald-400">Direct WhatsApp</span>
              <span className="text-neutral-400 text-[6px]">Send print PDF without saving number</span>
              <span className="text-[6px] text-emerald-300 font-mono mt-0.5">+91 98765-XXXXX</span>
            </div>
          </div>
        </div>
      )}

      {/* 17. AGE & DOB CALCULATOR */}
      {type === 'age-calc' && (
        <div className="w-full h-full bg-gradient-to-tr from-pink-950/40 via-neutral-900 to-rose-950/40 rounded-lg p-2 flex items-center justify-center border border-neutral-700/60 shadow-inner">
          <div className="w-36 h-22 bg-neutral-900 rounded-xl shadow-md p-2 flex flex-col justify-between border border-pink-500/60 text-white">
            <span className="text-[7px] font-bold text-pink-300">EXAM AGE CUTOFF CALC</span>
            <div className="flex items-center justify-around font-mono my-1">
              <div className="text-center"><span className="text-xs font-black text-pink-400">24</span><span className="text-[5px] block text-neutral-400">YRS</span></div>
              <span className="text-neutral-600">:</span>
              <div className="text-center"><span className="text-xs font-black text-pink-400">08</span><span className="text-[5px] block text-neutral-400">MOS</span></div>
              <span className="text-neutral-600">:</span>
              <div className="text-center"><span className="text-xs font-black text-pink-400">12</span><span className="text-[5px] block text-neutral-400">DAYS</span></div>
            </div>
            <span className="text-[6px] text-emerald-400 text-center font-bold">Eligible for SSC CGL ✓</span>
          </div>
        </div>
      )}

      {/* 18. LAND AREA CONVERTER */}
      {type === 'land-calc' && (
        <div className="w-full h-full bg-gradient-to-tr from-teal-950/40 via-neutral-900 to-emerald-950/40 rounded-lg p-2 flex items-center justify-center border border-neutral-700/60 shadow-inner">
          <div className="w-38 h-22 bg-neutral-900 rounded-xl shadow-md p-2 flex flex-col justify-between border border-emerald-500/60 text-white text-[7px]">
            <span className="font-bold text-emerald-300">LAND AREA CONVERTER</span>
            <div className="grid grid-cols-2 gap-1 font-mono text-[6px]">
              <div className="bg-neutral-800 p-1 rounded">1 Bigha = 20 Katha</div>
              <div className="bg-neutral-800 p-1 rounded">1 Decimal = 435.6 sqft</div>
              <div className="bg-neutral-800 p-1 rounded">1 Satak = 1 Decimal</div>
              <div className="bg-neutral-800 p-1 rounded">1 Acre = 43,560 sqft</div>
            </div>
          </div>
        </div>
      )}

      {/* DEFAULT FALLBACK ILLUSTRATION */}
      {![
        'aadhaar-2',
        'epson-printer',
        'ayushman',
        'apaar',
        'bg-remover',
        'passport-grid',
        'ai-upscaler',
        'govt-resizer',
        'signature-stamp',
        'multi-card',
        'invoice-bill',
        'cash-counter',
        'thermal-slip',
        'payment-standee',
        'rate-banner',
        'wa-chat',
        'age-calc',
        'land-calc',
      ].includes(type) && (
        <div className="w-full h-full bg-neutral-900 rounded-lg p-2 flex items-center justify-center border border-neutral-700/60 shadow-inner">
          <div className="w-32 h-20 bg-neutral-800 rounded-md border border-neutral-700 flex flex-col items-center justify-center text-cyan-400">
            <span className="text-xl">🛠️</span>
            <span className="text-[8px] text-neutral-300 font-bold mt-1">Smart Cyber Utility</span>
          </div>
        </div>
      )}
    </div>
  );
}
