'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * src/components/Footer.tsx
 * Ultra-Modern Footer matching https://ntechbay-library.web.app/
 */

import React from 'react';
import {
  Globe,
  Linkedin,
  Github,
  Instagram,
  Mail,
  MessageCircle,
  ShieldCheck,
  Heart
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="no-print w-full bg-[#071536] border-t border-blue-900/60 text-slate-300 py-8 px-4 sm:px-8 flex flex-col items-center gap-5 mt-auto">
      {/* Centered Created By Pill with Logo */}
      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-950/90 border border-blue-800 shadow-md">
        <div className="w-5 h-5 rounded-full overflow-hidden bg-cyan-400 p-0.5 flex items-center justify-center">
          <img
            src="https://nitishkhobragade.github.io/portfolio.nitish/img/logo.png"
            alt="NK Logo"
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <span className="font-bold text-[10px] text-blue-950">N</span>
        </div>
        <span className="text-xs font-semibold text-slate-200">
          Created by{' '}
          <a
            href="https://nitishkhobragade.github.io/portfolio.nitish/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-300 hover:text-white underline font-bold transition-colors"
          >
            Er. Nitish Khobragade (NK)
          </a>
        </span>
      </div>

      {/* Services, Tools & Guidance Information (Matching Image 1) */}
      <div className="max-w-4xl text-center space-y-1.5 text-xs text-slate-400 leading-relaxed font-sans">
        <p>
          <span className="font-bold text-slate-200">Services:</span> e-Aadhaar PVC Auto-Crop · PAN 2.0 Color Card · Voter Card HD · 300 DPI Passport Studio · POS Thermal Slips · GST Invoicing
        </p>
        <p>
          <span className="font-bold text-slate-200">Tools:</span> Reduce Image Size In KB (Free) · Images To PDF · Govt Form Resizer · 50mm Calibration Scale · Cash Denomination Counter
        </p>
        <p>
          <span className="font-bold text-slate-200">Jobs & Mentorship:</span> Cyber Cafe Operations, Tech Architecture & Engineering Guidance by{' '}
          <span className="text-cyan-300 font-semibold">Er. Nitish Khobragade (NK)</span>
        </p>
      </div>

      {/* Social Links Row (Matching Image 1) */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center pt-2">
        {/* Portfolio Button */}
        <a
          href="https://nitishkhobragade.github.io/portfolio.nitish/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Portfolio</span>
        </a>

        {/* LinkedIn */}
        <a
          href="https://www.linkedin.com/in/nitish-khobragade-61476b1b4/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full bg-blue-950 hover:bg-blue-900 border border-blue-800 text-blue-300 hover:text-white flex items-center justify-center transition-colors shadow-sm"
          title="LinkedIn Profile"
        >
          <Linkedin className="w-4 h-4" />
        </a>

        {/* GitHub */}
        <a
          href="https://github.com/nitishkhobragade"
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full bg-blue-950 hover:bg-blue-900 border border-blue-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors shadow-sm"
          title="GitHub Profile"
        >
          <Github className="w-4 h-4" />
        </a>

        {/* Instagram */}
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full bg-blue-950 hover:bg-blue-900 border border-blue-800 text-pink-400 hover:text-pink-300 flex items-center justify-center transition-colors shadow-sm"
          title="Instagram"
        >
          <Instagram className="w-4 h-4" />
        </a>

        {/* Email */}
        <a
          href="mailto:djnitish97@gmail.com"
          className="w-8 h-8 rounded-full bg-blue-950 hover:bg-blue-900 border border-blue-800 text-amber-400 hover:text-amber-300 flex items-center justify-center transition-colors shadow-sm"
          title="Email Er. Nitish Khobragade (djnitish97@gmail.com)"
        >
          <Mail className="w-4 h-4" />
        </a>

        {/* WhatsApp Chat */}
        <a
          href="https://wa.me/919900000001?text=Hello%20Er.%20Nitish%20Khobragade%20-%20NK%20PrintBay%20Query"
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 hover:text-emerald-300 flex items-center justify-center transition-colors shadow-sm"
          title="WhatsApp Chat"
        >
          <MessageCircle className="w-4 h-4" />
        </a>
      </div>

      <div className="text-[10px] text-slate-500 pt-1 font-mono">
        © {new Date().getFullYear()} NK PrintBay & NP Job Portal. All rights reserved. 100% Client-Side Private Engine.
      </div>
    </footer>
  );
}
