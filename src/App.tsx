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
  Zap
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
              className="mt-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
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
    'govt-resizer': { name: 'Govt Form Photo & Signature Resizer', icon: FileCheck2 },
    'multi-card': { name: 'Multi-Card Batch Sheet (Up to 5 Cards)', icon: Layers },
    'signature-enhancer': { name: 'Signature & Stamp Enhancer', icon: Sparkles },
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
          <div className="no-print bg-neutral-900/90 border-b border-neutral-800 px-6 py-2 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="px-2.5 py-1 rounded-md bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
                <span>All Utilities Hub</span>
              </button>

              <span className="text-neutral-700">/</span>

              <div className="flex items-center gap-1.5 font-semibold text-white">
                {(() => {
                  const ToolMeta = toolTitles[currentView as PortalToolId];
                  if (!ToolMeta) return null;
                  const Icon = ToolMeta.icon;
                  return (
                    <>
                      <Icon className="w-4 h-4 text-cyan-400" />
                      <span>{ToolMeta.name}</span>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Quick Switch Dropdown */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView('pricing')}
                className="px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors mr-2 cursor-pointer"
              >
                <Zap className="w-3 h-3 text-cyan-400" />
                <span>Plans</span>
              </button>

              <span className="text-[11px] text-neutral-500 hidden sm:inline">Jump to tool:</span>
              <select
                value={currentView}
                onChange={(e) => setCurrentView(e.target.value as AppView)}
                className="bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-500 font-medium"
              >
                <option value="card-engine">ID Card Engine (Aadhaar / PAN)</option>
                <option value="passport-maker">Passport Photo Grid Maker</option>
                <option value="multi-card">Multi-Card Batch Sheet</option>
                <option value="govt-resizer">Govt Form Resizer (KB target)</option>
                <option value="signature-enhancer">Signature & Stamp Cleaner</option>
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
          />
        )}

        {currentView === 'card-engine' && <CardProcessor />}
        {currentView === 'passport-maker' && <PassportPhotoMaker />}
        {currentView === 'multi-card' && <MultiCardSheet />}
        {currentView === 'govt-resizer' && <GovtResizer />}
        {currentView === 'signature-enhancer' && <SignatureEnhancer />}
      </div>
    </AuthAndAccessGuard>
  );
}
