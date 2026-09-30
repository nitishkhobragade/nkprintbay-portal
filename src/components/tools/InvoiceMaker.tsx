'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * src/components/tools/InvoiceMaker.tsx
 * Modern Invoice & GST Bill Maker with Live A4 Preview, WhatsApp Share,
 * Dynamic UPI QR Scan & Pay, and Thermal/A4 Print support.
 */

import React, { useState, useRef } from 'react';
import {
  FileText,
  Printer,
  Download,
  Share2,
  Plus,
  Trash2,
  QrCode,
  CheckCircle2,
  Smartphone,
  Sparkles,
  Palette,
  Building,
  User,
  CreditCard,
  Save,
  MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatDDMMYYYY } from '../../lib/dateUtils';

interface InvoiceItem {
  id: string;
  description: string;
  qty: number;
  rate: number;
  amount: number;
}

export default function InvoiceMaker() {
  // 1. Color & Typography
  const [accentColor, setAccentColor] = useState<string>('#4f46e5'); // Indigo default
  const [fontStyle, setFontStyle] = useState<'modern' | 'bold' | 'serif' | 'royal' | 'cyber' | 'pos'>('modern');

  // 2. Business Details
  const [businessName, setBusinessName] = useState<string>('TechVeda Solutions & CSC Center');
  const [businessAddress, setBusinessAddress] = useState<string>('Main Market Road, Near SBI Bank, Jaipur, Rajasthan 302001');
  const [businessPhone, setBusinessPhone] = useState<string>('+91 98765 43210');
  const [businessGstin, setBusinessGstin] = useState<string>('08AABCU9603R1ZM');
  const [businessUpi, setBusinessUpi] = useState<string>('techveda@sbi');

  // 3. Customer Details
  const [invoiceNumber, setInvoiceNumber] = useState<string>('INV-2026-001');
  const [invoiceDate, setInvoiceDate] = useState<string>(formatDDMMYYYY(new Date()));
  const [customerName, setCustomerName] = useState<string>('Rajesh Kumar Sharma');
  const [customerPhone, setCustomerPhone] = useState<string>('+91 91234 56789');
  const [invoiceStatus, setInvoiceStatus] = useState<'PAID' | 'DUE'>('PAID');

  // 4. Line Items
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: 'item-1',
      description: 'CSC Online Service & Certificate Apply',
      qty: 1,
      rate: 250,
      amount: 250,
    },
    {
      id: 'item-2',
      description: 'PVC Smart Card Printing (Dual Sided 300 DPI)',
      qty: 2,
      rate: 70,
      amount: 140,
    },
  ]);

  const [discount, setDiscount] = useState<number>(0);
  const printAreaRef = useRef<HTMLDivElement | null>(null);

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const total = Math.max(0, subtotal - discount);

  // Line item manipulation
  const handleItemChange = (id: string, field: 'description' | 'qty' | 'rate', value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'qty' || field === 'rate') {
            const q = field === 'qty' ? Number(value) : item.qty;
            const r = field === 'rate' ? Number(value) : item.rate;
            updated.amount = q * r;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      description: 'A4 Color Printout / Photocopy',
      qty: 1,
      rate: 10,
      amount: 10,
    };
    setItems([...items, newItem]);
  };

  const handleDeleteItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  // Actions
  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const message = `*INVOICE: ${invoiceNumber}*\nFrom: ${businessName}\nDate: ${invoiceDate}\nTotal Amount: ₹${total}\nStatus: ${invoiceStatus}\nThank you for visiting!`;
    const cleanPhone = customerPhone.replace(/\D/g, '');
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const handleSave = () => {
    confetti({ particleCount: 40, spread: 70, origin: { y: 0.7 } });
    alert(`Invoice ${invoiceNumber} saved successfully to shop ledger!`);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      
      {/* ---------------------------------------------------- */}
      {/* LEFT: SETTINGS & CONTROLS                            */}
      {/* ---------------------------------------------------- */}
      <aside className="no-print w-full lg:w-[480px] border-r border-neutral-800 bg-neutral-900/60 p-5 flex flex-col gap-5 overflow-y-auto shrink-0">
        
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Modern Invoice & GST Bill</h2>
              <span className="text-[10px] text-neutral-400">Cyber Cafe & CSC Billing</span>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-indigo-500/20 text-indigo-300">
            A4 & THERMAL
          </span>
        </div>

        {/* 1. Color & Typography */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-indigo-400" />
            <span>1. Color & Typography</span>
          </span>

          <div className="flex items-center gap-2">
            {[
              { label: 'Indigo', color: '#4f46e5' },
              { label: 'Blue', color: '#2563eb' },
              { label: 'Emerald', color: '#059669' },
              { label: 'Amber', color: '#d97706' },
              { label: 'Crimson', color: '#e11d48' },
              { label: 'Slate', color: '#0f172a' },
            ].map((c) => (
              <button
                key={c.color}
                onClick={() => setAccentColor(c.color)}
                style={{ backgroundColor: c.color }}
                className={`w-7 h-7 rounded-lg border-2 transition-transform cursor-pointer ${
                  accentColor === c.color ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                }`}
                title={c.label}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
            {[
              { id: 'modern', label: 'Modern Clean', sub: 'Outfit + Inter' },
              { id: 'bold', label: 'Bold Impact', sub: 'Poppins + Montserrat' },
              { id: 'serif', label: 'Classic Serif', sub: 'Playfair + Inter' },
              { id: 'cyber', label: 'Cyber Tech', sub: 'Space Grotesk' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFontStyle(f.id as any)}
                className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                  fontStyle === f.id
                    ? 'bg-neutral-800 border-indigo-500 text-indigo-300 font-bold'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div>{f.label}</div>
                <div className="text-[9px] text-neutral-500 font-normal">{f.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Business Details */}
        <div className="flex flex-col gap-2.5 pt-2 border-t border-neutral-800">
          <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-cyan-400" />
            <span>2. Your Business Details</span>
          </span>

          <div className="space-y-2 text-xs">
            <div>
              <label className="text-[11px] text-neutral-400 block mb-0.5">Shop / Business Name:</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-neutral-400 block mb-0.5">Address & City:</label>
              <input
                type="text"
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-0.5">Mobile Number:</label>
                <input
                  type="text"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-0.5">GSTIN / Tax ID:</label>
                <input
                  type="text"
                  value={businessGstin}
                  onChange={(e) => setBusinessGstin(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-neutral-400 block mb-0.5">UPI ID for Dynamic QR:</label>
              <input
                type="text"
                value={businessUpi}
                onChange={(e) => setBusinessUpi(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* 3. Billed To Customer */}
        <div className="flex flex-col gap-2.5 pt-2 border-t border-neutral-800">
          <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span>3. Customer / Billed To</span>
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[11px] text-neutral-400 block mb-0.5">Customer Name:</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-neutral-400 block mb-0.5">Phone Number:</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[11px] text-neutral-400 block mb-0.5">Invoice #:</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-neutral-400 block mb-0.5">Status:</label>
              <select
                value={invoiceStatus}
                onChange={(e) => setInvoiceStatus(e.target.value as any)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-white font-semibold focus:outline-none focus:border-indigo-500"
              >
                <option value="PAID">PAID (Complete)</option>
                <option value="DUE">DUE / UNPAID</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. Item List Editor */}
        <div className="flex flex-col gap-2.5 pt-2 border-t border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              4. Services / Items
            </span>
            <button
              onClick={handleAddItem}
              className="px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={item.id} className="bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-800 text-xs flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-neutral-500">#{idx + 1}</span>
                  {items.length > 1 && (
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-neutral-500 hover:text-rose-400 p-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Item / Service description"
                  value={item.description}
                  onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white focus:outline-none focus:border-indigo-500 text-xs"
                />

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="text-[9px] text-neutral-400 block">Qty:</label>
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => handleItemChange(item.id, 'qty', parseInt(e.target.value) || 1)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-neutral-400 block">Rate (₹):</label>
                    <input
                      type="number"
                      min="0"
                      value={item.rate}
                      onChange={(e) => handleItemChange(item.id, 'rate', parseFloat(e.target.value) || 0)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-neutral-400 block">Amount:</label>
                    <div className="py-1 px-2 font-mono font-bold text-white text-xs">
                      ₹{item.amount}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-neutral-400">Discount (₹):</span>
            <input
              type="number"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="w-24 bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono text-xs text-right"
            />
          </div>
        </div>
      </aside>

      {/* ---------------------------------------------------- */}
      {/* RIGHT: LIVE A4 PREVIEW & TOP ACTIONS BAR             */}
      {/* ---------------------------------------------------- */}
      <main className="flex-1 flex flex-col bg-neutral-950 overflow-hidden">
        
        {/* Top Actions Bar */}
        <div className="no-print h-14 border-b border-neutral-800 bg-neutral-900/90 px-6 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">Live A4 Invoice Preview</span>
            <span className="text-neutral-500 font-mono hidden sm:inline">· 210 × 297 mm</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
            >
              <Save className="w-3.5 h-3.5 text-cyan-400" />
              <span>Save</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-emerald-600/20"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-indigo-600/20"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4 / Thermal</span>
            </button>
          </div>
        </div>

        {/* Scrollable Viewport */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center bg-neutral-950">
          
          {/* Printable A4 Canvas Container */}
          <div
            ref={printAreaRef}
            className="w-full max-w-[760px] bg-white text-neutral-900 rounded-2xl shadow-2xl p-8 sm:p-12 flex flex-col justify-between min-h-[920px] transition-all"
            style={{
              fontFamily:
                fontStyle === 'bold'
                  ? 'Poppins, sans-serif'
                  : fontStyle === 'serif'
                  ? 'Playfair Display, serif'
                  : fontStyle === 'cyber'
                  ? 'Space Grotesk, sans-serif'
                  : 'Outfit, Plus Jakarta Sans, sans-serif',
            }}
          >
            {/* Invoice Header */}
            <div>
              <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pb-6 border-b-2" style={{ borderColor: accentColor }}>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: accentColor }}>
                    {businessName}
                  </h1>
                  <p className="text-xs text-neutral-600 mt-1 max-w-sm leading-relaxed">
                    {businessAddress}
                  </p>
                  <p className="text-xs text-neutral-700 mt-0.5 font-medium">
                    Phone: <span className="font-mono">{businessPhone}</span>
                  </p>
                  {businessGstin && (
                    <p className="text-xs text-neutral-700 font-medium">
                      GSTIN: <span className="font-mono font-semibold">{businessGstin}</span>
                    </p>
                  )}
                </div>

                <div className="sm:text-right">
                  <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-wider" style={{ color: accentColor }}>
                    INVOICE
                  </h2>
                  <div className="mt-2 text-xs text-neutral-600 space-y-0.5">
                    <div>Invoice No: <strong className="font-mono text-neutral-900">{invoiceNumber}</strong></div>
                    <div>Date: <strong className="font-mono text-neutral-900">{invoiceDate}</strong></div>
                  </div>
                </div>
              </div>

              {/* Customer Box */}
              <div className="my-6 p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">
                    BILLED TO:
                  </span>
                  <div className="font-bold text-sm text-neutral-900 mt-0.5">{customerName}</div>
                  <div className="text-xs text-neutral-600 font-mono">{customerPhone}</div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">
                    STATUS:
                  </span>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase mt-0.5 ${
                      invoiceStatus === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {invoiceStatus}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-white text-[11px] font-bold uppercase tracking-wider" style={{ backgroundColor: accentColor }}>
                    <th className="py-2.5 px-4 rounded-l-lg">ITEM DETAILS</th>
                    <th className="py-2.5 px-4 text-center">QTY</th>
                    <th className="py-2.5 px-4 text-right">RATE (₹)</th>
                    <th className="py-2.5 px-4 text-right rounded-r-lg">AMOUNT (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50/50">
                      <td className="py-3 px-4 font-semibold text-neutral-800">
                        {item.description}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-neutral-700">
                        {item.qty}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-neutral-700">
                        ₹{item.rate.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-neutral-900">
                        ₹{item.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Invoice Bottom: Totals & Scan & Pay QR */}
            <div className="pt-8 border-t-2 border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-6">
              
              {/* Scan & Pay UPI Box */}
              <div className="flex items-center gap-4 p-3.5 rounded-xl border border-neutral-200 bg-neutral-50 max-w-sm w-full">
                <div className="w-16 h-16 bg-white p-1 rounded-lg border border-neutral-300 flex items-center justify-center shrink-0 shadow-sm">
                  {/* Generated QR representation */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                      `upi://pay?pa=${businessUpi}&pn=${encodeURIComponent(businessName)}&am=${total}&cu=INR`
                    )}`}
                    alt="UPI QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="font-bold text-xs text-neutral-900 block">
                    SCAN & PAY (UPI)
                  </span>
                  <span className="font-mono text-[11px] text-neutral-600 block">
                    {businessUpi}
                  </span>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">
                    GPay, PhonePe, Paytm, or BHIM
                  </span>
                </div>
              </div>

              {/* Totals Summary */}
              <div className="w-full sm:w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-medium text-neutral-900">₹{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-medium">
                    <span>Discount:</span>
                    <span className="font-mono">- ₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-neutral-200 flex justify-between text-base font-black" style={{ color: accentColor }}>
                  <span>Total:</span>
                  <span className="font-mono">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
