'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * app/dashboard/page.tsx
 * High-Converting Homepage & Services Showcase for NK PrintBay.
 * Features:
 * - Compact Header Banner (Services promoted above the fold)
 * - Visual Photo/Illustration Thumbnails for every service (matches Image 4)
 * - Interactive Favorites (Heart Icon) stored in localStorage
 * - Category Tabs & Live Search
 * - 1-Click Launch for all 24+ Cyber Cafe & CSC Counter Tools
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
  Gift
} from 'lucide-react';
import { SessionUser } from '../../src/lib/authStore';
import ServiceThumbnail, { ServiceThumbnailType } from '../../src/components/ServiceThumbnail';
import AllServicesDirectoryModal from '../../src/components/AllServicesDirectoryModal';

export type PortalToolId =
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
  thumbnailType: ServiceThumbnailType;
  toolId: PortalToolId;
  defaultFavorite?: boolean;
}

const ALL_VISUAL_SERVICES: VisualServiceCard[] = [
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
    description: 'Multi-file compressor with custom target KB, individual rename, delete cross, and sequential 1-by-1 downloads without ZIP.',
    category: 'enhancement',
    badge: 'HOT',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    thumbnailType: 'pdf-compress',
    toolId: 'master-compressor',
    defaultFavorite: true,
  },
  {
    id: 'aadhaar-2',
    title: 'Color Aadhar Maker AI Instant 2.0',
    description: 'Convert e-Aadhaar to HD Color PVC Card with 1-Click Auto Crop & 300 DPI CR80 alignment.',
    category: 'id-cards',
    badge: 'HOT',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    thumbnailType: 'aadhaar-2',
    toolId: 'card-engine',
    defaultFavorite: true,
  },
  {
    id: 'epson-tray',
    title: 'Epson L8050 PVC Card Maker & Print',
    description: 'Calibrated dual-card tray layout for Epson L8050 & L805 printer PVC holders.',
    category: 'id-cards',
    badge: 'NEW',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    thumbnailType: 'epson-printer',
    toolId: 'card-engine',
    defaultFavorite: true,
  },
  {
    id: 'ayushman-cropper',
    title: 'Ayushman Card AI Cropper',
    description: 'Auto crop PM-JAY Golden Health card Front & Back to 1:1 CR80 PVC dimensions.',
    category: 'id-cards',
    badge: 'HOT',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    thumbnailType: 'ayushman',
    toolId: 'card-engine',
    defaultFavorite: true,
  },
  {
    id: 'apaar-cropper',
    title: 'APAAR ID Card AI Cropper',
    description: 'One Nation One Student ID auto-extraction and single-click PVC print output.',
    category: 'id-cards',
    badge: 'NEW',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    thumbnailType: 'apaar',
    toolId: 'card-engine',
  },
  {
    id: 'passport-maker',
    title: 'Passport Photo Grid Maker',
    description: 'Print 6, 8, 12, or 32 passport copies on 4x6" or A4 paper with biometric face guides.',
    category: 'photos',
    badge: 'HOT',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    thumbnailType: 'passport-grid',
    toolId: 'passport-maker',
    defaultFavorite: true,
  },
  {
    id: 'ai-upscaler',
    title: 'AI Image Upscaler 2.0 (Real-ESRGAN)',
    description: '4x super-resolution running 100% in browser with smart face illumination for dark photos.',
    category: 'enhancement',
    badge: 'AI',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    thumbnailType: 'ai-upscaler',
    toolId: 'ai-upscaler',
    defaultFavorite: true,
  },
  {
    id: 'govt-resizer',
    title: 'Govt Form Photo & Signature Resizer',
    description: 'Compress candidate photo & signature to exact KB windows (20-50 KB / 10-20 KB) for SSC/UPSC.',
    category: 'govt-forms',
    badge: 'HOT',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    thumbnailType: 'govt-resizer',
    toolId: 'govt-resizer',
    defaultFavorite: true,
  },
  {
    id: 'signature-enhancer',
    title: 'Signature & Thumb Stamp Enhancer',
    description: 'Enhance contrast, clean shadows, and produce dark ink signatures on white paper.',
    category: 'enhancement',
    badge: 'FREE',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    thumbnailType: 'signature-stamp',
    toolId: 'signature-enhancer',
  },
  {
    id: 'multi-card',
    title: 'Multi Card Print Batch Tool (A4)',
    description: 'Place 2 to 5 different cards (Aadhaar, PAN, Voter, Ration) on 1 single A4 sheet with fold lines.',
    category: 'id-cards',
    badge: 'HOT',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    thumbnailType: 'multi-card',
    toolId: 'multi-card',
    defaultFavorite: true,
  },
  {
    id: 'invoice-bill',
    title: 'Modern Invoice & GST Bill Maker',
    description: 'Create professional A4 & 2/3-inch thermal bills with dynamic UPI QR & WhatsApp share.',
    category: 'utilities',
    badge: 'FREE',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    thumbnailType: 'invoice-bill',
    toolId: 'invoice-maker',
    defaultFavorite: true,
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
}

export default function DashboardPage({
  currentUser,
  onSelectTool,
  onOpenAdminPortal,
  onOpenPricing,
}: DashboardPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDirectoryOpen, setIsDirectoryOpen] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<string[]>(['aadhaar-2', 'epson-tray', 'ayushman-cropper', 'passport-maker', 'govt-resizer']);

  // Load favorites from localStorage
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
      // Category filter
      if (selectedCategory === 'favorites') {
        if (!favorites.includes(tool.id)) return false;
      } else if (selectedCategory !== 'all' && tool.category !== selectedCategory) {
        return false;
      }

      // Search filter
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
    <div className="flex-1 flex flex-col bg-neutral-950 text-neutral-100 overflow-y-auto">
      {/* ---------------------------------------------------- */}
      {/* 1. COMPACT PROMO & ANNOUNCEMENT HEADER BANNER        */}
      {/* ---------------------------------------------------- */}
      <div className="no-print bg-neutral-900/90 border-b border-neutral-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs w-full">
        <div className="flex items-center gap-2 flex-wrap text-neutral-300">
          <span className="flex items-center gap-1.5 font-bold text-white">
            <Gift className="w-4 h-4 text-amber-400 shrink-0" />
            <span>New Operator Gift:</span>
          </span>
          <span className="text-cyan-300 font-semibold">
            {currentUser?.freePrintsLeft ?? 4} Free HD Prints Unlocked!
          </span>
          <span className="text-neutral-600 hidden sm:inline">·</span>
          <span className="text-neutral-400 hidden md:inline">
            100% Client-Side Private · Direct CR80 & 1:1 Scale · Epson L8050 Supported
          </span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {onOpenPricing && (
            <button
              onClick={onOpenPricing}
              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Plans (₹29/₹199)
            </button>
          )}

          <button
            onClick={() => setIsDirectoryOpen(true)}
            className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
          >
            <span>All 50+ Services</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. COMPACT SEARCH & CATEGORY BAR                     */}
      {/* ---------------------------------------------------- */}
      <section className="no-print max-w-7xl mx-auto w-full px-4 sm:px-6 pt-5 pb-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tools (Aadhaar, Epson, Invoice, Resizer)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto text-xs pb-1 scrollbar-none">
          {[
            { id: 'all', label: `All Tools (${ALL_VISUAL_SERVICES.length})` },
            { id: 'favorites', label: `★ Favorites (${favorites.length})` },
            { id: 'id-cards', label: 'PAN & Voter / ID' },
            { id: 'photos', label: 'Passport & Photos' },
            { id: 'govt-forms', label: 'Govt Form Resizers' },
            { id: 'enhancement', label: 'AI Enhancement' },
            { id: 'utilities', label: 'Daily Shop Utilities' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors cursor-pointer text-xs ${
                selectedCategory === cat.id
                  ? 'bg-cyan-500 text-neutral-950 font-bold shadow-sm'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 3. VISUAL SERVICES GRID (MATCHES REFERENCE IMAGE 4)  */}
      {/* ---------------------------------------------------- */}
      <main className="no-print max-w-7xl mx-auto w-full px-4 sm:px-6 pb-12 flex-1">
        {filteredTools.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 flex flex-col items-center justify-center gap-2">
            <span className="text-2xl">🔍</span>
            <span className="text-sm font-semibold text-neutral-400">No matching services found</span>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="text-xs text-cyan-400 underline cursor-pointer mt-1"
            >
              Reset filters & search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {filteredTools.map((tool) => {
              const isFav = favorites.includes(tool.id);

              return (
                <div
                  key={tool.id}
                  onClick={() => onSelectTool(tool.toolId)}
                  className="bg-neutral-900/70 hover:bg-neutral-900 border border-neutral-800 hover:border-cyan-500/60 rounded-2xl p-3.5 flex flex-col justify-between transition-all group shadow-md hover:shadow-xl hover:shadow-cyan-500/10 cursor-pointer relative"
                >
                  <div>
                    {/* Top Action Bar: Heart (Favorite) & Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={(e) => toggleFavorite(e, tool.id)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                          isFav
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-neutral-800/60 text-neutral-500 hover:text-rose-400'
                        }`}
                        title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>

                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold border ${tool.badgeColor}`}
                      >
                        {tool.badge}
                      </span>
                    </div>

                    {/* High-Fidelity Visual Photo / Thumbnail */}
                    <ServiceThumbnail type={tool.thumbnailType} className="w-full h-28 sm:h-32 mb-3" />

                    {/* Tool Title */}
                    <h3 className="font-bold text-xs sm:text-sm text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                      {tool.title}
                    </h3>

                    {/* Tool Short Description */}
                    <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>

                  {/* Launch Footer */}
                  <div className="mt-4 pt-2.5 border-t border-neutral-800/80 flex items-center justify-between text-xs text-cyan-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                    <span>Open Service</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Directory Banner Callout */}
        <div className="mt-8 bg-gradient-to-r from-neutral-900 via-neutral-900 to-blue-950/40 border border-neutral-800 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">Looking for other CSC or Govt Portals?</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Access over 50+ one-click tools including Ayushman, e-Shram, ABHA, Daily Ledger, Ration Splitter, and Govt Portals.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsDirectoryOpen(true)}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-md shadow-cyan-500/20"
          >
            <span>Open All 50+ Directory</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </main>

      {/* ---------------------------------------------------- */}
      {/* 4. ALL SERVICES DIRECTORY MODAL                      */}
      {/* ---------------------------------------------------- */}
      <AllServicesDirectoryModal
        isOpen={isDirectoryOpen}
        onClose={() => setIsDirectoryOpen(false)}
        onSelectTool={(toolId) => onSelectTool(toolId)}
        onOpenPricing={onOpenPricing}
      />
    </div>
  );
}
