'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * src/components/tools/ShopUtilitySuite.tsx
 * All-In-One Cyber Cafe & CSC Daily Shop Utilities:
 * 1. Branded Payment Standee UPI QR Code Generator
 * 2. Shop Service Rate Banner & Price List Designer
 * 3. Direct WhatsApp Chat Launcher without saving contact
 * 4. Age & DOB Eligibility Calculator (with exam cutoff dates)
 * 5. Land Area Converter (Katha, Bigha, Satak, Decimal, Dismil, Acre, Sqft)
 */

import React, { useState, useRef } from 'react';
import {
  QrCode,
  FileSpreadsheet,
  Smartphone,
  Calendar,
  Maximize2,
  Printer,
  Download,
  Share2,
  Copy,
  Check,
  Building,
  Sparkles,
  Calculator,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Plus,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatDDMMYYYY } from '../../lib/dateUtils';

export type ShopUtilityTab = 'payment-standee' | 'rate-banner' | 'wa-direct' | 'age-calc' | 'land-calc';

interface ShopUtilitySuiteProps {
  defaultTab?: ShopUtilityTab;
}

export default function ShopUtilitySuite({ defaultTab = 'payment-standee' }: ShopUtilitySuiteProps) {
  const [activeTab, setActiveTab] = useState<ShopUtilityTab>(defaultTab);

  // ---------------------------------------------------------------------------
  // 1. PAYMENT STANDEE STATE
  // ---------------------------------------------------------------------------
  const [shopName, setShopName] = useState<string>('MAA CYBER CAFE & CSC CENTER');
  const [upiId, setUpiId] = useState<string>('9876543210@paytm');
  const [payeeName, setPayeeName] = useState<string>('Ramesh Kumar');
  const [upiAmount, setUpiAmount] = useState<string>('');
  const [standeeTagline, setStandeeTagline] = useState<string>('All Online Forms, Xerox & Color Printing Accepted Here');
  const [selectedTheme, setSelectedTheme] = useState<'blue-paytm' | 'purple-phonepe' | 'teal-gpay' | 'dark-gold'>('blue-paytm');

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName || shopName)}${upiAmount ? `&am=${upiAmount}` : ''}&cu=INR`
  )}`;

  // ---------------------------------------------------------------------------
  // 2. SHOP RATE BANNER STATE
  // ---------------------------------------------------------------------------
  const [bannerShopName, setBannerShopName] = useState<string>('APNA CSC & DIGITAL SEVA KENDRA');
  const [bannerContact, setBannerContact] = useState<string>('Mob: 9876543210 | Near Tehsil / Block Office');
  const [servicesList, setServicesList] = useState<Array<{ name: string; price: string }>>([
    { name: 'Color Aadhaar PVC Card Print (CR80)', price: '₹50' },
    { name: 'PAN Card / Voter ID PVC Print', price: '₹50' },
    { name: 'B&W Photocopy / Xerox (Per Page)', price: '₹3' },
    { name: 'Color Document Printout (A4)', price: '₹10' },
    { name: 'Passport Size Photo (8 Copies)', price: '₹40' },
    { name: 'Online Govt Form Submission', price: '₹60 - ₹100' },
    { name: 'Lamination (ID / A4 Size)', price: '₹20' },
    { name: 'Money Transfer / AEPS Cash Out', price: '1% / Min ₹20' },
  ]);
  const [newServiceName, setNewServiceName] = useState<string>('');
  const [newServicePrice, setNewServicePrice] = useState<string>('');

  const handleAddService = () => {
    if (!newServiceName.trim()) return;
    setServicesList([...servicesList, { name: newServiceName.trim(), price: newServicePrice.trim() || '₹--' }]);
    setNewServiceName('');
    setNewServicePrice('');
  };

  const handleRemoveService = (index: number) => {
    setServicesList(servicesList.filter((_, idx) => idx !== index));
  };

  // ---------------------------------------------------------------------------
  // 3. DIRECT WHATSAPP CHAT LAUNCHER
  // ---------------------------------------------------------------------------
  const [waPhone, setWaPhone] = useState<string>('');
  const [waMessage, setWaMessage] = useState<string>(
    'Namaste! Your printouts/documents are ready. Please collect from counter.'
  );
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const cleanPhone = waPhone.replace(/\D/g, '');
  const formattedWaPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const waUrl = `https://wa.me/${formattedWaPhone}?text=${encodeURIComponent(waMessage)}`;

  const handleOpenWhatsApp = () => {
    if (!cleanPhone) return;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyWaLink = () => {
    navigator.clipboard.writeText(waUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // ---------------------------------------------------------------------------
  // 4. AGE & DOB CALCULATOR STATE
  // ---------------------------------------------------------------------------
  const [dob, setDob] = useState<string>('2000-01-15');
  const [cutoffDate, setCutoffDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const calculateAge = () => {
    if (!dob || !cutoffDate) return null;
    const birth = new Date(dob);
    const target = new Date(cutoffDate);

    if (isNaN(birth.getTime()) || isNaN(target.getTime())) return null;
    if (birth > target) return { error: 'Date of birth cannot be after the cutoff date.' };

    let years = target.getFullYear() - birth.getFullYear();
    let months = target.getMonth() - birth.getMonth();
    let days = target.getDate() - birth.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonthLastDay = new Date(target.getFullYear(), target.getMonth(), 0).getDate();
      days += prevMonthLastDay;
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const totalDays = Math.floor((target.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
    const nextBirthday = new Date(target.getFullYear(), birth.getMonth(), birth.getDate());
    if (nextBirthday < target) {
      nextBirthday.setFullYear(target.getFullYear() + 1);
    }
    const daysToNextBirthday = Math.ceil((nextBirthday.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

    return { years, months, days, totalDays, daysToNextBirthday };
  };

  const ageResult = calculateAge();

  // ---------------------------------------------------------------------------
  // 5. LAND AREA CONVERTER STATE (Katha, Bigha, Satak, Decimal, etc.)
  // ---------------------------------------------------------------------------
  const [landValue, setLandValue] = useState<string>('1');
  const [landUnit, setLandUnit] = useState<string>('bigha_standard');

  // Conversion rates relative to 1 Square Meter
  const UNIT_IN_SQ_METERS: Record<string, number> = {
    sq_meter: 1,
    sq_feet: 0.092903,
    sq_yard: 0.836127,
    acre: 4046.86,
    hectare: 10000,
    decimal: 40.4686, // 1 Decimal / Dismil = 435.6 sq ft = 40.4686 sq m
    satak: 40.4686,   // Same as decimal in Bengal/Bihar/Jharkhand
    bigha_standard: 2529.285, // 1 Standard Bigha = ~27,225 sq ft = 2529.285 sq m
    bigha_bihar_up: 2500, // Common East UP / Bihar Bigha
    katha_bihar: 126.46, // 20 Katha = 1 Bigha (1 Katha ~ 1361.25 sq ft)
    dhur_bihar: 6.323, // 20 Dhur = 1 Katha
    guntha: 101.17, // Maharashtra / Gujarat / Karnataka (1089 sq ft)
  };

  const parsedLandVal = parseFloat(landValue) || 0;
  const inSqMeters = parsedLandVal * (UNIT_IN_SQ_METERS[landUnit] || 1);

  const convertedAreas = {
    sqFeet: (inSqMeters / UNIT_IN_SQ_METERS.sq_feet).toLocaleString('en-IN', { maximumFractionDigits: 2 }),
    sqMeters: inSqMeters.toLocaleString('en-IN', { maximumFractionDigits: 2 }),
    acre: (inSqMeters / UNIT_IN_SQ_METERS.acre).toLocaleString('en-IN', { maximumFractionDigits: 4 }),
    decimal: (inSqMeters / UNIT_IN_SQ_METERS.decimal).toLocaleString('en-IN', { maximumFractionDigits: 2 }),
    satak: (inSqMeters / UNIT_IN_SQ_METERS.satak).toLocaleString('en-IN', { maximumFractionDigits: 2 }),
    bigha: (inSqMeters / UNIT_IN_SQ_METERS.bigha_standard).toLocaleString('en-IN', { maximumFractionDigits: 3 }),
    katha: (inSqMeters / UNIT_IN_SQ_METERS.katha_bihar).toLocaleString('en-IN', { maximumFractionDigits: 2 }),
    guntha: (inSqMeters / UNIT_IN_SQ_METERS.guntha).toLocaleString('en-IN', { maximumFractionDigits: 2 }),
  };

  const printDocument = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col bg-neutral-950 text-neutral-100 overflow-y-auto">
      {/* Top Header & Tab Navigation */}
      <div className="no-print bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-cyan-400" />
            <span>Daily Shop Utilities & Counter Tools</span>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              FREE
            </span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Essential front-counter tools for Cyber Cafes, CSC Pragya Kendras & Online Portals
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
          <button
            onClick={() => setActiveTab('payment-standee')}
            className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'payment-standee'
                ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-750'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Payment Standee UPI QR</span>
          </button>

          <button
            onClick={() => setActiveTab('rate-banner')}
            className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'rate-banner'
                ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-750'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Rate Banner Designer</span>
          </button>

          <button
            onClick={() => setActiveTab('wa-direct')}
            className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'wa-direct'
                ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-750'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Direct WhatsApp</span>
          </button>

          <button
            onClick={() => setActiveTab('age-calc')}
            className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'age-calc'
                ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-750'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Age & DOB Calculator</span>
          </button>

          <button
            onClick={() => setActiveTab('land-calc')}
            className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'land-calc'
                ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-750'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Land Area Converter</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full">
        {/* =================================================================== */}
        {/* TAB 1: PAYMENT STANDEE UPI QR CODE                                  */}
        {/* =================================================================== */}
        {activeTab === 'payment-standee' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Configuration Form */}
            <div className="no-print lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col gap-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <QrCode className="w-4 h-4 text-cyan-400" />
                <span>Shop Counter UPI Standee Details</span>
              </h2>

              <div>
                <label className="text-xs text-neutral-400 block mb-1 font-medium">Shop / Center Name</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1 font-medium">UPI ID (VPA)</label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210@paytm or shop@okhdfcbank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1 font-medium">Payee Name (Optional)</label>
                <input
                  type="text"
                  value={payeeName}
                  onChange={(e) => setPayeeName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1 font-medium">Fixed Amount ₹ (Leave blank for any amount)</label>
                <input
                  type="number"
                  placeholder="Leave empty for customer to enter"
                  value={upiAmount}
                  onChange={(e) => setUpiAmount(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1 font-medium">Bottom Tagline / Subtitle</label>
                <input
                  type="text"
                  value={standeeTagline}
                  onChange={(e) => setStandeeTagline(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1 font-medium">Design Color Style</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => setSelectedTheme('blue-paytm')}
                    className={`p-2 rounded-xl border text-center transition-colors cursor-pointer ${
                      selectedTheme === 'blue-paytm' ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-bold' : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    Paytm Blue
                  </button>
                  <button
                    onClick={() => setSelectedTheme('purple-phonepe')}
                    className={`p-2 rounded-xl border text-center transition-colors cursor-pointer ${
                      selectedTheme === 'purple-phonepe' ? 'bg-purple-600/30 border-purple-500 text-purple-300 font-bold' : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    PhonePe Purple
                  </button>
                  <button
                    onClick={() => setSelectedTheme('teal-gpay')}
                    className={`p-2 rounded-xl border text-center transition-colors cursor-pointer ${
                      selectedTheme === 'teal-gpay' ? 'bg-teal-600/30 border-teal-500 text-teal-300 font-bold' : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    GPay Teal
                  </button>
                  <button
                    onClick={() => setSelectedTheme('dark-gold')}
                    className={`p-2 rounded-xl border text-center transition-colors cursor-pointer ${
                      selectedTheme === 'dark-gold' ? 'bg-amber-600/30 border-amber-500 text-amber-300 font-bold' : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    Gold & Black Luxury
                  </button>
                </div>
              </div>

              <button
                onClick={printDocument}
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer mt-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Standee on A4 / Photo Paper</span>
              </button>
            </div>

            {/* Right Standee Printable Preview (A4 Card Format) */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center">
              <div
                id="standee-print-card"
                className={`w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl border-4 transition-all ${
                  selectedTheme === 'blue-paytm'
                    ? 'bg-gradient-to-b from-blue-700 via-blue-900 to-neutral-950 border-blue-500 text-white'
                    : selectedTheme === 'purple-phonepe'
                    ? 'bg-gradient-to-b from-purple-800 via-purple-950 to-neutral-950 border-purple-500 text-white'
                    : selectedTheme === 'teal-gpay'
                    ? 'bg-gradient-to-b from-teal-700 via-emerald-950 to-neutral-950 border-teal-400 text-white'
                    : 'bg-gradient-to-b from-neutral-900 via-neutral-950 to-black border-amber-400 text-amber-100'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Building className="w-5 h-5 text-amber-300" />
                  <span className="text-[11px] font-mono tracking-widest uppercase text-amber-300 font-bold">
                    OFFICIAL COUNTER QR
                  </span>
                </div>

                <h2 className="text-lg font-black tracking-tight leading-tight uppercase px-2 mb-1">
                  {shopName || 'MY CYBER CAFE'}
                </h2>
                <p className="text-xs opacity-80 mb-5">{standeeTagline}</p>

                {/* QR Code Container */}
                <div className="bg-white p-4 rounded-3xl inline-block shadow-2xl mx-auto border-2 border-neutral-200">
                  <img
                    src={qrImageUrl}
                    alt="UPI QR Code"
                    className="w-48 h-48 object-contain mx-auto"
                    crossOrigin="anonymous"
                  />
                  <div className="mt-2 text-center text-neutral-800 text-[11px] font-mono font-bold tracking-tight">
                    SCAN & PAY WITH ANY UPI APP
                  </div>
                </div>

                {/* Supported Apps Badges */}
                <div className="mt-5 flex items-center justify-center gap-3 text-[11px] font-bold opacity-90">
                  <span className="bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-lg">GPay</span>
                  <span className="bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-lg">PhonePe</span>
                  <span className="bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-lg">Paytm</span>
                  <span className="bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-lg">BHIM</span>
                </div>

                {/* Details Footer */}
                <div className="mt-5 pt-4 border-t border-white/20 text-xs flex flex-col gap-0.5">
                  <span className="font-mono text-cyan-300 font-bold">{upiId}</span>
                  {payeeName && <span className="text-[11px] opacity-75">Payee: {payeeName}</span>}
                  {upiAmount && (
                    <span className="text-sm font-bold text-amber-300 mt-1">Amount: ₹{upiAmount}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: SHOP SERVICE RATE BANNER DESIGNER                            */}
        {/* =================================================================== */}
        {activeTab === 'rate-banner' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Controls */}
            <div className="no-print lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col gap-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                <span>Shop Price Chart & Services</span>
              </h2>

              <div>
                <label className="text-xs text-neutral-400 block mb-1 font-medium">Header / Shop Title</label>
                <input
                  type="text"
                  value={bannerShopName}
                  onChange={(e) => setBannerShopName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1 font-medium">Subheader / Address & Phone</label>
                <input
                  type="text"
                  value={bannerContact}
                  onChange={(e) => setBannerContact(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Add New Service Item */}
              <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 flex flex-col gap-2">
                <span className="text-xs font-semibold text-neutral-300">Add Service Item:</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Service Name (e.g. Caste Certificate)"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Rate (e.g. ₹50)"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    className="w-24 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white text-right"
                  />
                  <button
                    onClick={handleAddService}
                    className="p-2 bg-cyan-500 text-neutral-950 rounded-xl font-bold cursor-pointer hover:bg-cyan-400"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
                {servicesList.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2 bg-neutral-950 rounded-xl border border-neutral-800/80 text-xs"
                  >
                    <span className="truncate text-neutral-200">{item.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-bold text-cyan-300">{item.price}</span>
                      <button
                        onClick={() => handleRemoveService(idx)}
                        className="text-neutral-500 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={printDocument}
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer mt-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Ready-to-Hang A4 Rate Card</span>
              </button>
            </div>

            {/* Right Printable A4 Rate Sheet */}
            <div className="lg:col-span-7 flex flex-col items-center">
              <div
                id="rate-sheet-print"
                className="w-full max-w-lg bg-white text-neutral-900 rounded-3xl p-8 shadow-2xl border-4 border-neutral-800"
              >
                {/* Header */}
                <div className="border-b-4 border-neutral-900 pb-4 text-center">
                  <div className="inline-block bg-neutral-900 text-white font-mono text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-1.5">
                    PUBLIC NOTICE & SERVICES RATE LIST
                  </div>
                  <h1 className="text-xl font-black tracking-tight uppercase leading-tight text-neutral-950">
                    {bannerShopName}
                  </h1>
                  <p className="text-xs text-neutral-600 font-medium mt-1">{bannerContact}</p>
                </div>

                {/* Table of Services */}
                <div className="mt-6 divide-y divide-neutral-200 border-y border-neutral-300">
                  {servicesList.map((svc, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-800 flex items-center gap-2">
                        <span className="text-neutral-400 font-mono text-[10px] w-4">{idx + 1}.</span>
                        <span>{svc.name}</span>
                      </span>
                      <span className="font-mono font-bold text-sm text-neutral-950 shrink-0 bg-neutral-100 px-2.5 py-0.5 rounded border border-neutral-300">
                        {svc.price}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer notes */}
                <div className="mt-6 pt-3 border-t border-neutral-200 flex items-center justify-between text-[10px] text-neutral-500 font-medium">
                  <span>* Government fees & portal taxes extra as applicable</span>
                  <span>Date: {formatDDMMYYYY(new Date())}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: DIRECT WHATSAPP CHAT LAUNCHER                                */}
        {/* =================================================================== */}
        {activeTab === 'wa-direct' && (
          <div className="max-w-2xl mx-auto bg-neutral-900 border border-neutral-800 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Direct WhatsApp Customer Chat Link</h2>
                <p className="text-xs text-neutral-400">
                  Send PDF printouts, receipts, or job updates to customer WhatsApp without saving contact number.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-neutral-400 block mb-1 font-semibold">Customer Mobile Number (10 Digits)</label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 bg-neutral-950 border border-neutral-800 text-neutral-400 rounded-xl text-sm font-mono font-bold">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={waPhone}
                    onChange={(e) => setWaPhone(e.target.value)}
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono tracking-widest text-base"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1 font-semibold">Message Template</label>
                <textarea
                  rows={3}
                  value={waMessage}
                  onChange={(e) => setWaMessage(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
                />

                {/* Quick Message Templates */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <button
                    onClick={() => setWaMessage('Namaste! Aapke prints aur documents ready hain. Kripya counter se le jayein.')}
                    className="text-[11px] px-2.5 py-1 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 rounded-lg cursor-pointer transition-colors"
                  >
                    Doc Ready (Hindi)
                  </button>
                  <button
                    onClick={() => setWaMessage('Hello! Here is your document printout / receipt. Thank you for visiting!')}
                    className="text-[11px] px-2.5 py-1 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 rounded-lg cursor-pointer transition-colors"
                  >
                    Doc Ready (English)
                  </button>
                  <button
                    onClick={() => setWaMessage('Namaste! Kripya apna Aadhaar / Photo / OTP WhatsApp par bhejein form fill karne k liye.')}
                    className="text-[11px] px-2.5 py-1 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 rounded-lg cursor-pointer transition-colors"
                  >
                    Request Documents
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleOpenWhatsApp}
                  disabled={cleanPhone.length < 10}
                  className={`flex-1 py-3 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    cleanPhone.length >= 10
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-lg shadow-emerald-500/20'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Open in WhatsApp Web / App</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleCopyWaLink}
                  disabled={cleanPhone.length < 10}
                  className="px-4 py-3 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 rounded-2xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: AGE & DOB CALCULATOR (FOR GOVT EXAMS)                         */}
        {/* =================================================================== */}
        {activeTab === 'age-calc' && (
          <div className="max-w-2xl mx-auto bg-neutral-900 border border-neutral-800 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/20 text-pink-400 flex items-center justify-center border border-pink-500/30">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Government Exam Age & DOB Calculator</h2>
                <p className="text-xs text-neutral-400">
                  Calculate exact age in Years, Months, and Days as of the recruitment cutoff notification date.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-neutral-400 block mb-1 font-semibold">Date of Birth (DOB)</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1 font-semibold">Exam Cutoff Date</label>
                <input
                  type="date"
                  value={cutoffDate}
                  onChange={(e) => setCutoffDate(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500 font-mono"
                />
              </div>
            </div>

            {/* Result Box */}
            {ageResult && !('error' in ageResult) && (
              <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border border-pink-500/30 rounded-2xl p-6 text-center">
                <span className="text-[11px] font-mono text-pink-300 font-bold uppercase tracking-wider block mb-2">
                  EXACT AGE AS ON {cutoffDate ? formatDDMMYYYY(new Date(cutoffDate)) : ''}
                </span>

                <div className="flex items-center justify-center gap-4 text-neutral-100 my-2">
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-black font-mono text-pink-400">{ageResult.years}</span>
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold">Years</span>
                  </div>
                  <span className="text-2xl text-neutral-600">:</span>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-black font-mono text-pink-400">{ageResult.months}</span>
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold">Months</span>
                  </div>
                  <span className="text-2xl text-neutral-600">:</span>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-black font-mono text-pink-400">{ageResult.days}</span>
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold">Days</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-neutral-800 grid grid-cols-2 text-xs text-neutral-400">
                  <div>Total Days Lived: <strong className="text-white font-mono">{ageResult.totalDays}</strong></div>
                  <div>Next Birthday In: <strong className="text-pink-300 font-mono">{ageResult.daysToNextBirthday} days</strong></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 5: LAND AREA CONVERTER (KATHA / BIGHA / SATAK / DECIMAL)        */}
        {/* =================================================================== */}
        {activeTab === 'land-calc' && (
          <div className="max-w-3xl mx-auto bg-neutral-900 border border-neutral-800 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Maximize2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Land Area Converter (Indian Units)</h2>
                <p className="text-xs text-neutral-400">
                  Instant conversion between Katha, Bigha, Satak, Decimal, Dismil, Guntha, Acre, and Sq. Feet.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-neutral-400 block mb-1 font-semibold">Enter Value</label>
                <input
                  type="number"
                  value={landValue}
                  onChange={(e) => setLandValue(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-base text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1 font-semibold">Input Unit</label>
                <select
                  value={landUnit}
                  onChange={(e) => setLandUnit(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="bigha_standard">Bigha (Standard / 27,225 sq ft)</option>
                  <option value="bigha_bihar_up">Bigha (East UP / Bihar / 20 Katha)</option>
                  <option value="katha_bihar">Katha (Bihar / ~1361 sq ft)</option>
                  <option value="decimal">Decimal / Dismil (435.6 sq ft)</option>
                  <option value="satak">Satak (Bengal / Jharkhand / 435.6 sq ft)</option>
                  <option value="guntha">Guntha (MH / Gujarat / 1089 sq ft)</option>
                  <option value="acre">Acre (43,560 sq ft)</option>
                  <option value="hectare">Hectare (2.47 Acres)</option>
                  <option value="sq_feet">Square Feet (Sq. Ft.)</option>
                  <option value="sq_meter">Square Meters (Sq. M.)</option>
                </select>
              </div>
            </div>

            {/* Conversion Result Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800 text-center">
                <span className="text-[10px] text-neutral-400 uppercase font-bold">Square Feet</span>
                <div className="text-base font-black font-mono text-cyan-400 mt-1">{convertedAreas.sqFeet}</div>
                <span className="text-[10px] text-neutral-500">Sq. Ft.</span>
              </div>

              <div className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800 text-center">
                <span className="text-[10px] text-neutral-400 uppercase font-bold">Decimal / Dismil</span>
                <div className="text-base font-black font-mono text-emerald-400 mt-1">{convertedAreas.decimal}</div>
                <span className="text-[10px] text-neutral-500">Dec.</span>
              </div>

              <div className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800 text-center">
                <span className="text-[10px] text-neutral-400 uppercase font-bold">Katha</span>
                <div className="text-base font-black font-mono text-amber-400 mt-1">{convertedAreas.katha}</div>
                <span className="text-[10px] text-neutral-500">Katha</span>
              </div>

              <div className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800 text-center">
                <span className="text-[10px] text-neutral-400 uppercase font-bold">Bigha</span>
                <div className="text-base font-black font-mono text-purple-400 mt-1">{convertedAreas.bigha}</div>
                <span className="text-[10px] text-neutral-500">Bigha</span>
              </div>

              <div className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800 text-center">
                <span className="text-[10px] text-neutral-400 uppercase font-bold">Satak</span>
                <div className="text-base font-black font-mono text-rose-400 mt-1">{convertedAreas.satak}</div>
                <span className="text-[10px] text-neutral-500">Satak</span>
              </div>

              <div className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800 text-center">
                <span className="text-[10px] text-neutral-400 uppercase font-bold">Acre</span>
                <div className="text-base font-black font-mono text-blue-400 mt-1">{convertedAreas.acre}</div>
                <span className="text-[10px] text-neutral-500">Acre</span>
              </div>

              <div className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800 text-center">
                <span className="text-[10px] text-neutral-400 uppercase font-bold">Guntha</span>
                <div className="text-base font-black font-mono text-teal-400 mt-1">{convertedAreas.guntha}</div>
                <span className="text-[10px] text-neutral-500">Guntha</span>
              </div>

              <div className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800 text-center">
                <span className="text-[10px] text-neutral-400 uppercase font-bold">Sq. Meters</span>
                <div className="text-base font-black font-mono text-neutral-300 mt-1">{convertedAreas.sqMeters}</div>
                <span className="text-[10px] text-neutral-500">Sq. M.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
