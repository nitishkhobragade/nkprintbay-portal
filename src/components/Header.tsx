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
  Sparkles
} from 'lucide-react';
import { SessionUser } from '../lib/authStore';

export interface HeaderProps {
  currentUser: SessionUser | null;
  onOpenSignIn: () => void;
  onOpenRegister: () => void;
  onOpenPricing?: () => void;
  onOpenAdmin?: () => void;
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
  onLogout,
  onToggleMasterHUD,
  isMasterHUDOpen,
}: HeaderProps) {
  const [showNoticeModal, setShowNoticeModal] = useState<boolean>(false);

  return (
    <>
      <header className="no-print w-full bg-[#0a1b42]/90 backdrop-blur-md border-b border-blue-900/60 px-4 sm:px-8 py-3 flex items-center justify-between gap-4 sticky top-0 z-40 shadow-lg shadow-blue-950/40">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-tr from-blue-700 to-cyan-500 p-0.5 shadow-md group-hover:scale-105 transition-transform flex items-center justify-center">
              <img
                src="https://nitishkhobragade.github.io/portfolio.nitish/img/logo.png"
                alt="NK Logo"
                className="w-full h-full object-cover rounded-[10px]"
                onError={(e) => {
                  // Fallback letter if image is blocked
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="font-black text-white text-base leading-none">N</span>
            </div>

            <div className="flex flex-col">
              <span className="font-extrabold text-white text-base sm:text-lg tracking-tight group-hover:text-cyan-300 transition-colors">
                NK PrintBay
              </span>
              <span className="text-[10px] text-cyan-300/80 font-mono -mt-0.5">
                Cyber Cafe & Studio Utility
              </span>
            </div>
          </a>

          <div className="hidden lg:flex items-center gap-1.5 ml-4 px-2.5 py-1 rounded-full bg-blue-900/40 border border-blue-700/50 text-[11px] text-blue-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>True 300 DPI Engine · Epson L8050</span>
          </div>
        </div>

        {/* Right Navigation & Auth Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Security Verified Icon Badge (Matching ntechbay-library) */}
          <button
            title="100% Client-Side Verified · No Server Upload"
            className="w-8 h-8 rounded-full bg-blue-900/40 hover:bg-blue-800/60 border border-blue-700/60 text-cyan-400 flex items-center justify-center transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>

          {/* Notice Button */}
          <button
            onClick={() => setShowNoticeModal(true)}
            className="px-3 py-1.5 rounded-full bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 text-blue-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-cyan-300" />
            <span className="hidden sm:inline">Notice</span>
          </button>

          {/* Pricing Button */}
          {onOpenPricing && (
            <button
              onClick={onOpenPricing}
              className="px-3 py-1.5 rounded-full bg-blue-900/40 hover:bg-blue-800/60 border border-blue-700/60 text-cyan-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Plans (₹29/₹199)</span>
              <span className="md:hidden">Plans</span>
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
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                        isMasterHUDOpen
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                          : 'bg-blue-900/50 text-cyan-300 border-blue-700'
                      }`}
                    >
                      <UserCog className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Master Mode</span>
                    </button>
                  )}

                  {onOpenAdmin && (
                    <button
                      onClick={onOpenAdmin}
                      className="px-3.5 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-extrabold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Admin</span>
                    </button>
                  )}
                </>
              )}

              {/* User Identity Pill */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-blue-950/80 border border-blue-800 rounded-full text-xs text-white">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-semibold max-w-[120px] truncate">{currentUser.name}</span>
                <span className="text-[10px] text-cyan-300 font-mono">({currentUser.daysRemaining}D)</span>
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </>
          ) : (
            /* Guest State (Matching ntechbay-library) */
            <>
              {/* Sign In Pill Button (White button with blue text) */}
              <button
                onClick={onOpenSignIn}
                className="px-4 py-1.5 rounded-full bg-white hover:bg-slate-100 text-[#0c2461] font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition-all cursor-pointer hover:shadow-cyan-500/20"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-600" />
                <span>Sign In</span>
              </button>

              {/* Register Pill Button (Blue pill button) */}
              <button
                onClick={onOpenRegister}
                className="px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
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
