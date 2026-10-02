'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * src/components/Footer.tsx
 * Ultra-Modern Footer matching https://ntechbay-library.web.app/
 * - Only Red/Black N Logo (no white N)
 * - Only LinkedIn icon link
 * - Direct Email Support (djnitish97@gmail.com)
 * - Interactive Help & Support Desk Form
 */

import React, { useState } from 'react';
import {
  Linkedin,
  Mail,
  Headphones,
  ShieldCheck,
  Zap
} from 'lucide-react';
import HelpAndSupportModal from './HelpAndSupportModal';

export default function Footer() {
  const [showSupportModal, setShowSupportModal] = useState<boolean>(false);

  return (
    <>
      <footer className="no-print w-full bg-[#071536] border-t border-blue-900/60 text-slate-300 py-8 px-4 sm:px-8 flex flex-col items-center gap-5 mt-auto">
        {/* Centered Brand Pill with ONLY Red/Black Logo */}
        <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-950/90 border border-blue-800 shadow-md">
          <div className="w-6 h-6 rounded-lg overflow-hidden bg-slate-900 border border-blue-800 p-0.5 flex items-center justify-center shrink-0">
            <img
              src="https://nitishkhobragade.github.io/portfolio.nitish/img/logo.png"
              alt="NK Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-xs font-semibold text-slate-200">
            NK PrintBay Operating System · Cyber Cafe & Studio Platform
          </span>
        </div>

        {/* Services, Tools & Platform Information */}
        <div className="max-w-4xl text-center space-y-1.5 text-xs text-slate-400 leading-relaxed font-sans">
          <p>
            <span className="font-bold text-slate-200">Services:</span> e-Aadhaar PVC Auto-Crop · PAN 2.0 Color Card · Voter Card HD · 300 DPI Passport Studio · POS Thermal Slips · GST Invoicing
          </p>
          <p>
            <span className="font-bold text-slate-200">Free Tools:</span> Reduce Image Size In KB · Images To PDF · Govt Form Resizer · 50mm Calibration Scale · Cash Denomination Counter
          </p>
          <p>
            <span className="font-bold text-slate-200">Architecture:</span> Engineered for Cyber Cafes, CSC Centers, Photo Studios & Online Operators across India.
          </p>
        </div>

        {/* Action & Support Links Row (Only LinkedIn, Email Support & Help/Support Form) */}
        <div className="flex items-center gap-3 flex-wrap justify-center pt-1">
          {/* Help & Support Form Button */}
          <button
            onClick={() => setShowSupportModal(true)}
            className="px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer hover:scale-105"
          >
            <Headphones className="w-3.5 h-3.5 text-cyan-300" />
            <span>Help & Support Form (सहायता फॉर्म)</span>
          </button>

          {/* LinkedIn Icon Link */}
          <a
            href="https://www.linkedin.com/in/nitish-khobragade-61476b1b4/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-blue-950 hover:bg-blue-900 border border-blue-800 text-blue-300 hover:text-white flex items-center justify-center transition-all shadow-sm hover:scale-105"
            title="LinkedIn Official"
          >
            <Linkedin className="w-4 h-4" />
          </a>

          {/* Email Support Only */}
          <a
            href="mailto:djnitish97@gmail.com?subject=NK%20PrintBay%20Support%20Query"
            className="w-9 h-9 rounded-full bg-blue-950 hover:bg-blue-900 border border-blue-800 text-amber-400 hover:text-amber-300 flex items-center justify-center transition-all shadow-sm hover:scale-105"
            title="Email Support (djnitish97@gmail.com)"
          >
            <Mail className="w-4 h-4" />
          </a>

          {/* Email Text Pill */}
          <a
            href="mailto:djnitish97@gmail.com?subject=NK%20PrintBay%20Support%20Query"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-950/80 hover:bg-blue-900/80 border border-blue-800/80 text-[11px] font-mono text-slate-300 hover:text-white transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>djnitish97@gmail.com</span>
          </a>
        </div>

        <div className="text-[10px] text-slate-500 pt-1 font-mono">
          © {new Date().getFullYear()} NK PrintBay & NP Job Portal. All rights reserved. 100% Client-Side Private Engine.
        </div>
      </footer>

      {/* Interactive Help & Support Desk Modal */}
      <HelpAndSupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />
    </>
  );
}
