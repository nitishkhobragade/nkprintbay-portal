/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import CardProcessor from './components/CardProcessor';
import PassportPhotoMaker from './components/tools/PassportPhotoMaker';
import GovtResizer from './components/tools/GovtResizer';
import MultiCardSheet from './components/tools/MultiCardSheet';
import SignatureEnhancer from './components/tools/SignatureEnhancer';
import InvoiceMaker from './components/tools/InvoiceMaker';
import AiVisionUpscaler from './components/tools/AiVisionUpscaler';
import CashCounter from './components/tools/CashCounter';
import ThermalSlipMaker from './components/tools/ThermalSlipMaker';
import ShopUtilitySuite from './components/tools/ShopUtilitySuite';
import MasterBatchCompressor from './components/tools/MasterBatchCompressor';
import PassportStudio from './components/tools/PassportStudio';
import SmartIdProcessor from './components/tools/SmartIdProcessor';
import DashboardPage, { PortalToolId } from '../app/dashboard/page';
import AdminPage from '../app/admin/page';
import PricingPage from '../app/pricing/page';
import AuthAndAccessGuard from './components/AuthAndAccessGuard';
import { SessionUser } from './lib/authStore';
import {
  ShieldAlert,
  ArrowLeft,
  LayoutGrid,
  CreditCard,
  Camera,
  Layers,
  FileCheck2,
  Sparkles,
  ChevronDown,
  Zap,
  Receipt,
  Coins,
  Printer,
  QrCode,
  FileSpreadsheet,
  Smartphone,
  Calendar,
  Maximize2,
  Archive
} from 'lucide-react';

export type AppView = 'dashboard' | 'pricing' | PortalToolId | 'admin';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);

  // ----------------------------------------------------
  // ADMIN VIEW
  // ----------------------------------------------------
  if (currentView === 'admin') {
    if (currentUser && currentUser.role !== 'admin') {
      return (
        <div className="w-full min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold">Admin Privileges Required</h2>
            <p className="text-xs text-neutral-400">
              Your account (<span className="font-mono text-neutral-200">{currentUser.email}</span>) does not have the{' '}
              <span className="font-mono text-amber-400">admin</span> role required to access the admin portal.
            </p>
            <button
              onClick={() => setCurrentView('dashboard')}
              className="mt-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <AdminPage
        onBackToPortal={() => setCurrentView('dashboard')}
        currentAdminEmail={currentUser?.email || 'admin@npportal.com'}
        currentAdminToken={currentUser?.sessionToken || 'admin-active-session-token'}
      />
    );
  }

  // ----------------------------------------------------
  // PRICING PAGE
  // ----------------------------------------------------
  if (currentView === 'pricing') {
    return (
      <PricingPage
        currentUser={currentUser}
        onBackToPortal={() => setCurrentView('dashboard')}
        onPlanActivated={(updatedUser) => {
          setCurrentUser(updatedUser);
          setTimeout(() => setCurrentView('dashboard'), 1500);
        }}
      />
    );
  }

  // Helper title for breadcrumb
  const toolTitles: Record<PortalToolId, { name: string; icon: React.ComponentType<{ className?: string }> }> = {
    'card-engine': { name: 'Ultra-HD ID Card Processor', icon: CreditCard },
    'passport-maker': { name: 'Passport & Visa Photo Grid Maker', icon: Camera },
    'passport-studio': { name: '1-Click Passport Photo Studio (300 DPI)', icon: Camera },
    'smart-id': { name: 'Dual-Mode Smart ID Processor & Vector Renderer', icon: CreditCard },
    'govt-resizer': { name: 'Govt Form Photo & Signature Resizer', icon: FileCheck2 },
    'multi-card': { name: 'Multi-Card Batch Sheet (Up to 5 Cards)', icon: Layers },
    'signature-enhancer': { name: 'Signature & Stamp Enhancer', icon: Sparkles },
    'invoice-maker': { name: 'Modern Invoice & GST Bill Maker', icon: Receipt },
    'ai-upscaler': { name: 'AI Vision Upscaler 2.0 (Real-ESRGAN)', icon: Sparkles },
    'cash-counter': { name: 'Daily Ledger & Cash Counter', icon: Coins },
    'thermal-slip': { name: 'AEPS Thermal Receipt Slip Maker', icon: Printer },
    'payment-standee': { name: 'Payment Standee UPI QR Code Generator', icon: QrCode },
    'rate-banner': { name: 'Shop Service Rate Banner Designer', icon: FileSpreadsheet },
    'wa-direct': { name: 'Direct WhatsApp Chat Link Launcher', icon: Smartphone },
    'age-calc': { name: 'Age & DOB Eligibility Calculator', icon: Calendar },
    'land-calc': { name: 'Land Area Converter (Katha/Bigha/Satak)', icon: Maximize2 },
    'master-compressor': { name: 'Master Batch Image & PDF Compressor', icon: Archive },
  };

  return (
    <AuthAndAccessGuard
      onOpenAdminPortal={() => setCurrentView('admin')}
      onOpenPricing={() => setCurrentView('pricing')}
      onSessionStateChange={(user) => setCurrentUser(user)}
    >
      <div className="flex-1 flex flex-col w-full h-full">
        {/* Sub-Navigation Bar when inside a specific tool */}
        {currentView !== 'dashboard' && (
          <div className="no-print bg-neutral-900/90 border-b border-neutral-800 px-3 sm:px-6 py-1.5 sm:py-2 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 w-full overflow-hidden">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="px-2.5 py-1 rounded-md bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer font-medium shrink-0"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">All Utilities Hub</span>
                <span className="sm:hidden">Hub</span>
              </button>

              <span className="text-neutral-700 hidden sm:inline">/</span>

              <div className="flex items-center gap-1.5 font-semibold text-white truncate max-w-[150px] sm:max-w-[240px] md:max-w-none">
                {(() => {
                  const ToolMeta = toolTitles[currentView as PortalToolId];
                  if (!ToolMeta) return null;
                  const Icon = ToolMeta.icon;
                  return (
                    <>
                      <Icon className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="truncate">{ToolMeta.name}</span>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Quick Switch Dropdown */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
              <button
                onClick={() => setCurrentView('pricing')}
                className="px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Zap className="w-3 h-3 text-cyan-400" />
                <span>Plans</span>
              </button>

              <span className="text-[11px] text-neutral-500 hidden md:inline">Jump:</span>
              <select
                value={currentView}
                onChange={(e) => setCurrentView(e.target.value as AppView)}
                className="bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-500 font-medium max-w-[130px] sm:max-w-[180px] md:max-w-none truncate"
              >
                <option value="card-engine">ID Card Engine (Aadhaar / PAN)</option>
                <option value="smart-id">Smart ID Processor (Cropper + Vector)</option>
                <option value="passport-studio">Passport Photo Studio (1-Click)</option>
                <option value="ai-upscaler">AI Vision Upscaler 2.0</option>
                <option value="invoice-maker">Modern Invoice & GST Bill</option>
                <option value="passport-maker">Passport Photo Grid Maker</option>
                <option value="multi-card">Multi-Card Batch Sheet</option>
                <option value="govt-resizer">Govt Form Resizer (KB target)</option>
                <option value="cash-counter">Daily Ledger & Cash Counter</option>
                <option value="thermal-slip">AEPS Thermal Slip Maker</option>
                <option value="signature-enhancer">Signature & Stamp Cleaner</option>
                <option value="payment-standee">Payment Standee UPI QR</option>
                <option value="rate-banner">Shop Rate Banner</option>
                <option value="wa-direct">Direct WhatsApp Chat</option>
                <option value="age-calc">Age & DOB Calculator</option>
                <option value="land-calc">Land Area Converter</option>
                <option value="master-compressor">Master Batch Compressor</option>
              </select>
            </div>
          </div>
        )}

        {/* View Content */}
        {currentView === 'dashboard' && (
          <DashboardPage
            currentUser={currentUser}
            onSelectTool={(toolId) => setCurrentView(toolId)}
            onOpenAdminPortal={() => setCurrentView('admin')}
            onOpenPricing={() => setCurrentView('pricing')}
          />
        )}

        {currentView === 'card-engine' && <CardProcessor />}
        {currentView === 'smart-id' && <SmartIdProcessor />}
        {currentView === 'passport-studio' && <PassportStudio />}
        {currentView === 'ai-upscaler' && <AiVisionUpscaler />}
        {currentView === 'invoice-maker' && <InvoiceMaker />}
        {currentView === 'passport-maker' && <PassportPhotoMaker />}
        {currentView === 'multi-card' && <MultiCardSheet />}
        {currentView === 'govt-resizer' && <GovtResizer />}
        {currentView === 'cash-counter' && <CashCounter />}
        {currentView === 'thermal-slip' && <ThermalSlipMaker />}
        {currentView === 'signature-enhancer' && <SignatureEnhancer />}
        {currentView === 'master-compressor' && <MasterBatchCompressor />}
        {(currentView === 'payment-standee' ||
          currentView === 'rate-banner' ||
          currentView === 'wa-direct' ||
          currentView === 'age-calc' ||
          currentView === 'land-calc') && (
          <ShopUtilitySuite defaultTab={currentView} />
        )}
      </div>
    </AuthAndAccessGuard>
  );
}
