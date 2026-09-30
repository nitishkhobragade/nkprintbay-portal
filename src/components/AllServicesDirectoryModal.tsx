'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * src/components/AllServicesDirectoryModal.tsx
 * Comprehensive Services & Tools Directory Modal for NK PrintBay.
 * Matches all 4 categories, search filtering, launch handlers,
 * and direct government & CSC portal hubs.
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  ExternalLink,
  CreditCard,
  FileText,
  Wrench,
  Globe,
  Sparkles,
  Camera,
  Layers,
  FileCheck2,
  Printer,
  FileSpreadsheet,
  Receipt,
  Scan,
  Smartphone,
  ShieldCheck,
  Zap,
  Star,
  Maximize2,
  Sun,
  Eye,
  Sliders,
  DollarSign,
  QrCode,
  Lock,
  Scissors
} from 'lucide-react';
import { PortalToolId } from '../../app/dashboard/page';

export type DirectoryCategory =
  | 'all'
  | 'favorites'
  | 'id-cards'
  | 'pdf-images'
  | 'utilities'
  | 'gov-portals'
  | 'advanced';

export interface ServiceItem {
  id: string;
  title: string;
  category: 'id-cards' | 'pdf-images' | 'utilities' | 'gov-portals' | 'advanced';
  description: string;
  badge?: string;
  badgeColor?: string;
  isFavorite?: boolean;
  internalToolId?: PortalToolId;
  externalUrl?: string;
  iconName: string;
  colorScheme: string; // for icon background
}

export const ALL_SERVICES_CATALOG: ServiceItem[] = [
  // ----------------------------------------------------
  // TAB 1: ID CARDS & PAN / VOTER
  // ----------------------------------------------------
  {
    id: 'smart-id-processor',
    title: 'Dual-Mode Smart ID Processor',
    category: 'id-cards',
    description: '1-Click PDF Cropper + Vector Color Aadhaar, PAN & Voter Renderer (CR80 300 DPI).',
    badge: 'NEW',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    isFavorite: true,
    internalToolId: 'smart-id',
    iconName: 'CreditCard',
    colorScheme: 'from-blue-600 to-cyan-600',
  },
  {
    id: 'color-aadhaar-2',
    title: 'Color Aadhaar 2.0',
    category: 'id-cards',
    description: '1-Click Auto Crop & Print e-Aadhaar bottom strip to 300 DPI CR80.',
    badge: 'HOT',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    isFavorite: true,
    internalToolId: 'card-engine',
    iconName: 'CreditCard',
    colorScheme: 'from-orange-500 to-amber-500',
  },
  {
    id: 'voter-card-ai',
    title: 'Voter Card AI Cropper',
    category: 'id-cards',
    description: 'Auto Crop Front & Back alignment for Election Commission e-EPIC.',
    badge: 'HOT',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    isFavorite: true,
    internalToolId: 'card-engine',
    iconName: 'Vote',
    colorScheme: 'from-blue-600 to-indigo-600',
  },
  {
    id: 'pan-card-ai',
    title: 'PAN Card AI Cropper',
    category: 'id-cards',
    description: 'Auto Crop Front & Back for NSDL & UTIITSL e-PAN format.',
    badge: 'POPULAR',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    isFavorite: true,
    internalToolId: 'card-engine',
    iconName: 'CreditCard',
    colorScheme: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'multi-card-tray',
    title: 'Multi Card Print Tray',
    category: 'id-cards',
    description: 'Mount 2 to 5 different ID cards on a single A4 page with fold guides.',
    badge: 'CORE',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    isFavorite: true,
    internalToolId: 'multi-card',
    iconName: 'Layers',
    colorScheme: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'ayushman-card-cropper',
    title: 'Ayushman Card Cropper',
    category: 'id-cards',
    description: 'PM-JAY Golden Card dual-sided border alignment & 300 DPI upscale.',
    badge: 'FREE',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    internalToolId: 'card-engine',
    iconName: 'ShieldCheck',
    colorScheme: 'from-amber-500 to-rose-500',
  },
  {
    id: 'e-shram-card',
    title: 'e-Shram Card AI Cropper',
    category: 'id-cards',
    description: 'Auto Crop Front & Back e-Shram worker identity cards.',
    internalToolId: 'card-engine',
    iconName: 'CreditCard',
    colorScheme: 'from-amber-600 to-orange-600',
  },
  {
    id: 'abha-health-card',
    title: 'ABHA Card AI Cropper',
    category: 'id-cards',
    description: 'Ayushman Bharat Digital Health Account 14-digit card print format.',
    internalToolId: 'card-engine',
    iconName: 'CreditCard',
    colorScheme: 'from-teal-500 to-emerald-600',
  },
  {
    id: 'ration-card-splitter',
    title: 'Ration Card AI Splitter',
    category: 'id-cards',
    description: 'Multi-page NFSA ration card extraction & pocket card layout.',
    internalToolId: 'card-engine',
    iconName: 'FileText',
    colorScheme: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'apaar-id-card',
    title: 'APAAR ID Card Cropper',
    category: 'id-cards',
    description: 'One Nation One Student ID card 1:1 canvas for schools & colleges.',
    internalToolId: 'card-engine',
    iconName: 'CreditCard',
    colorScheme: 'from-purple-600 to-indigo-600',
  },
  {
    id: 'epson-l8050-tray',
    title: 'Epson L8050 PVC Tray',
    category: 'id-cards',
    description: 'Dedicated tray coordinates for Epson L8050 / L805 dual PVC card slot.',
    badge: 'PRO',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    internalToolId: 'card-engine',
    iconName: 'Printer',
    colorScheme: 'from-sky-500 to-blue-700',
  },
  {
    id: 'pvc-card-cover-fold',
    title: 'PVC Card Cover & Fold',
    category: 'id-cards',
    description: '4 ready-to-fold PVC card pouches and thermal laminating sizes.',
    internalToolId: 'card-engine',
    iconName: 'Maximize2',
    colorScheme: 'from-neutral-600 to-neutral-800',
  },

  // ----------------------------------------------------
  // TAB 2: PDF & IMAGES SUITE
  // ----------------------------------------------------
  {
    id: 'master-compressor-service',
    title: 'Master Batch Image & PDF Compressor',
    category: 'pdf-images',
    description: 'Compress multiple images & PDFs with individual KB, rename, delete cross, and sequential 1-by-1 downloads.',
    badge: 'HOT',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    isFavorite: true,
    internalToolId: 'master-compressor',
    iconName: 'Archive',
    colorScheme: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'ai-vision-upscaler',
    title: 'AI Vision Upscaler 2.0',
    category: 'pdf-images',
    description: 'Real-ESRGAN / Face Illumination 4x detail enhancer for blurry photos.',
    badge: 'AI',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    isFavorite: true,
    internalToolId: 'ai-upscaler',
    iconName: 'Sparkles',
    colorScheme: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'bg-remover-signature',
    title: 'BG Remover & Enhancer',
    category: 'pdf-images',
    description: 'Remove background, clean yellowish paper, and boost signature contrast.',
    badge: 'FREE',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    isFavorite: true,
    internalToolId: 'signature-enhancer',
    iconName: 'Scissors',
    colorScheme: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'passport-studio-tool',
    title: '1-Click Passport Photo Studio',
    category: 'pdf-images',
    description: 'Webcam capture, biometric oval guide, 1-click background, 4x6 & A4 grids with 50mm ruler.',
    badge: '300 DPI',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    isFavorite: true,
    internalToolId: 'passport-studio',
    iconName: 'Camera',
    colorScheme: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'passport-maker-grid',
    title: 'Passport & Visa Photo Maker',
    category: 'pdf-images',
    description: 'Print 6, 8, 12, or 32 passport copies on 4x6" or A4 with DOP/Name strip.',
    badge: 'HOT',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    isFavorite: true,
    internalToolId: 'passport-maker',
    iconName: 'Camera',
    colorScheme: 'from-rose-500 to-pink-600',
  },
  {
    id: 'govt-form-resizer',
    title: 'Govt Form Photo & Sign Resizer',
    category: 'pdf-images',
    description: 'Combine and compress photo & signature to exact KB (SSC, UPSC, IBPS).',
    badge: 'CORE',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    isFavorite: true,
    internalToolId: 'govt-resizer',
    iconName: 'FileCheck2',
    colorScheme: 'from-amber-500 to-orange-600',
  },
  {
    id: 'pdf-password-remover',
    title: 'PDF Password Decryptor',
    category: 'pdf-images',
    description: 'Decrypt e-Aadhaar, e-PAN, and bank statement password without cloud upload.',
    badge: 'FAST',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    internalToolId: 'card-engine',
    iconName: 'Lock',
    colorScheme: 'from-blue-600 to-indigo-700',
  },
  {
    id: 'image-kb-reducer',
    title: 'Image KB Reducer',
    category: 'pdf-images',
    description: 'Precision binary search compression to target <50KB, <20KB, <10KB.',
    internalToolId: 'govt-resizer',
    iconName: 'Sliders',
    colorScheme: 'from-violet-500 to-purple-600',
  },
  {
    id: 'image-dpi-converter',
    title: '300 DPI Image Converter',
    category: 'pdf-images',
    description: 'Convert 72/96 DPI mobile photos into pristine 300 DPI print-ready canvas.',
    internalToolId: 'card-engine',
    iconName: 'Maximize2',
    colorScheme: 'from-sky-500 to-cyan-600',
  },

  // ----------------------------------------------------
  // TAB 3: DAILY SHOP UTILITIES
  // ----------------------------------------------------
  {
    id: 'invoice-gst-maker',
    title: 'Modern Invoice & GST Bill Maker',
    category: 'utilities',
    description: 'Live A4 preview, WhatsApp sharing, QR Scan & Pay, and thermal receipt print.',
    badge: 'HOT',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    isFavorite: true,
    internalToolId: 'invoice-maker',
    iconName: 'Receipt',
    colorScheme: 'from-indigo-600 to-blue-600',
  },
  {
    id: 'aeps-thermal-slip',
    title: 'AEPS & Cash Thermal Slip',
    category: 'utilities',
    description: 'Instant 2-inch & 3-inch withdrawal slips with Bank, RRN, and Balance.',
    badge: 'NEW',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    isFavorite: true,
    internalToolId: 'thermal-slip',
    iconName: 'Printer',
    colorScheme: 'from-emerald-600 to-teal-700',
  },
  {
    id: 'cash-counter-tally',
    title: 'Daily Ledger & Cash Counter',
    category: 'utilities',
    description: 'Count currency notes (₹500, ₹200, ₹100, etc.) with live total & words.',
    badge: 'FREE',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    isFavorite: true,
    internalToolId: 'cash-counter',
    iconName: 'DollarSign',
    colorScheme: 'from-amber-500 to-yellow-600',
  },
  {
    id: 'payment-standee-qr',
    title: 'Payment Standee UPI QR',
    category: 'utilities',
    description: 'Create ready-to-print branded shop counter standee with your GPay/PhonePe UPI.',
    internalToolId: 'payment-standee',
    iconName: 'QrCode',
    colorScheme: 'from-rose-500 to-orange-500',
  },
  {
    id: 'shop-rate-banner',
    title: 'Shop Service Rate Banner',
    category: 'utilities',
    description: 'Design ready-to-print cyber cafe price charts and rate cards.',
    internalToolId: 'rate-banner',
    iconName: 'FileSpreadsheet',
    colorScheme: 'from-purple-500 to-pink-600',
  },
  {
    id: 'direct-wa-chat',
    title: 'Direct WhatsApp Chat Launcher',
    category: 'utilities',
    description: 'Send print PDF to customer phone number without saving as contact.',
    internalToolId: 'wa-direct',
    iconName: 'Smartphone',
    colorScheme: 'from-green-500 to-emerald-600',
  },
  {
    id: 'age-calculator',
    title: 'Age & DOB Calculator',
    category: 'utilities',
    description: 'Calculate exact years, months, and days for job eligibility cutoffs.',
    internalToolId: 'age-calc',
    iconName: 'Calendar',
    colorScheme: 'from-pink-500 to-rose-600',
  },
  {
    id: 'land-area-converter',
    title: 'Land Area Converter',
    category: 'utilities',
    description: 'Convert Katha, Bigha, Satak, Decimal, Dismil, Acre, and Sqft.',
    internalToolId: 'land-calc',
    iconName: 'Maximize2',
    colorScheme: 'from-emerald-500 to-green-700',
  },

  // ----------------------------------------------------
  // TAB 4: GOVT PORTALS DIRECT HUB
  // ----------------------------------------------------
  {
    id: 'gov-uidai',
    title: 'UIDAI myAadhaar Portal',
    category: 'gov-portals',
    description: 'Download Aadhaar, verify mobile/email, check PVC card status.',
    externalUrl: 'https://myaadhaar.uidai.gov.in/',
    iconName: 'Globe',
    colorScheme: 'from-orange-500 to-amber-600',
  },
  {
    id: 'gov-utiitsl',
    title: 'UTIITSL Pan Portal',
    category: 'gov-portals',
    description: 'Apply new PAN, re-print e-PAN card, track PAN application.',
    externalUrl: 'https://www.pan.utiitsl.com/',
    iconName: 'Globe',
    colorScheme: 'from-blue-600 to-indigo-600',
  },
  {
    id: 'gov-nsdl',
    title: 'Protean / NSDL PAN Hub',
    category: 'gov-portals',
    description: 'Paperless e-KYC PAN application & status verification.',
    externalUrl: 'https://www.onlineservices.nsdl.com/paam/endUserRegisterContact.html',
    iconName: 'Globe',
    colorScheme: 'from-cyan-600 to-blue-700',
  },
  {
    id: 'gov-voters',
    title: 'Voters Service Portal (ECI)',
    category: 'gov-portals',
    description: 'Form 6 new voter registration, download e-EPIC, shift address.',
    externalUrl: 'https://voters.eci.gov.in/',
    iconName: 'Globe',
    colorScheme: 'from-purple-600 to-indigo-700',
  },
  {
    id: 'gov-parivahan',
    title: 'Parivahan / Sarathi (DL & RC)',
    category: 'gov-portals',
    description: 'Driving license apply, renewal, slot booking, RC fitness check.',
    externalUrl: 'https://parivahan.gov.in/',
    iconName: 'Globe',
    colorScheme: 'from-emerald-600 to-teal-700',
  },
  {
    id: 'gov-echallan',
    title: 'e-Challan Parivahan',
    category: 'gov-portals',
    description: 'Check traffic police challan status and online payment.',
    externalUrl: 'https://echallan.parivahan.gov.in/',
    iconName: 'Globe',
    colorScheme: 'from-rose-600 to-red-700',
  },
  {
    id: 'gov-pmkisan',
    title: 'PM-Kisan Samman Nidhi',
    category: 'gov-portals',
    description: 'Beneficiary status, farmer eKYC, new farmer registration.',
    externalUrl: 'https://pmkisan.gov.in/',
    iconName: 'Globe',
    colorScheme: 'from-green-600 to-emerald-700',
  },
  {
    id: 'gov-pmsuryaghar',
    title: 'PM Surya Ghar Muft Bijli',
    category: 'gov-portals',
    description: 'Rooftop solar subsidy portal registration & tracker.',
    externalUrl: 'https://pmsuryaghar.gov.in/',
    iconName: 'Globe',
    colorScheme: 'from-amber-500 to-yellow-600',
  },
  {
    id: 'gov-udyam',
    title: 'Udyam MSME Registration',
    category: 'gov-portals',
    description: 'Free Zero-Fee Govt MSME registration certificate generation.',
    externalUrl: 'https://udyamregistration.gov.in/',
    iconName: 'Globe',
    colorScheme: 'from-blue-500 to-cyan-600',
  },
  {
    id: 'gov-epfo',
    title: 'EPFO Member Passbook',
    category: 'gov-portals',
    description: 'UAN login, PF balance check, online claim withdrawal.',
    externalUrl: 'https://passbook.epfindia.gov.in/MemberPassBook/Login',
    iconName: 'Globe',
    colorScheme: 'from-blue-700 to-indigo-800',
  },
  {
    id: 'gov-ceir',
    title: 'CEIR Sanchar Saathi',
    category: 'gov-portals',
    description: 'Block lost/stolen mobile phones & IMEI verification.',
    externalUrl: 'https://ceir.sancharsaathi.gov.in/',
    iconName: 'Globe',
    colorScheme: 'from-rose-500 to-red-600',
  },
];

interface AllServicesDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (toolId: PortalToolId) => void;
  onOpenPricing?: () => void;
}

export default function AllServicesDirectoryModal({
  isOpen,
  onClose,
  onSelectTool,
  onOpenPricing,
}: AllServicesDirectoryModalProps) {
  const [activeCategory, setActiveCategory] = useState<DirectoryCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredServices = useMemo(() => {
    return ALL_SERVICES_CATALOG.filter((item) => {
      // Category filter
      if (activeCategory === 'favorites') {
        if (!item.isFavorite) return false;
      } else if (activeCategory !== 'all') {
        if (item.category !== activeCategory) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [activeCategory, searchQuery]);

  if (!isOpen) return null;

  const handleLaunch = (item: ServiceItem) => {
    if (item.internalToolId) {
      onSelectTool(item.internalToolId);
      onClose();
    } else if (item.externalUrl) {
      window.open(item.externalUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Top Header Bar */}
        <div className="border-b border-neutral-800 bg-neutral-950/80 px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center text-cyan-400">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>All Services Directory</span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  50+ UTILITIES
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Browse and launch any cyber cafe, CSC, or govt portal service directly
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenPricing && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPricing();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-semibold transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Pricing Plans</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar & Category Filter Pills */}
        <div className="p-6 pb-2 border-b border-neutral-800/60 bg-neutral-900/50 flex flex-col gap-4">
          
          {/* Large Search Input */}
          <div className="relative w-full">
            <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search any service, tool, or portal (e.g. Aadhaar, Invoice, Voter, Resizer, PAN)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-950/90 border border-neutral-800 rounded-2xl pl-12 pr-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20'
                  : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-750'
              }`}
            >
              All Services ({ALL_SERVICES_CATALOG.length})
            </button>

            <button
              onClick={() => setActiveCategory('favorites')}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeCategory === 'favorites'
                  ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20'
                  : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-750'
              }`}
            >
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>★ Popular Favorites</span>
            </button>

            <button
              onClick={() => setActiveCategory('id-cards')}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === 'id-cards'
                  ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20'
                  : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-750'
              }`}
            >
              PAN & Voter / ID Cards
            </button>

            <button
              onClick={() => setActiveCategory('pdf-images')}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === 'pdf-images'
                  ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20'
                  : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-750'
              }`}
            >
              PDF & Images Suite
            </button>

            <button
              onClick={() => setActiveCategory('utilities')}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === 'utilities'
                  ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20'
                  : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-750'
              }`}
            >
              Daily Shop Utilities
            </button>

            <button
              onClick={() => setActiveCategory('gov-portals')}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === 'gov-portals'
                  ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20'
                  : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-750'
              }`}
            >
              Govt Portals Direct Hub
            </button>
          </div>
        </div>

        {/* Directory Grid (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredServices.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center gap-3">
              <Search className="w-8 h-8 text-neutral-600" />
              <p className="text-sm text-neutral-400 font-medium">
                No tools or portals found matching &quot;{searchQuery}&quot;
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="text-xs text-cyan-400 underline cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="bg-neutral-950/70 hover:bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-4 flex items-center justify-between gap-3.5 transition-all group shadow-sm hover:shadow-lg hover:shadow-cyan-500/5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Tool Icon with Gradient */}
                    <div
                      className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${service.colorScheme} p-0.5 flex-shrink-0 shadow-md`}
                    >
                      <div className="w-full h-full bg-neutral-900 rounded-[10px] flex items-center justify-center text-white">
                        {renderServiceIcon(service.iconName)}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-xs text-white truncate group-hover:text-cyan-300 transition-colors">
                          {service.title}
                        </h4>
                        {service.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold border ${
                              service.badgeColor || 'bg-neutral-800 text-neutral-400'
                            }`}
                          >
                            {service.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                        {service.description}
                      </p>
                    </div>
                  </div>

                  {/* Launch Action Button */}
                  <button
                    onClick={() => handleLaunch(service)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all flex-shrink-0 shadow-md shadow-blue-600/20 group-hover:scale-105 cursor-pointer"
                  >
                    <span>Launch</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-800 bg-neutral-950/60 px-6 py-3 flex items-center justify-between text-xs text-neutral-500">
          <span>
            Showing <strong className="text-white">{filteredServices.length}</strong> services
          </span>
          <span className="font-mono text-[11px] text-cyan-400">
            NK PrintBay Smart Engine
          </span>
        </div>
      </div>
    </div>
  );
}

function renderServiceIcon(name: string) {
  switch (name) {
    case 'CreditCard':
      return <CreditCard className="w-5 h-5 text-cyan-300" />;
    case 'Vote':
    case 'Globe':
      return <Globe className="w-5 h-5 text-blue-300" />;
    case 'Layers':
      return <Layers className="w-5 h-5 text-emerald-300" />;
    case 'ShieldCheck':
      return <ShieldCheck className="w-5 h-5 text-amber-300" />;
    case 'FileText':
      return <FileText className="w-5 h-5 text-blue-300" />;
    case 'Printer':
      return <Printer className="w-5 h-5 text-sky-300" />;
    case 'Sparkles':
      return <Sparkles className="w-5 h-5 text-cyan-300" />;
    case 'Scissors':
      return <Scissors className="w-5 h-5 text-emerald-300" />;
    case 'Camera':
      return <Camera className="w-5 h-5 text-rose-300" />;
    case 'FileCheck2':
      return <FileCheck2 className="w-5 h-5 text-amber-300" />;
    case 'Receipt':
      return <Receipt className="w-5 h-5 text-indigo-300" />;
    case 'DollarSign':
      return <DollarSign className="w-5 h-5 text-amber-300" />;
    case 'QrCode':
      return <QrCode className="w-5 h-5 text-rose-300" />;
    case 'Smartphone':
      return <Smartphone className="w-5 h-5 text-emerald-300" />;
    case 'Lock':
      return <Lock className="w-5 h-5 text-blue-300" />;
    default:
      return <Wrench className="w-5 h-5 text-cyan-300" />;
  }
}
