'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * app/dashboard/page.tsx
 * Central Tool Dashboard & Service Hub for NP Print Portal.
 * Features categorized service grid with badges, quick search,
 * user license status header, and tool launcher.
 */

import React, { useState } from 'react';
import {
  CreditCard,
  Camera,
  Layers,
  FileCheck2,
  Sparkles,
  Search,
  Printer,
  ShieldCheck,
  Zap,
  ArrowRight,
  LogOut,
  Clock,
  Smartphone,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { SessionUser } from '../../src/lib/authStore';

export type PortalToolId =
  | 'card-engine'
  | 'passport-maker'
  | 'govt-resizer'
  | 'multi-card'
  | 'signature-enhancer';

interface ToolItem {
  id: PortalToolId;
  title: string;
  category: 'id-cards' | 'photos' | 'govt-forms' | 'enhancement';
  description: string;
  badge: 'CORE' | 'HOT' | 'NEW' | 'PRO' | 'FREE';
  badgeColor: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
}

const TOOLS_CATALOG: ToolItem[] = [
  {
    id: 'card-engine',
    title: 'Ultra-HD ID Card Processor',
    category: 'id-cards',
    description: 'Auto-detect Aadhaar, PAN, and raw mobile scans, apply 300 DPI deskewing, and mount on 1:1 scale A4 print canvas.',
    badge: 'HOT',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    icon: CreditCard,
    features: ['PDF.js 300 DPI', 'Sobel Corner Detection', 'Homography Warp', 'A4 Print Layout'],
  },
  {
    id: 'passport-maker',
    title: 'Passport & Visa Photo Grid Maker',
    category: 'photos',
    description: 'Generate 6, 8, 12, or 32 passport copies on 4x6" or A4 glossy paper with biometric face guides and Name/DOP strips.',
    badge: 'PRO',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    icon: Camera,
    features: ['4x6" & A4 Presets', 'Biometric Oval Guide', 'Name & Date Strip', 'Scissor Cut Marks'],
  },
  {
    id: 'multi-card',
    title: 'Multi-Card Batch Sheet Processor',
    category: 'id-cards',
    description: 'Place 2 to 5 different ID cards (Front & Back pairs) onto a single A4 page with auto-alignment and folding lines.',
    badge: 'NEW',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: Layers,
    features: ['Up to 5 Cards', '10 Sides on 1 A4', 'Smart Auto-Spacing', 'Lamination Margins'],
  },
  {
    id: 'govt-resizer',
    title: 'Govt Form Photo & Signature Resizer',
    category: 'govt-forms',
    description: 'Compress candidate photo & signature to exact KB windows (20-50 KB, 10-20 KB) for SSC, UPSC, IBPS, and State PSC forms.',
    badge: 'CORE',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    icon: FileCheck2,
    features: ['Exact KB Target', 'Binary Search Engine', 'SSC / UPSC / IBPS Presets', 'Pixel Dimension Lock'],
  },
  {
    id: 'signature-enhancer',
    title: 'Signature & Stamp Enhancer',
    category: 'enhancement',
    description: 'Remove phone shadows, yellowish paper grain, and uneven ink. Output clean transparent PNGs or deep royal blue signatures.',
    badge: 'FREE',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    icon: Sparkles,
    features: ['Shadow Removal', 'Transparent PNG Export', 'Binarization Threshold', 'Blue Fountain Ink'],
  },
];

interface DashboardPageProps {
  currentUser?: SessionUser | null;
  onSelectTool: (toolId: PortalToolId) => void;
  onOpenAdminPortal?: () => void;
  onLogout?: () => void;
}

export default function DashboardPage({
  currentUser,
  onSelectTool,
  onOpenAdminPortal,
  onLogout,
}: DashboardPageProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTools = TOOLS_CATALOG.filter((tool) => {
    const matchesSearch =
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.features.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));

    if (selectedCategory === 'all') return matchesSearch;
    return matchesSearch && tool.category === selectedCategory;
  });

  return (
    <div className="w-full min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      
      {/* ---------------------------------------------------- */}
      {/* HERO SECTION                                         */}
      {/* ---------------------------------------------------- */}
      <section className="border-b border-neutral-800 bg-gradient-to-b from-neutral-900/90 to-neutral-950 px-6 py-10">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
                  Professional Print Portal & Cyber Cafe Suite
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Specialized Document & Print Utilities
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl leading-relaxed">
                Client-side Canvas engines at true 300 DPI print standards. Process ID cards, format passport photos, compress exam files, and clean signatures with zero cloud upload costs.
              </p>
            </div>

            {/* Quick Stats Banner */}
            <div className="flex items-center gap-3 bg-neutral-900/80 border border-neutral-800 p-3 rounded-xl shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Printer className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="text-neutral-400 block text-[10px]">Print Engine</span>
                  <span className="font-mono font-bold text-white">300 DPI Native</span>
                </div>
              </div>
              <div className="h-6 w-px bg-neutral-800" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="text-neutral-400 block text-[10px]">Performance</span>
                  <span className="font-mono font-bold text-white">100% Client-Side</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar & Category Filter Pills */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools, formats, SSC, 4x6, CR80..."
                className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'All Tools' },
                { id: 'id-cards', label: 'ID Cards & Badges' },
                { id: 'photos', label: 'Passport Studio' },
                { id: 'govt-forms', label: 'Govt Exam Resizer' },
                { id: 'enhancement', label: 'Sign & Stamp Cleaner' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-neutral-800 text-cyan-400 border border-neutral-700 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* TOOLS GRID                                           */}
      {/* ---------------------------------------------------- */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                onClick={() => onSelectTool(tool.id)}
                className="group relative bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-2xl hover:shadow-cyan-500/5 cursor-pointer"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-10 h-10 rounded-xl bg-neutral-800/80 border border-neutral-700/80 flex items-center justify-center text-cyan-400 group-hover:scale-105 group-hover:border-cyan-500/40 transition-all">
                      <Icon className="w-5 h-5" />
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${tool.badgeColor}`}
                    >
                      {tool.badge}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-white group-hover:text-cyan-300 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed line-clamp-2">
                    {tool.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-neutral-800/80 flex flex-col gap-3">
                  {/* Feature Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {tool.features.map((feat, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-neutral-950 px-2 py-0.5 rounded text-neutral-400 font-mono border border-neutral-800"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>

                  {/* Launch Link */}
                  <div className="flex items-center justify-between text-xs font-semibold text-cyan-400 group-hover:text-cyan-300 pt-1">
                    <span>Launch Utility</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ---------------------------------------------------- */}
      {/* FOOTER BAR                                           */}
      {/* ---------------------------------------------------- */}
      <footer className="border-t border-neutral-800 bg-neutral-900/40 px-6 py-4 text-xs text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-400">NP Job Portal & Print Hub</span>
          <span>·</span>
          <span>True 300 DPI Computer Vision Canvas Suite</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[11px] text-neutral-400">ISO CR80 & ISO A4 Calibrated</span>
          {onOpenAdminPortal && currentUser?.role === 'admin' && (
            <button
              onClick={onOpenAdminPortal}
              className="text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
            >
              Admin Portal
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
