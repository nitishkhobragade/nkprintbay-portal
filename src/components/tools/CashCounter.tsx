'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * src/components/tools/CashCounter.tsx
 * Daily Ledger & Cash Counter Denominations Calculator.
 * Auto-sums currency notes with live words display, print receipt, and copy summary.
 */

import React, { useState } from 'react';
import {
  DollarSign,
  Printer,
  Copy,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
  Coins
} from 'lucide-react';
import { formatDDMMYYYY, formatDDMMYYYYWithTime } from '../../lib/dateUtils';

const DENOMINATIONS = [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1];

export default function CashCounter() {
  const [counts, setCounts] = useState<Record<number, number>>({
    2000: 0,
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
    2: 0,
    1: 0,
  });

  const [shopName, setShopName] = useState<string>('NK PrintBay / Cyber Cafe Counter');
  const [operatorName, setOperatorName] = useState<string>('Counter Cashier');

  const handleCountChange = (denom: number, val: string) => {
    const num = Math.max(0, parseInt(val) || 0);
    setCounts((prev) => ({ ...prev, [denom]: num }));
  };

  const handleReset = () => {
    const resetCounts: Record<number, number> = {};
    DENOMINATIONS.forEach((d) => (resetCounts[d] = 0));
    setCounts(resetCounts);
  };

  const totalNotes = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const totalAmount = DENOMINATIONS.reduce((sum, d) => sum + d * (counts[d] || 0), 0);

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col items-center bg-neutral-950 text-neutral-100 p-6 overflow-y-auto font-sans">
      
      {/* Top Header */}
      <div className="max-w-2xl w-full flex items-center justify-between mb-6 pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Daily Ledger & Cash Counter</h1>
            <p className="text-xs text-neutral-400">
              Currency note denominations tally for daily counter reconciliation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
            <span>Reset</span>
          </button>

          <button
            onClick={handlePrintSlip}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Slip</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="max-w-2xl w-full bg-neutral-900/70 border border-neutral-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
        
        {/* Total Summary Header */}
        <div className="bg-neutral-950/80 p-5 rounded-2xl border border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-neutral-400 uppercase tracking-wider block font-semibold">
              Total Cash in Drawer
            </span>
            <span className="text-3xl font-black text-amber-400 font-mono tracking-tight block mt-0.5">
              ₹{totalAmount.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-neutral-400 mt-1 block">
              Total Currency Notes: <strong className="text-white font-mono">{totalNotes}</strong>
            </span>
          </div>

          <div className="text-right text-xs text-neutral-400 space-y-0.5">
            <div>Date: <strong className="text-white font-mono">{formatDDMMYYYY(new Date())}</strong></div>
            <div>Time: <strong className="text-white font-mono">{formatDDMMYYYYWithTime(new Date()).split(' ')[1]}</strong></div>
          </div>
        </div>

        {/* Denominations Grid */}
        <div className="space-y-2">
          {DENOMINATIONS.map((denom) => {
            const count = counts[denom] || 0;
            const sub = denom * count;

            return (
              <div
                key={denom}
                className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800 hover:border-neutral-700 transition-colors text-xs"
              >
                <div className="flex items-center gap-3 w-28">
                  <span className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-white font-mono text-xs">
                    ₹{denom}
                  </span>
                  <span className="text-neutral-400">×</span>
                </div>

                <div className="flex-1 max-w-[140px] px-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={count === 0 ? '' : count}
                    onChange={(e) => handleCountChange(denom, e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-center font-mono font-bold text-white focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>

                <div className="w-28 text-right font-mono font-bold text-xs text-white">
                  = ₹{sub.toLocaleString('en-IN')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
