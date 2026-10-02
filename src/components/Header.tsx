'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * src/components/Header.tsx
 * Ultra-Modern Navigation Header matching https://ntechbay-library.web.app/
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Mail,
  LogIn,
  UserPlus,
  LogOut,
  Zap,
  UserCheck,
  UserCog,
  Bell,
  X,
  Sparkles,
  Headphones
} from 'lucide-react';
import { SessionUser } from '../lib/authStore';

export interface HeaderProps {
  currentUser: SessionUser | null;
  onOpenSignIn: () => void;
  onOpenRegister: () => void;
  onOpenPricing?: () => void;
  onOpenAdmin?: () => void;
  onOpenSupport?: () => void;
  onLogout: () => void;
  onToggleMasterHUD?: () => void;
  isMasterHUDOpen?: boolean;
}

export default function Header({
  currentUser,
  onOpenSignIn,
  onOpenRegister,
  onOpenPricing,
  onOpenAdmin,
  onOpenSupport,
  onLogout,
  onToggleMasterHUD,
  isMasterHUDOpen,
}: HeaderProps) {
  const [showNoticeModal, setShowNoticeModal] = useState<boolean>(false);

  return (
    <>
      <header className="no-print w-full bg-[#0a1b42]/95 backdrop-blur-md border-b border-blue-900/60 px-2 sm:px-4 py-1 sm:py-1.5 flex items-center justify-between gap-1.5 sm:gap-3 sticky top-0 z-40 shadow-md">
        {/* Left Branding: Single Red-Black 'N' Logo */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <a
            href="/"
            className="flex items-center gap-1.5 sm:gap-2 group cursor-pointer min-w-0"
          >
            {/* ONLY Red-Black N Logo, No White N */}
            <div className="w-6 h-6 sm:w-7.5 sm:h-7.5 rounded-lg overflow-hidden bg-slate-900 border border-blue-700/60 shadow-md group-hover:scale-105 transition-transform flex items-center justify-center shrink-0 p-0.5">
              <img
                src="https://nitishkhobragade.github.io/portfolio.nitish/img/logo.png"
                alt="NK Logo"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex flex-col min-w-0 justify-center">
              <span className="font-black text-white text-xs sm:text-sm tracking-tight group-hover:text-cyan-300 transition-colors leading-none truncate">
                NK PrintBay
              </span>
              <span className="hidden sm:block text-[8px] sm:text-[9px] text-cyan-300/80 font-mono leading-none mt-0.5 truncate">
                Cyber Cafe & Studio Utility
              </span>
            </div>
          </a>

          <div className="hidden xl:flex items-center gap-1 ml-1.5 px-2 py-0.5 rounded-full bg-blue-900/40 border border-blue-700/50 text-[9px] text-blue-200 leading-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>True 300 DPI · Epson L8050</span>
          </div>
        </div>

        {/* Right Navigation & Auth Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Security Verified Icon Badge (Desktop only) */}
          <button
            title="100% Client-Side Verified · No Server Upload"
            className="hidden lg:flex w-6.5 h-6.5 rounded-full bg-blue-900/40 hover:bg-blue-800/60 border border-blue-700/60 text-cyan-400 items-center justify-center transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
          </button>

          {/* Help & Support Button */}
          <button
            onClick={() => {
              if (onOpenSupport) {
                onOpenSupport();
              } else {
                window.dispatchEvent(new Event('np_trigger_support'));
              }
            }}
            className="px-2 sm:px-2.5 py-1 rounded-full bg-blue-900/40 hover:bg-blue-800/60 border border-blue-700/60 text-cyan-300 text-[10px] sm:text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            title="Help & Support Desk (djnitish97@gmail.com)"
          >
            <Headphones className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="hidden xs:inline sm:inline">Support</span>
          </button>

          {/* Notice Button (hidden on mobile) */}
          <button
            onClick={() => setShowNoticeModal(true)}
            className="hidden sm:flex px-2 sm:px-2.5 py-1 rounded-full bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 text-blue-200 text-xs font-semibold items-center gap-1 transition-colors cursor-pointer shrink-0"
          >
            <Mail className="w-3 h-3 text-cyan-300" />
            <span>Notice</span>
          </button>

          {/* Pricing Button (hidden on mobile) */}
          {onOpenPricing && (
            <button
              onClick={onOpenPricing}
              className="hidden md:flex px-2.5 py-1 rounded-full bg-blue-900/40 hover:bg-blue-800/60 border border-blue-700/60 text-cyan-300 text-xs font-semibold items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Plans</span>
            </button>
          )}

          {/* Authenticated State */}
          {currentUser ? (
            <>
              {currentUser.role === 'admin' && (
                <>
                  {onToggleMasterHUD && (
                    <button
                      onClick={onToggleMasterHUD}
                      className={`hidden sm:flex px-2 py-0.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer items-center gap-1 shrink-0 ${
                        isMasterHUDOpen
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                          : 'bg-blue-900/50 text-cyan-300 border-blue-700'
                      }`}
                    >
                      <UserCog className="w-3 h-3" />
                      <span>HUD</span>
                    </button>
                  )}

                  {onOpenAdmin && (
                    <button
                      onClick={onOpenAdmin}
                      className="px-2 py-0.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-[11px] font-extrabold flex items-center gap-1 shadow-sm transition-colors cursor-pointer shrink-0"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>Admin</span>
                    </button>
                  )}
                </>
              )}

              {/* User Identity Pill */}
              <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-blue-950/80 border border-blue-800 rounded-full text-[11px] text-white shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="font-semibold max-w-[80px] truncate">{currentUser.name}</span>
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="px-2 sm:px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] sm:text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </>
          ) : (
            /* Guest State */
            <>
              {/* Sign In Pill Button */}
              <button
                onClick={onOpenSignIn}
                className="px-2 sm:px-3 py-1 rounded-full bg-white hover:bg-slate-100 text-[#0c2461] font-bold text-[11px] sm:text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer shrink-0 whitespace-nowrap"
              >
                <LogIn className="w-3 h-3 text-blue-600" />
                <span>Sign In</span>
              </button>

              {/* Register Pill Button */}
              <button
                onClick={onOpenRegister}
                className="px-2 sm:px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] sm:text-xs flex items-center gap-1 shadow-sm shadow-blue-600/30 transition-all cursor-pointer shrink-0 whitespace-nowrap"
              >
                <UserPlus className="w-3 h-3" />
                <span>Register</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Notice Board Modal */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1f4d] border border-blue-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-slate-200 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-blue-900 pb-3">
              <span className="text-base font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-400" />
                <span>Operator Notice & Release Updates</span>
              </span>
              <button onClick={() => setShowNoticeModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-sans text-slate-300">
              <div className="p-3 bg-blue-950/80 rounded-2xl border border-blue-800/80">
                <span className="font-bold text-cyan-300 block mb-1">⚡ Free Tools Without Login:</span>
                <p>
                  You can now freely use the <b>Image Size Reducer in KB</b> and <b>PDF Converter Tools</b> without any login requirement!
                </p>
              </div>

              <div className="p-3 bg-blue-950/80 rounded-2xl border border-blue-800/80">
                <span className="font-bold text-emerald-400 block mb-1">🎁 4 Free HD Prints on Sign Up:</span>
                <p>
                  New operators get 4 full-resolution HD prints (Aadhaar PVC, 300 DPI Passport grids, and PAN cards) completely free on sign-up!
                </p>
              </div>

              <div className="p-3 bg-blue-950/80 rounded-2xl border border-blue-800/80">
                <span className="font-bold text-amber-300 block mb-1">👑 Super Admin Access:</span>
                <p>
                  Super Admin credentials: <span className="font-mono text-white">djnitish97@gmail.com</span> / <span className="font-mono text-white">admin@nk</span>.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowNoticeModal(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs"
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
