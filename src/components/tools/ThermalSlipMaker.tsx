'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * src/components/tools/ThermalSlipMaker.tsx
 * AEPS & Cash Withdrawal Thermal Receipt Slip Printer (2-inch & 3-inch thermal receipts).
 */

import React, { useState } from 'react';
import {
  Printer,
  Smartphone,
  Receipt,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Building,
  Lock
} from 'lucide-react';
import { formatDDMMYYYY, formatDDMMYYYYWithTime } from '../../lib/dateUtils';
import { SessionUser } from '../../lib/authStore';

export interface ThermalSlipMakerProps {
  currentUser?: SessionUser | null;
  onRequireAuth?: () => void;
}

export default function ThermalSlipMaker({ currentUser, onRequireAuth }: ThermalSlipMakerProps = {}) {
  const [shopName, setShopName] = useState<string>('TechVeda CSC & Banking Point');
  const [bcAgentName, setBcAgentName] = useState<string>('Rajesh Sharma (CSP ID: 94821)');
  const [bankName, setBankName] = useState<string>('State Bank of India (SBI)');
  const [customerAadhaar, setCustomerAadhaar] = useState<string>('XXXX-XXXX-9923');
  const [customerName, setCustomerName] = useState<string>('Sunil Verma');
  const [rrnNumber, setRrnNumber] = useState<string>(`RRN${Date.now().toString().slice(-10)}`);
  const [amountWithdrawn, setAmountWithdrawn] = useState<number>(2000);
  const [remainingBalance, setRemainingBalance] = useState<number>(5480);
  const [slipWidth, setSlipWidth] = useState<'2-inch' | '3-inch'>('3-inch');

  const handlePrint = () => {
    if (!currentUser) {
      onRequireAuth?.();
      window.dispatchEvent(new CustomEvent('np_trigger_login', {
        detail: { reason: '🔒 Login Required to Print Thermal Slips. Sign in or register to get 4 Free Prints!' }
      }));
      return;
    }
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      
      {/* Left Form */}
      <aside className="no-print w-full lg:w-96 border-r border-neutral-800 bg-neutral-900/60 p-5 flex flex-col gap-4 overflow-y-auto shrink-0 text-xs">
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
          <Receipt className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="font-bold text-sm text-white">AEPS Thermal Slip Maker</h2>
            <span className="text-[10px] text-neutral-400">Cash Withdrawal & Micro-ATM</span>
          </div>
        </div>

        <div>
          <label className="text-[11px] text-neutral-400 block mb-1">Slip Width:</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSlipWidth('2-inch')}
              className={`py-1.5 rounded-lg border text-center font-bold ${
                slipWidth === '2-inch' ? 'bg-neutral-800 border-emerald-500 text-emerald-400' : 'bg-neutral-950 border-neutral-800 text-neutral-400'
              }`}
            >
              2-Inch (58mm POS)
            </button>
            <button
              onClick={() => setSlipWidth('3-inch')}
              className={`py-1.5 rounded-lg border text-center font-bold ${
                slipWidth === '3-inch' ? 'bg-neutral-800 border-emerald-500 text-emerald-400' : 'bg-neutral-950 border-neutral-800 text-neutral-400'
              }`}
            >
              3-Inch (80mm POS)
            </button>
          </div>
        </div>

        <div>
          <label className="text-[11px] text-neutral-400 block mb-0.5">Shop / CSP Name:</label>
          <input
            type="text"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-white"
          />
        </div>

        <div>
          <label className="text-[11px] text-neutral-400 block mb-0.5">Bank Name:</label>
          <input
            type="text"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-white"
          />
        </div>

        <div>
          <label className="text-[11px] text-neutral-400 block mb-0.5">Customer Aadhaar:</label>
          <input
            type="text"
            value={customerAadhaar}
            onChange={(e) => setCustomerAadhaar(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-white font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-neutral-400 block mb-0.5">Withdrawn (₹):</label>
            <input
              type="number"
              value={amountWithdrawn}
              onChange={(e) => setAmountWithdrawn(parseFloat(e.target.value) || 0)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-white font-mono font-bold"
            />
          </div>
          <div>
            <label className="text-[11px] text-neutral-400 block mb-0.5">Balance Left (₹):</label>
            <input
              type="number"
              value={remainingBalance}
              onChange={(e) => setRemainingBalance(parseFloat(e.target.value) || 0)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-white font-mono font-bold"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] text-neutral-400 block mb-0.5">RRN / Transaction ID:</label>
          <input
            type="text"
            value={rrnNumber}
            onChange={(e) => setRrnNumber(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-white font-mono"
          />
        </div>

        <button
          onClick={handlePrint}
          className="mt-2 w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs"
        >
          <Printer className="w-4 h-4" />
          <span>Print Thermal Slip</span>
        </button>
      </aside>

      {/* Right Thermal Preview */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 bg-neutral-950 overflow-auto">
        <div
          className={`bg-white text-neutral-950 p-6 rounded shadow-2xl font-mono text-xs flex flex-col gap-2 transition-all ${
            slipWidth === '2-inch' ? 'w-[240px]' : 'w-[320px]'
          }`}
        >
          <div className="text-center border-b border-dashed border-neutral-400 pb-2">
            <h3 className="font-bold text-sm tracking-tight">{shopName}</h3>
            <span className="text-[10px] text-neutral-600 block">{bcAgentName}</span>
            <span className="text-[10px] font-bold block mt-1">*** AEPS CASH WITHDRAWAL ***</span>
          </div>

          <div className="space-y-1 text-[11px] border-b border-dashed border-neutral-400 pb-2">
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{formatDDMMYYYYWithTime(new Date())}</span>
            </div>
            <div className="flex justify-between">
              <span>Bank:</span>
              <span>{bankName}</span>
            </div>
            <div className="flex justify-between">
              <span>Aadhaar:</span>
              <span>{customerAadhaar}</span>
            </div>
            <div className="flex justify-between">
              <span>RRN:</span>
              <span className="font-bold">{rrnNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="font-bold text-emerald-700">SUCCESS</span>
            </div>
          </div>

          <div className="border-b border-dashed border-neutral-400 pb-2 space-y-1">
            <div className="flex justify-between text-sm font-bold">
              <span>AMOUNT:</span>
              <span>₹{amountWithdrawn.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>LEDGER BAL:</span>
              <span>₹{remainingBalance.toFixed(2)}</span>
            </div>
          </div>

          <div className="text-center pt-2 text-[10px] text-neutral-600">
            <div>Thank You For Visiting!</div>
            <div>Computer Generated Slip</div>
          </div>
        </div>
      </main>
    </div>
  );
}
