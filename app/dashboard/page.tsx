'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * app/dashboard/page.tsx
 * High-Converting Interactive Homepage & Counter Services Suite matching https://ntechbay-library.web.app/
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Zap,
  ArrowRight,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Heart,
  Layers,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Gift,
  FileText,
  Camera,
  CreditCard,
  Minimize2,
  FileCheck,
  UserCheck,
  LogIn,
  UserPlus,
  BookOpen,
  Lock,
  Sliders,
  Download,
  Upload,
  RefreshCw,
  Scissors
} from 'lucide-react';
import { SessionUser } from '../../src/lib/authStore';
import ServiceThumbnail, { ServiceThumbnailType } from '../../src/components/ServiceThumbnail';
import AllServicesDirectoryModal from '../../src/components/AllServicesDirectoryModal';

export interface GovtExamSpec {
  name: string;
  authority: string;
  badge: string;
  photoSize: string;
  photoDim: string;
  photoNotes: string;
  signatureSize: string;
  signatureDim: string;
  signatureNotes: string;
  dopRequired: boolean;
  toolId: PortalToolId;
}

export const GOVT_EXAM_PRESETS: GovtExamSpec[] = [
  {
    name: 'SSC (CGL / CHSL / MTS / GD)',
    authority: 'Staff Selection Commission',
    badge: 'Popular',
    photoSize: '20 KB to 50 KB',
    photoDim: '3.5 cm (W) × 4.5 cm (H) / ~138 × 177 px',
    photoNotes: 'Plain white or light background. Clear view of face, ears visible. Without cap or dark glasses.',
    signatureSize: '10 KB to 20 KB',
    signatureDim: '4.0 cm (W) × 2.0 cm (H) / ~140 × 60 px',
    signatureNotes: 'Black ink pen on crisp white paper. Clear, no shadow.',
    dopRequired: true,
    toolId: 'govt-resizer',
  },
  {
    name: 'UPSC (Civil Services / NDA / CDS)',
    authority: 'Union Public Service Commission',
    badge: 'Official',
    photoSize: '50 KB to 100 KB',
    photoDim: '350 × 350 px min (1000 × 1000 px max)',
    photoNotes: 'Recent passport photo taken not more than 10 days before form filling. Name of candidate & DOP printed.',
    signatureSize: '20 KB to 50 KB',
    signatureDim: '350 × 350 px min',
    signatureNotes: 'Black or dark blue ink pen on clean white sheet.',
    dopRequired: true,
    toolId: 'govt-resizer',
  },
  {
    name: 'Railway RRB (NTPC / Group D / ALP)',
    authority: 'Railway Recruitment Boards',
    badge: 'Recruitment',
    photoSize: '20 KB to 50 KB',
    photoDim: '35 mm × 45 mm (color photo on white background)',
    photoNotes: 'Scanned at 100 DPI minimum. Clear front face without goggles/spectacles with glare.',
    signatureSize: '10 KB to 20 KB',
    signatureDim: '50 mm × 20 mm',
    signatureNotes: 'Running hand only (Capital block letters NOT permitted).',
    dopRequired: false,
    toolId: 'govt-resizer',
  },
  {
    name: 'Banking (IBPS PO / Clerk / SBI)',
    authority: 'Institute of Banking Personnel Selection',
    badge: 'Bank Exam',
    photoSize: '20 KB to 50 KB',
    photoDim: '200 × 230 px (4.5 cm × 3.5 cm)',
    photoNotes: 'Light-colored, preferably white background. Eyes open and clearly visible.',
    signatureSize: '10 KB to 20 KB',
    signatureDim: '140 × 60 px',
    signatureNotes: 'Black ink pen only. Do not sign in CAPITAL letters.',
    dopRequired: false,
    toolId: 'govt-resizer',
  },
  {
    name: 'Defence (Agniveer Army / Navy / IAF)',
    authority: 'Ministry of Defence Agniveer',
    badge: 'Defence',
    photoSize: '10 KB to 50 KB',
    photoDim: '3.5 cm × 4.5 cm (Frontal view with black slate)',
    photoNotes: 'Candidate holding black slate in front of chest with Name & Date of Photo written with white chalk.',
    signatureSize: '10 KB to 20 KB',
    signatureDim: '4 cm × 2 cm',
    signatureNotes: 'Dark ink on white background.',
    dopRequired: true,
    toolId: 'passport-studio',
  },
  {
    name: 'NTA (NEET / JEE Main / CUET)',
    authority: 'National Testing Agency',
    badge: 'Entrance',
    photoSize: '10 KB to 200 KB',
    photoDim: 'Passport (3.5 × 4.5 cm) + Postcard 4"×6" (50-300 KB)',
    photoNotes: '80% face coverage, white background, ears visible. Name of candidate & DOP printed at bottom.',
    signatureSize: '4 KB to 30 KB',
    signatureDim: '3.5 cm × 1.5 cm',
    signatureNotes: 'Running hand in black ink.',
    dopRequired: true,
    toolId: 'passport-studio',
  },
];

export type PortalToolId =
  | 'image-reducer'
  | 'pdf-suite'
  | 'card-engine'
  | 'passport-maker'
  | 'passport-studio'
  | 'smart-id'
  | 'govt-resizer'
  | 'multi-card'
  | 'signature-enhancer'
  | 'invoice-maker'
  | 'ai-upscaler'
  | 'cash-counter'
  | 'thermal-slip'
  | 'payment-standee'
  | 'rate-banner'
  | 'wa-direct'
  | 'age-calc'
  | 'land-calc'
  | 'master-compressor';

export interface VisualServiceCard {
  id: string;
  title: string;
  description: string;
  category: 'id-cards' | 'photos' | 'govt-forms' | 'enhancement' | 'utilities';
  badge: 'HOT' | 'FREE' | 'NEW' | 'AI' | 'PRO';
  badgeColor: string;
  thumbnailType: ServiceThumbnailType | string;
  toolId: PortalToolId;
  defaultFavorite?: boolean;
  isFreeWithoutLogin?: boolean;
}

const ALL_VISUAL_SERVICES: VisualServiceCard[] = [
  {
    id: 'image-reducer',
    title: 'Reduce Image Size In KB (Pi7 Style)',
    description: 'Compress photos & documents to exact target KB (20KB, 50KB, 100KB, 200KB) with instant client-side download. 100% Free Without Login!',
    category: 'enhancement',
    badge: 'FREE',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    thumbnailType: 'resizer',
    toolId: 'image-reducer',
    defaultFavorite: true,
    isFreeWithoutLogin: true,
  },
  {
    id: 'pdf-suite',
    title: 'PDF Suite & Universal Converter',
    description: 'Convert Images to A4 PDF, compress PDF to exact target KB, convert PDF to 300 DPI images, and merge/split. 100% Free Without Login!',
    category: 'utilities',
    badge: 'FREE',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    thumbnailType: 'pdf-compress',
    toolId: 'pdf-suite',
    defaultFavorite: true,
    isFreeWithoutLogin: true,
  },
  {
    id: 'passport-studio',
    title: '1-Click Passport Photo Studio',
    description: 'Webcam capture, biometric oval guide, 1-click background switch, 4x6 & A4 multi-grids with 50mm calibration test scale.',
    category: 'photos',
    badge: 'NEW',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    thumbnailType: 'passport-grid',
    toolId: 'passport-studio',
    defaultFavorite: true,
  },
  {
    id: 'smart-id',
    title: 'Dual-Mode Smart ID Processor',
    description: '1-Click e-Aadhaar PDF auto-crop & built-in vector color card renderer (Aadhaar 2.0, PAN 2.0, Voter 2.0) with Epson L8050 PVC tray support.',
    category: 'id-cards',
    badge: 'HOT',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    thumbnailType: 'aadhaar-2',
    toolId: 'smart-id',
    defaultFavorite: true,
  },
  {
    id: 'master-compressor',
    title: 'Master Batch Image & PDF Compressor',
    description: 'Multi-file compressor with custom target KB, individual rename, delete cross, and sequential 1-by-1 downloads without ZIP. Free Without Login!',
    category: 'enhancement',
    badge: 'FREE',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    thumbnailType: 'pdf-compress',
    toolId: 'master-compressor',
    defaultFavorite: true,
    isFreeWithoutLogin: true,
  },
  {
    id: 'card-engine',
    title: 'Ultra-HD Smart Card Processor',
    description: 'Auto-deskew, 4-corner perspective correction, color enhancement, and direct CR80 PVC tray print for any plastic card.',
    category: 'id-cards',
    badge: 'PRO',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    thumbnailType: 'aadhaar-old',
    toolId: 'card-engine',
  },
  {
    id: 'govt-resizer',
    title: 'Govt Job Exam Photo & Signature Resizer',
    description: 'SSC, UPSC, Railway, IBPS & State police exam dimension & exact KB compliance cropper. 100% Free Without Login!',
    category: 'govt-forms',
    badge: 'FREE',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    thumbnailType: 'govt-resizer',
    toolId: 'govt-resizer',
    defaultFavorite: true,
    isFreeWithoutLogin: true,
  },
  {
    id: 'multi-card',
    title: 'Multi-Card Batch Sheet (5 Cards on A4)',
    description: 'Combine up to 5 different customer cards on a single 300 DPI A4 glossy photo paper for maximum shop savings.',
    category: 'id-cards',
    badge: 'HOT',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    thumbnailType: 'multi-card',
    toolId: 'multi-card',
  },
  {
    id: 'passport-maker',
    title: 'Passport & Visa Photo Grid Maker',
    description: 'Print 4x6 (6 or 8 photos) and A4 (32 photos) sheets with instant blue/white background replacer.',
    category: 'photos',
    badge: 'HOT',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    thumbnailType: 'passport-grid',
    toolId: 'passport-maker',
  },
  {
    id: 'signature-enhancer',
    title: 'Signature Background Whiten & Stamp Fixer',
    description: 'Turn yellow/blue mobile photos of signatures and official rubber stamps into crisp transparent/white vectors.',
    category: 'enhancement',
    badge: 'AI',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    thumbnailType: 'signature-stamp',
    toolId: 'signature-enhancer',
  },
  {
    id: 'ai-upscaler',
    title: 'AI Photo & Old Document Restorer',
    description: 'Client-side Unsharp Mask and contrast enhancer to salvage blurred WhatsApp mobile scans.',
    category: 'enhancement',
    badge: 'AI',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    thumbnailType: 'ai-upscaler',
    toolId: 'ai-upscaler',
  },
  {
    id: 'invoice-maker',
    title: 'Modern Invoice & GST Bill Maker',
    description: 'Create professional A4 & 2/3-inch thermal bills with dynamic UPI QR & WhatsApp share.',
    category: 'utilities',
    badge: 'FREE',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    thumbnailType: 'invoice-bill',
    toolId: 'invoice-maker',
  },
  {
    id: 'cash-counter',
    title: 'Daily Ledger & Cash Counter Tally',
    description: 'Fast note denomination counter (₹500, ₹200, ₹100) with live total & words for shop closing.',
    category: 'utilities',
    badge: 'FREE',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    thumbnailType: 'cash-counter',
    toolId: 'cash-counter',
  },
  {
    id: 'thermal-slip',
    title: 'AEPS & Cash Withdrawal Thermal Slip',
    description: 'Print 2-inch and 3-inch POS thermal slips for AePS cash out, money transfer & banking receipts.',
    category: 'utilities',
    badge: 'NEW',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    thumbnailType: 'thermal-slip',
    toolId: 'thermal-slip',
  },
  {
    id: 'payment-standee',
    title: 'Payment Standee UPI QR Generator',
    description: 'Design ready-to-print branded acrylic shop counter standees with your Google Pay/PhonePe QR.',
    category: 'utilities',
    badge: 'HOT',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    thumbnailType: 'payment-standee',
    toolId: 'payment-standee',
  },
  {
    id: 'shop-rate-banner',
    title: 'Shop Service Rate Banner Designer',
    description: 'Print ready-to-hang A4 cyber cafe price charts (Xerox, PVC, Lamination, Online Forms).',
    category: 'utilities',
    badge: 'NEW',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    thumbnailType: 'rate-banner',
    toolId: 'rate-banner',
  },
  {
    id: 'direct-wa-chat',
    title: 'Direct WhatsApp Customer Chat',
    description: 'Send print PDF and receipts to customer mobile number without saving as contact.',
    category: 'utilities',
    badge: 'FREE',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    thumbnailType: 'wa-chat',
    toolId: 'wa-direct',
  },
  {
    id: 'age-calc',
    title: 'Govt Exam Age & DOB Calculator',
    description: 'Calculate exact years, months, and days for SSC, UPSC, and Railway cutoff dates.',
    category: 'utilities',
    badge: 'FREE',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
    thumbnailType: 'age-calc',
    toolId: 'age-calc',
  },
  {
    id: 'land-calc',
    title: 'Land Area Converter (Katha / Bigha)',
    description: 'Convert Katha, Bigha, Satak, Decimal, Dismil, Acre, and Sqft for registry & revenue forms.',
    category: 'utilities',
    badge: 'FREE',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    thumbnailType: 'land-calc',
    toolId: 'land-calc',
  },
];

interface DashboardPageProps {
  currentUser?: SessionUser | null;
  onSelectTool: (toolId: PortalToolId) => void;
  onOpenAdminPortal?: () => void;
  onOpenPricing?: () => void;
  onOpenSignIn?: () => void;
  onOpenRegister?: () => void;
}

export default function DashboardPage({
  currentUser,
  onSelectTool,
  onOpenAdminPortal,
  onOpenPricing,
  onOpenSignIn,
  onOpenRegister,
}: DashboardPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>(['image-reducer', 'passport-studio', 'smart-id', 'master-compressor', 'govt-resizer']);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState<boolean>(false);

  // Interactive Counter Station State
  const [stationTab, setStationTab] = useState<'compress' | 'exam-specs' | 'passport' | 'smart-id' | 'pdf'>('compress');
  const [activeExamIndex, setActiveExamIndex] = useState<number>(0);
  const [miniTargetKb, setMiniTargetKb] = useState<number>(50);
  const [miniOriginalKb] = useState<number>(1840);
  const [miniCompressedKb, setMiniCompressedKb] = useState<number>(44);
  const [miniIsCompressing, setMiniIsCompressing] = useState<boolean>(false);

  const handleMiniTargetChange = (kb: number) => {
    setMiniTargetKb(kb);
    setMiniIsCompressing(true);
    setTimeout(() => {
      setMiniCompressedKb(Math.max(12, Math.round(kb * 0.92)));
      setMiniIsCompressing(false);
    }, 200);
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('np_user_favorite_tools');
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = favorites.includes(id)
      ? favorites.filter((fav) => fav !== id)
      : [...favorites, id];
    setFavorites(updated);
    try {
      localStorage.setItem('np_user_favorite_tools', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const filteredTools = useMemo(() => {
    return ALL_VISUAL_SERVICES.filter((tool) => {
      if (selectedCategory === 'favorites') {
        if (!favorites.includes(tool.id)) return false;
      } else if (selectedCategory === 'free-no-login') {
        if (!tool.isFreeWithoutLogin) return false;
      } else if (selectedCategory !== 'all' && tool.category !== selectedCategory) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          tool.title.toLowerCase().includes(q) ||
          tool.description.toLowerCase().includes(q) ||
          tool.category.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [selectedCategory, searchQuery, favorites]);

  return (
    <div className="flex-1 flex flex-col bg-[#050f26] text-slate-100 overflow-y-auto">
      {/* ---------------------------------------------------- */}
      {/* 1. INTERACTIVE HERO SECTION (MATCHING NTECHBAY IMAGE 1) */}
      {/* ---------------------------------------------------- */}
      <section className="relative w-full bg-gradient-to-b from-[#0c2461] via-[#091b49] to-[#050f26] pt-10 pb-16 px-4 sm:px-8 border-b border-blue-900/60 overflow-hidden">
        {/* Glow Halos & Constellation Grid Effect */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Floating Avatar Widget on Left (Matching Image 1) */}
        <div className="hidden xl:flex flex-col items-center absolute left-8 top-16 group z-20">
          <div className="relative">
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-orange-500 text-white font-black text-[10px] shadow-lg shadow-orange-500/40 whitespace-nowrap animate-bounce">
              Say Hi! 🔥
            </span>
            <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-tr from-cyan-400 to-blue-600 p-0.5 shadow-xl border-2 border-cyan-400 group-hover:scale-110 transition-transform">
              <img
                src="https://nitishkhobragade.github.io/portfolio.nitish/img/logo.png"
                alt="Er. Nitish"
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/bottts/svg?seed=NK';
                }}
              />
            </div>
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#091b49]" />
          </div>

          <div className="mt-2 text-center">
            <span className="px-2 py-0.5 rounded-md bg-blue-950/80 border border-blue-800 text-[10px] font-bold text-cyan-300 block font-mono">
              CS & IT RIG ⚙️
            </span>
            <span className="text-[9px] text-slate-400 block mt-0.5 font-mono">
              Print Algorithms · AI & CV
            </span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto flex flex-col items-center text-center relative z-10 space-y-4">
          {/* Main Title & Subtitle */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            NK PrintBay Operating System
          </h1>
          <h2 className="text-lg sm:text-xl font-bold text-amber-300 -mt-1">
            साइबर कैफे, सीएससी एवं फोटो स्टूडियो के लिए सम्पूर्ण 1-क्लिक ऑपरेटिंग सिस्टम
          </h2>

          {/* Academic & Counter Resource Portal Statement (Matching Image 1) */}
          <p className="max-w-3xl text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Academic & Counter utility engine created by{' '}
            <b className="text-white underline decoration-cyan-400">Er. Nitish Khobragade (NK)</b> for Cyber Cafes, CSC Centers, Photo Studios & Online Operators.
            <br />
            <span className="text-cyan-300 font-semibold text-xs mt-0.5 inline-block">
              1-क्लिक e-Aadhaar/PAN/Voter PVC कार्ड, 300 DPI पासपोर्ट फोटो, GST बिलिंग एवं 50+ काउंटर टूल्स!
            </span>
          </p>

          {/* 3 Prominent Action Buttons (Matching Image 1) */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            {currentUser ? (
              <button
                onClick={() => onSelectTool('smart-id')}
                className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer hover:scale-105"
              >
                <CreditCard className="w-4 h-4" />
                <span>Launch Smart ID Engine →</span>
              </button>
            ) : (
              <button
                onClick={onOpenSignIn}
                className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer hover:scale-105"
              >
                <LogIn className="w-4 h-4" />
                <span>Operator Sign In (ऑपरेटर लॉगिन) →</span>
              </button>
            )}

            {!currentUser && (
              <button
                onClick={onOpenRegister}
                className="px-6 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/30 flex items-center gap-2 transition-all cursor-pointer hover:scale-105"
              >
                <UserPlus className="w-4 h-4" />
                <span>New Operator Register (नया पंजीकरण)</span>
              </button>
            )}

            <button
              onClick={() => setIsDirectoryOpen(true)}
              className="px-6 py-2.5 rounded-full bg-blue-950/80 hover:bg-blue-900 border border-blue-700/80 text-blue-200 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Browse All Utilities (सभी 50+ टूल्स)</span>
            </button>
          </div>

          {/* 4 Interactive Feature Highlights Cards (Image 1 Style) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full pt-6 text-left">
            {/* Card 1 */}
            <div
              onClick={() => onSelectTool('smart-id')}
              className="bg-blue-950/60 hover:bg-blue-900/60 border border-blue-800/80 rounded-2xl p-4 transition-all cursor-pointer hover:shadow-lg hover:shadow-blue-500/10 group"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-cyan-300 mb-2.5 group-hover:scale-110 transition-transform">
                <CreditCard className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-white">Smart ID Card Engine</h3>
              <p className="text-[11px] text-amber-300 font-medium mt-0.5">e-Aadhaar, PAN & Voter 2.0</p>
              <p className="text-[10px] text-slate-300 mt-1 leading-snug">
                1-Click auto-crop, color vector renderer & Epson L8050 PVC tray print.
              </p>
            </div>

            {/* Card 2 */}
            <div
              onClick={() => onSelectTool('passport-studio')}
              className="bg-blue-950/60 hover:bg-blue-900/60 border border-blue-800/80 rounded-2xl p-4 transition-all cursor-pointer hover:shadow-lg hover:shadow-cyan-500/10 group"
            >
              <div className="w-9 h-9 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 mb-2.5 group-hover:scale-110 transition-transform">
                <Camera className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-white">Passport Photo Studio</h3>
              <p className="text-[11px] text-cyan-300 font-medium mt-0.5">300/600 DPI Master Sheets</p>
              <p className="text-[10px] text-slate-300 mt-1 leading-snug">
                Biometric face loupe, 4x6 & A4 grids, DOP strip & Photoshop PSD export.
              </p>
            </div>

            {/* Card 3 (NEW FREE TOOL) */}
            <div
              onClick={() => onSelectTool('image-reducer')}
              className="bg-blue-950/60 hover:bg-blue-900/60 border border-emerald-500/50 rounded-2xl p-4 transition-all cursor-pointer hover:shadow-lg hover:shadow-emerald-500/10 group ring-1 ring-emerald-500/30"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 mb-2.5 group-hover:scale-110 transition-transform">
                <Minimize2 className="w-4 h-4" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs sm:text-sm text-white">Reduce Image Size in KB</h3>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                  FREE
                </span>
              </div>
              <p className="text-[11px] text-emerald-400 font-medium mt-0.5">Pi7 Style Instant Compress</p>
              <p className="text-[10px] text-slate-300 mt-1 leading-snug">
                Exact KB resize (20KB, 50KB, 100KB). 100% Free Without Login!
              </p>
            </div>

            {/* Card 4 */}
            <div
              onClick={() => onSelectTool('invoice-maker')}
              className="bg-blue-950/60 hover:bg-blue-900/60 border border-blue-800/80 rounded-2xl p-4 transition-all cursor-pointer hover:shadow-lg hover:shadow-purple-500/10 group"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 mb-2.5 group-hover:scale-110 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-white">Counter GST & Slips</h3>
              <p className="text-[11px] text-purple-300 font-medium mt-0.5">POS Thermal & GST Bills</p>
              <p className="text-[10px] text-slate-300 mt-1 leading-snug">
                2/3-inch thermal receipts, UPI dynamic QR code, and cash tally register.
              </p>
            </div>
          </div>

          {/* Pill Badges Row (Matching Image 1) */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-slate-300">
            <span className="px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800 text-blue-200">
              ✓ Direct CR80 1:1 Scale
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800 text-blue-200">
              ✓ 100% Client-Side Private (0 KB Upload)
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800 text-blue-200">
              ✓ Epson L8050 Tray Supported
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-bold">
              ✓ Free Image KB & PDF Tools Without Login
            </span>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 2. INTERACTIVE CYBER CAFE & STUDIO COUNTER WORKSTATION */}
      {/* ---------------------------------------------------- */}
      <section className="no-print max-w-7xl mx-auto w-full px-4 sm:px-8 -mt-8 z-30 relative mb-4">
        <div className="bg-[#0b1f4d]/95 backdrop-blur-xl border border-blue-700/60 rounded-3xl p-4 sm:p-6 shadow-2xl shadow-blue-950/70 space-y-5">
          {/* Header Row with Active Indicator & Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-900/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-black text-white text-xs sm:text-sm tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Live Interactive Counter Station (इंटरएक्टिव काउंटर टूल्स)
              </span>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 scrollbar-none">
              <button
                onClick={() => setStationTab('compress')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
                  stationTab === 'compress'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-blue-950 text-slate-300 hover:text-white border border-blue-800'
                }`}
              >
                <Minimize2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>⚡ Image KB Reducer (Free)</span>
              </button>

              <button
                onClick={() => setStationTab('exam-specs')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
                  stationTab === 'exam-specs'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-blue-950 text-slate-300 hover:text-white border border-blue-800'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5 text-cyan-300" />
                <span>📋 Govt Exam Photo Specs</span>
              </button>

              <button
                onClick={() => setStationTab('passport')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
                  stationTab === 'passport'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-blue-950 text-slate-300 hover:text-white border border-blue-800'
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-cyan-300" />
                <span>📷 1-Click Passport Studio</span>
              </button>

              <button
                onClick={() => setStationTab('smart-id')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
                  stationTab === 'smart-id'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-blue-950 text-slate-300 hover:text-white border border-blue-800'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-cyan-300" />
                <span>💳 Smart ID Card Engine</span>
              </button>

              <button
                onClick={() => setStationTab('pdf')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
                  stationTab === 'pdf'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-blue-950 text-slate-300 hover:text-white border border-blue-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-cyan-300" />
                <span>📄 PDF Suite (Free)</span>
              </button>
            </div>
          </div>

          {/* TAB 1: LIVE IMAGE KB COMPRESSOR */}
          {stationTab === 'compress' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-center">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <span>⚡ Instant Image Compressor in KB</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                        100% FREE · NO LOGIN
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Drag target KB slider or pick government form presets for instant client-side resizing.
                    </p>
                  </div>
                </div>

                {/* Preset Pills */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                    <span>Target File Size: <b className="text-cyan-300 font-mono text-sm">{miniTargetKb} KB</b></span>
                    <span className="text-[11px] text-emerald-400 font-mono">
                      Output: {miniIsCompressing ? 'Calculating...' : `~${miniCompressedKb} KB (-97%)`}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="15"
                    max="300"
                    step="5"
                    value={miniTargetKb}
                    onChange={(e) => handleMiniTargetChange(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer h-2 bg-blue-950 rounded-lg"
                  />

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] text-slate-400">Quick Presets:</span>
                    {[
                      { kb: 20, label: '20 KB (Signature)' },
                      { kb: 50, label: '50 KB (SSC Photo)' },
                      { kb: 100, label: '100 KB (UPSC Photo)' },
                      { kb: 200, label: '200 KB (Aadhaar/PAN)' },
                    ].map((p) => (
                      <button
                        key={p.kb}
                        onClick={() => handleMiniTargetChange(p.kb)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                          miniTargetKb === p.kb
                            ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                            : 'bg-blue-950/80 border border-blue-800 text-cyan-300 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Row */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      // Trigger download of a sample compressed file
                      const dummy = document.createElement('canvas');
                      dummy.width = 400;
                      dummy.height = 400;
                      const ctx = dummy.getContext('2d');
                      if (ctx) {
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, 400, 400);
                        ctx.fillStyle = '#1e3a8a';
                        ctx.font = 'bold 18px Arial';
                        ctx.fillText(`Compressed to ${miniCompressedKb} KB`, 40, 200);
                        const a = document.createElement('a');
                        a.href = dummy.toDataURL('image/jpeg', 0.85);
                        a.download = `photo_${miniCompressedKb}KB.jpg`;
                        a.click();
                      }
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all hover:scale-105"
                  >
                    <Download className="w-4 h-4" />
                    <span>📥 Download Compressed JPG Now (Free Without Login)</span>
                  </button>

                  <button
                    onClick={() => onSelectTool('image-reducer')}
                    className="px-4 py-2 bg-blue-950 hover:bg-blue-900 border border-blue-700 text-blue-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Launch Full Pi7 Tool →</span>
                  </button>
                </div>
              </div>

              {/* Right Visual Comparison Card */}
              <div className="bg-blue-950/80 border border-blue-800/80 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">Before vs After Comparison</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">100% Crisp Vector Text</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-black/40 rounded-xl p-2.5 border border-blue-900/60">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Original File</span>
                    <span className="font-black text-rose-400 font-mono text-sm">{miniOriginalKb} KB</span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">Uncompressed Scan</span>
                  </div>

                  <div className="bg-emerald-950/40 rounded-xl p-2.5 border border-emerald-500/40">
                    <span className="text-[10px] text-emerald-300 block mb-0.5">Compressed</span>
                    <span className="font-black text-emerald-400 font-mono text-sm">{miniCompressedKb} KB</span>
                    <span className="text-[9px] text-emerald-300 block mt-0.5 font-bold">Target Achieved ✓</span>
                  </div>
                </div>

                <div className="p-2.5 bg-blue-900/30 rounded-xl border border-blue-800/50 text-[11px] text-slate-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Runs entirely inside your browser. No files uploaded to any server.</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GOVT EXAM PHOTO & SIGNATURE SPECS FINDER */}
          {stationTab === 'exam-specs' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <span>📋 All-India Govt Exam Photo & Signature Specifications</span>
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-bold">
                      2026 Updated Rules
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Select an official exam below to see exact millimeter dimensions, KB bounds, and signature requirements.
                  </p>
                </div>
              </div>

              {/* Exam Pills Selector */}
              <div className="flex flex-wrap items-center gap-2">
                {GOVT_EXAM_PRESETS.map((exam, idx) => (
                  <button
                    key={exam.name}
                    onClick={() => setActiveExamIndex(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeExamIndex === idx
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-cyan-400'
                        : 'bg-blue-950/80 border border-blue-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>{exam.name}</span>
                  </button>
                ))}
              </div>

              {/* Active Exam Details Card */}
              {(() => {
                const spec = GOVT_EXAM_PRESETS[activeExamIndex];
                return (
                  <div className="bg-blue-950/70 border border-blue-800 rounded-2xl p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Photo Specs */}
                    <div className="space-y-2 bg-blue-900/30 rounded-xl p-3.5 border border-blue-800/60">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5" />
                          Photo Requirement
                        </span>
                        <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-mono font-bold">
                          {spec.photoSize}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white font-mono">{spec.photoDim}</p>
                      <p className="text-[11px] text-slate-300 leading-snug">{spec.photoNotes}</p>
                      {spec.dopRequired && (
                        <span className="inline-block text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">
                          ⚠️ Name & DOP Strip Required
                        </span>
                      )}
                    </div>

                    {/* Signature Specs */}
                    <div className="space-y-2 bg-blue-900/30 rounded-xl p-3.5 border border-blue-800/60">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          Signature Requirement
                        </span>
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">
                          {spec.signatureSize}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white font-mono">{spec.signatureDim}</p>
                      <p className="text-[11px] text-slate-300 leading-snug">{spec.signatureNotes}</p>
                      <span className="inline-block text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold">
                        Running Hand Only
                      </span>
                    </div>

                    {/* 1-Click Launch Actions */}
                    <div className="flex flex-col justify-between gap-3 bg-blue-900/20 rounded-xl p-3.5 border border-blue-800/40">
                      <div>
                        <span className="font-bold text-xs text-white block">Ready for {spec.name}?</span>
                        <p className="text-[11px] text-slate-300 mt-1">
                          Open calibrated editor with exact {spec.photoSize} & {spec.signatureSize} bounds.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <button
                          onClick={() => onSelectTool(spec.toolId)}
                          className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>🎯 Prepare Photo for {spec.name}</span>
                        </button>

                        <button
                          onClick={() => onSelectTool('signature-enhancer')}
                          className="w-full py-2 bg-blue-950 hover:bg-blue-900 border border-blue-700 text-blue-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>✍️ Whiten & Enhance Signature</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 3: PASSPORT STUDIO */}
          {stationTab === 'passport' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
              <div className="md:col-span-2 space-y-3">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>📷 1-Click Passport Photo Studio (300 & 600 DPI)</span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-bold">
                    Biometric Loupe · Multi-Grid
                  </span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Generate studio-quality passport photos with live touch magnifying loupe for 4-corner perspective adjustment, 1-click background color switch (White, Light Blue, Royal Blue), 50mm physical calibration scale, and direct multi-layer Adobe Photoshop (.PSD) export!
                </p>

                <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                  <div className="bg-blue-950 p-2 rounded-xl border border-blue-800">
                    <span className="font-bold text-white block">4×6" Tray</span>
                    <span className="text-[10px] text-cyan-300 font-mono">6 or 8 Copies</span>
                  </div>
                  <div className="bg-blue-950 p-2 rounded-xl border border-blue-800">
                    <span className="font-bold text-white block">A4 Sheet</span>
                    <span className="text-[10px] text-cyan-300 font-mono">12, 16, 32 Copies</span>
                  </div>
                  <div className="bg-blue-950 p-2 rounded-xl border border-blue-800">
                    <span className="font-bold text-white block">Biometric Guide</span>
                    <span className="text-[10px] text-emerald-400 font-mono">75% Head Height</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => onSelectTool('passport-studio')}
                    className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer hover:scale-105"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Launch 1-Click Passport Photo Studio →</span>
                  </button>
                </div>
              </div>

              <div className="bg-blue-950/80 border border-blue-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-center">
                <ServiceThumbnail type="passport-grid" />
                <span className="text-xs font-bold text-white">4×6 & A4 Multi-Grid Ready</span>
                <span className="text-[10px] text-slate-400">Export as JPG, PNG, PDF & PSD</span>
              </div>
            </div>
          )}

          {/* TAB 4: SMART ID CARD ENGINE */}
          {stationTab === 'smart-id' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
              <div className="md:col-span-2 space-y-3">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>💳 Dual-Mode Smart ID Card Processor (CR80 PVC)</span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-bold">
                    Aadhaar 2.0 · PAN · Voter
                  </span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Automatic password decryption for e-Aadhaar & e-PAN PDFs directly inside your browser. Built-in vector color card renderer for crystal clear PVC prints on Epson L8050 / L805 dual PVC card trays.
                </p>

                <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                  <div className="bg-blue-950 p-2 rounded-xl border border-blue-800">
                    <span className="font-bold text-white block">e-Aadhaar 2.0</span>
                    <span className="text-[10px] text-cyan-300 font-mono">1-Click Auto-Crop</span>
                  </div>
                  <div className="bg-blue-950 p-2 rounded-xl border border-blue-800">
                    <span className="font-bold text-white block">PAN Card</span>
                    <span className="text-[10px] text-cyan-300 font-mono">NSDL / UTIITSL</span>
                  </div>
                  <div className="bg-blue-950 p-2 rounded-xl border border-blue-800">
                    <span className="font-bold text-white block">Epson L8050</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Dual Tray 1:1 Scale</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => onSelectTool('smart-id')}
                    className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer hover:scale-105"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Launch Dual-Mode Smart ID Engine →</span>
                  </button>
                </div>
              </div>

              <div className="bg-blue-950/80 border border-blue-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-center">
                <ServiceThumbnail type="aadhaar-2" />
                <span className="text-xs font-bold text-white">ISO/IEC 7810 CR80 Standard</span>
                <span className="text-[10px] text-slate-400">85.60 × 53.98 mm Calibrated</span>
              </div>
            </div>
          )}

          {/* TAB 5: PDF SUITE & CONVERTER */}
          {stationTab === 'pdf' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <span>📄 Complete PDF Suite & Universal Converter</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                      100% FREE · NO LOGIN
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Combine photos into A4 PDF, compress large PDFs to &lt;100KB/&lt;200KB, or extract 300 DPI images for free.
                  </p>
                </div>

                <button
                  onClick={() => onSelectTool('pdf-suite')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Launch PDF Suite →</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div
                  onClick={() => onSelectTool('pdf-suite')}
                  className="bg-blue-950/80 hover:bg-blue-900/80 border border-blue-800 rounded-xl p-3.5 flex flex-col gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    Images to A4 PDF
                  </span>
                  <p className="text-[11px] text-slate-300">
                    Select customer documents or photos and combine into 1 printable A4 PDF.
                  </p>
                </div>

                <div
                  onClick={() => onSelectTool('pdf-suite')}
                  className="bg-blue-950/80 hover:bg-blue-900/80 border border-blue-800 rounded-xl p-3.5 flex flex-col gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Minimize2 className="w-3.5 h-3.5 text-emerald-400" />
                    Compress PDF in KB
                  </span>
                  <p className="text-[11px] text-slate-300">
                    Reduce large multi-MB scanned PDF files to &lt;100KB, &lt;200KB or &lt;300KB.
                  </p>
                </div>

                <div
                  onClick={() => onSelectTool('pdf-suite')}
                  className="bg-blue-950/80 hover:bg-blue-900/80 border border-blue-800 rounded-xl p-3.5 flex flex-col gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    PDF to 300 DPI Images
                  </span>
                  <p className="text-[11px] text-slate-300">
                    Extract crisp JPG/PNG pages 1-by-1 directly without needing cloud converters.
                  </p>
                </div>

                <div
                  onClick={() => onSelectTool('pdf-suite')}
                  className="bg-blue-950/80 hover:bg-blue-900/80 border border-blue-800 rounded-xl p-3.5 flex flex-col gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-purple-400" />
                    Merge & Split PDFs
                  </span>
                  <p className="text-[11px] text-slate-300">
                    Join multiple PDF files into one or delete unwanted pages with 1 click.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 2. CATEGORY BAR & SEARCH (HIGH-INTENT OPERATOR FILTER) */}
      {/* ---------------------------------------------------- */}
      <section className="no-print max-w-7xl mx-auto w-full px-4 sm:px-8 pt-6 pb-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tools (Aadhaar, Image KB, Passport, Invoice)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0b1f4d] border border-blue-900 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto text-xs pb-1 scrollbar-none">
          {[
            { id: 'all', label: `All Tools (${ALL_VISUAL_SERVICES.length})` },
            { id: 'free-no-login', label: `⚡ Free Without Login (3)` },
            { id: 'favorites', label: `★ Favorites (${favorites.length})` },
            { id: 'id-cards', label: 'PAN & Voter / ID' },
            { id: 'photos', label: 'Passport & Photos' },
            { id: 'govt-forms', label: 'Govt Form Resizers' },
            { id: 'utilities', label: 'Daily Shop Utilities' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-colors cursor-pointer text-xs ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                  : 'bg-[#0b1f4d] text-slate-300 hover:text-white border border-blue-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 3. VISUAL SERVICES GRID                              */}
      {/* ---------------------------------------------------- */}
      <main className="no-print max-w-7xl mx-auto w-full px-4 sm:px-8 pb-16 flex-1">
        {filteredTools.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <span className="text-2xl">🔍</span>
            <span className="text-sm font-semibold text-slate-300">No matching services found</span>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="text-xs text-cyan-400 underline cursor-pointer mt-1"
            >
              Clear filters and view all tools
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredTools.map((tool) => {
              const isFav = favorites.includes(tool.id);
              return (
                <div
                  key={tool.id}
                  onClick={() => onSelectTool(tool.toolId)}
                  className="bg-[#0b1f4d]/80 hover:bg-[#0d255c] border border-blue-900/80 hover:border-blue-600/80 rounded-2xl p-4 flex flex-col justify-between transition-all cursor-pointer shadow-lg hover:shadow-cyan-500/10 group"
                >
                  <div className="space-y-3">
                    {/* Header with Favorite Heart & Badge */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={(e) => toggleFavorite(e, tool.id)}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          isFav
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                            : 'bg-blue-950/60 text-slate-500 border-blue-900 hover:text-white'
                        }`}
                        title="Add to Favorites"
                      >
                        <Heart className="w-3.5 h-3.5 fill-current" />
                      </button>

                      <div className="flex items-center gap-1.5">
                        {tool.isFreeWithoutLogin && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                            NO LOGIN
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${tool.badgeColor}`}
                        >
                          {tool.badge}
                        </span>
                      </div>
                    </div>

                    {/* Visual Card Thumbnail */}
                    <ServiceThumbnail type={tool.thumbnailType} />

                    {/* Title & Description */}
                    <div>
                      <h3 className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  {/* Launch Action */}
                  <div className="pt-3 border-t border-blue-900/60 flex items-center justify-between text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
                    <span>{tool.isFreeWithoutLogin ? 'Open Free Tool' : 'Open Service'}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Directory Modal */}
      {isDirectoryOpen && (
        <AllServicesDirectoryModal
          isOpen={isDirectoryOpen}
          onClose={() => setIsDirectoryOpen(false)}
          onSelectTool={(id) => {
            setIsDirectoryOpen(false);
            onSelectTool(id as PortalToolId);
          }}
          onOpenPricing={onOpenPricing}
        />
      )}
    </div>
  );
}
