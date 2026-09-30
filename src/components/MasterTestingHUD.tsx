'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * src/components/MasterTestingHUD.tsx
 * Master User Testing & Impersonation HUD.
 * Allows developers and owners to test the portal from the exact perspective of
 * regular Cyber Cafe operators, test subscription expirations, single-device kicks,
 * and switch accounts in 1 click.
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  Smartphone,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  ChevronUp,
  ChevronDown,
  Layers,
  Clock,
  Sparkles,
  Lock,
  UserCog,
  Eye,
  Sliders,
  X
} from 'lucide-react';
import {
  SessionUser,
  getStoredUsers,
  saveStoredUsers,
  getStoredSession,
  saveStoredSession,
  SEED_USERS
} from '../lib/authStore';

interface MasterTestingHUDProps {
  currentUser: SessionUser | null;
  onUserSwitched?: (user: SessionUser) => void;
  onOpenAdmin?: () => void;
  onOpenPricing?: () => void;
}

export default function MasterTestingHUD({
  currentUser,
  onUserSwitched,
  onOpenAdmin,
  onOpenPricing,
}: MasterTestingHUDProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // ----------------------------------------------------
  // ACTION: SWITCH ACCOUNT IMPERSONATION
  // ----------------------------------------------------
  const handleSwitchUser = (email: string) => {
    const users = getStoredUsers();
    const target = users.find((u) => u.email === email);
    if (!target) return;

    const newSessionToken = `sess_${target.role}_${Date.now()}`;
    const updatedUsers = users.map((u) => {
      if (u.email === email) {
        return {
          ...u,
          currentSessionToken: newSessionToken,
          isSessionActive: true,
        };
      }
      return u;
    });
    saveStoredUsers(updatedUsers);

    const now = new Date();
    const expiry = new Date(target.planExpiresAt);
    const days = Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    const newSession: SessionUser = {
      id: target._id,
      name: target.name,
      email: target.email,
      role: target.role,
      planStatus: now > expiry ? 'expired' : target.planStatus,
      planExpiresAt: target.planExpiresAt.toString(),
      sessionToken: newSessionToken,
      daysRemaining: days,
    };

    saveStoredSession(newSession);
    onUserSwitched?.(newSession);
    showToast(`Switched view to ${target.name} (${target.role.toUpperCase()})`);
  };

  // ----------------------------------------------------
  // ACTION: SIMULATE SUBSCRIPTION STATE FOR CURRENT USER
  // ----------------------------------------------------
  const handleSimulatePlan = (status: 'active-30' | 'warning-1' | 'expired-0' | 'suspended') => {
    if (!currentUser) return;

    const users = getStoredUsers();
    const now = new Date();
    let newExpiry: Date;
    let newStatus: 'active' | 'expired' | 'suspended' = 'active';

    if (status === 'active-30') {
      newExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      newStatus = 'active';
    } else if (status === 'warning-1') {
      newExpiry = new Date(now.getTime() + 20 * 60 * 60 * 1000); // 20 hours left
      newStatus = 'active';
    } else if (status === 'expired-0') {
      newExpiry = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      newStatus = 'expired';
    } else {
      newExpiry = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      newStatus = 'suspended';
    }

    const updatedUsers = users.map((u) => {
      if (u.email === currentUser.email) {
        return {
          ...u,
          planStatus: newStatus,
          effectiveStatus: newStatus,
          planExpiresAt: newExpiry.toISOString(),
        };
      }
      return u;
    });
    saveStoredUsers(updatedUsers);

    const days = Math.max(0, Math.ceil((newExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const updatedSession: SessionUser = {
      ...currentUser,
      planStatus: newStatus,
      planExpiresAt: newExpiry.toISOString(),
      daysRemaining: days,
    };
    saveStoredSession(updatedSession);
    onUserSwitched?.(updatedSession);

    if (status === 'active-30') showToast('Simulated Active Pro Account (+30 Days)');
    if (status === 'warning-1') showToast('Simulated Expiring Soon Warning (1 Day Left)');
    if (status === 'expired-0') showToast('Simulated Expired Account (Blocking Paywall Active)');
    if (status === 'suspended') showToast('Simulated Suspended Account (Admin Lock Active)');
  };

  // ----------------------------------------------------
  // ACTION: SIMULATE 2ND DEVICE LOGIN CONFLICT
  // ----------------------------------------------------
  const handleSimulateConflict = () => {
    if (!currentUser) return;
    const users = getStoredUsers();
    const updatedUsers = users.map((u) => {
      if (u.email === currentUser.email) {
        return {
          ...u,
          currentSessionToken: `other_device_mobile_${Date.now()}`,
        };
      }
      return u;
    });
    saveStoredUsers(updatedUsers);
    showToast('Simulated another device login. Single-device lock triggered!');
  };

  // ----------------------------------------------------
  // ACTION: RESET ALL DEMO DATA TO FACTORY SEED
  // ----------------------------------------------------
  const handleResetFactory = () => {
    localStorage.removeItem('np_admin_users_db');
    localStorage.removeItem('np_pending_recharges');
    localStorage.removeItem('np_active_session_data');
    saveStoredUsers(SEED_USERS);
    const defaultUser = SEED_USERS[0]; // Master User
    handleSwitchUser(defaultUser.email);
    showToast('Factory reset complete. Master User active.');
  };

  return (
    <div className="no-print fixed bottom-4 right-4 z-50 flex flex-col items-end font-sans">
      
      {/* Toast Alert */}
      {notification && (
        <div className="mb-2 bg-neutral-900 border border-cyan-500/50 text-cyan-300 px-3.5 py-1.5 rounded-lg text-xs font-medium shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-neutral-900/95 border-2 border-cyan-500/60 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md max-w-sm sm:max-w-md w-full">
        
        {/* Top Header Bar */}
        <div className="bg-neutral-950/80 px-4 py-2.5 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <UserCog className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-white">Master Tester HUD</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono font-semibold">
                  USER SIMULATOR
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 block leading-tight">
                Current: <strong className="text-white">{currentUser?.name || 'Operator'}</strong> ({currentUser?.role?.toUpperCase()})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title={isExpanded ? 'Collapse HUD' : 'Expand HUD'}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Body */}
        {isExpanded && (
          <div className="p-4 flex flex-col gap-3 text-xs">
            
            {/* Live State Summary */}
            <div className="grid grid-cols-2 gap-2 bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-800 text-[11px]">
              <div>
                <span className="text-neutral-500 block text-[10px]">Active Perspective:</span>
                <span className="font-semibold text-white truncate block">
                  {currentUser?.email}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px]">Validity State:</span>
                <span className={`font-mono font-bold block ${
                  currentUser?.planStatus === 'active' ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {currentUser?.planStatus === 'active'
                    ? `${currentUser.daysRemaining}d Left (Active)`
                    : `${currentUser?.planStatus?.toUpperCase()}`}
                </span>
              </div>
            </div>

            {/* Test Simulation Buttons: Instant Plan States */}
            <div>
              <span className="text-[11px] font-semibold text-neutral-400 block mb-1.5">
                Simulate Subscription State on Current View:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  onClick={() => handleSimulatePlan('active-30')}
                  className="py-1.5 px-2 bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-semibold text-center transition-colors cursor-pointer"
                  title="Simulate 30 Days Active Access"
                >
                  🟢 Active (30d)
                </button>

                <button
                  onClick={() => handleSimulatePlan('warning-1')}
                  className="py-1.5 px-2 bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-semibold text-center transition-colors cursor-pointer"
                  title="Simulate Expiring Soon Notice"
                >
                  🟡 1 Day Left
                </button>

                <button
                  onClick={() => handleSimulatePlan('expired-0')}
                  className="py-1.5 px-2 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 rounded-lg text-[10px] font-semibold text-center transition-colors cursor-pointer"
                  title="Simulate Expired Plan (Test Paywall & Renew Button)"
                >
                  🔴 Expired (0d)
                </button>

                <button
                  onClick={() => handleSimulatePlan('suspended')}
                  className="py-1.5 px-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 rounded-lg text-[10px] font-semibold text-center transition-colors cursor-pointer"
                  title="Simulate Admin Suspension"
                >
                  ⛔ Suspended
                </button>
              </div>
            </div>

            {/* Impersonation User Switcher */}
            <div>
              <span className="text-[11px] font-semibold text-neutral-400 block mb-1.5">
                1-Click Account Switcher:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleSwitchUser('master@printbay.in')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-left flex items-center justify-between transition-colors ${
                    currentUser?.email === 'master@printbay.in'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <span className="truncate">Master Operator</span>
                  <span className="text-[9px] font-mono text-cyan-400">180d</span>
                </button>

                <button
                  onClick={() => handleSwitchUser('operator@printshop.in')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-left flex items-center justify-between transition-colors ${
                    currentUser?.email === 'operator@printshop.in'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <span className="truncate">Sharma Cyber (Active)</span>
                  <span className="text-[9px] font-mono text-emerald-400">14d</span>
                </button>

                <button
                  onClick={() => handleSwitchUser('expired.demo@counter.com')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-left flex items-center justify-between transition-colors ${
                    currentUser?.email === 'expired.demo@counter.com'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <span className="truncate">Expired Counter</span>
                  <span className="text-[9px] font-mono text-rose-400">0d</span>
                </button>

                <button
                  onClick={() => handleSwitchUser('admin@npportal.com')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-left flex items-center justify-between transition-colors ${
                    currentUser?.email === 'admin@npportal.com'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <span className="truncate">Super Admin</span>
                  <span className="text-[9px] font-mono text-amber-400">Admin</span>
                </button>
              </div>
            </div>

            {/* Quick Testing Actions */}
            <div className="pt-1 flex items-center justify-between border-t border-neutral-800 text-[10px]">
              <button
                onClick={handleSimulateConflict}
                className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                title="Simulate someone logging in from phone"
              >
                <Smartphone className="w-3 h-3" />
                <span>Test 2nd Device Kick</span>
              </button>

              {onOpenPricing && (
                <button
                  onClick={onOpenPricing}
                  className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Zap className="w-3 h-3" />
                  <span>Test Plans / Pay</span>
                </button>
              )}

              <button
                onClick={handleResetFactory}
                className="text-neutral-500 hover:text-rose-400 font-medium transition-colors cursor-pointer"
                title="Reset all users to default test state"
              >
                Reset Demo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
