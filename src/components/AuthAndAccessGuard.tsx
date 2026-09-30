/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * src/components/AuthAndAccessGuard.tsx
 * Global Access Guard & Single-Device Enforcement Overlay.
 * Protects processing tools from expired subscriptions, suspended accounts,
 * or concurrent logins from other devices.
 */

import React, { useState, useEffect } from 'react';
import {
  Lock,
  AlertTriangle,
  Smartphone,
  LogOut,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  ShieldAlert,
  Zap,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  UserCog
} from 'lucide-react';
import {
  SessionUser,
  getStoredSession,
  saveStoredSession,
  getStoredUsers,
  saveStoredUsers,
  SEED_USERS
} from '../lib/authStore';
import MasterTestingHUD from './MasterTestingHUD';

interface AuthAndAccessGuardProps {
  children: React.ReactNode;
  onOpenAdminPortal?: () => void;
  onOpenPricing?: () => void;
  onSessionStateChange?: (user: SessionUser | null) => void;
}

export default function AuthAndAccessGuard({
  children,
  onOpenAdminPortal,
  onOpenPricing,
  onSessionStateChange,
}: AuthAndAccessGuardProps) {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [isSessionConflict, setIsSessionConflict] = useState<boolean>(false);
  const [isAccountSuspended, setIsAccountSuspended] = useState<boolean>(false);
  const [isPlanExpired, setIsPlanExpired] = useState<boolean>(false);
  const [showSwitchUserModal, setShowSwitchUserModal] = useState<boolean>(false);
  const [showMasterHUD, setShowMasterHUD] = useState<boolean>(true);

  // Sync state and validate session
  const validateSession = () => {
    const session = getStoredSession();
    setCurrentUser(session);
    onSessionStateChange?.(session);

    if (!session) {
      setIsSessionConflict(false);
      setIsAccountSuspended(false);
      setIsPlanExpired(false);
      return;
    }

    const users = getStoredUsers();
    const dbUser = users.find((u) => u.email === session.email);

    if (!dbUser) {
      // User deleted
      setIsSessionConflict(true);
      return;
    }

    // ----------------------------------------------------
    // CHECK 1: SINGLE-DEVICE SESSION CONFLICT
    // If db token doesn't match client's sessionToken,
    // another login occurred on another device or admin reset it!
    // ----------------------------------------------------
    if (!dbUser.currentSessionToken || dbUser.currentSessionToken !== session.sessionToken) {
      setIsSessionConflict(true);
      return;
    } else {
      setIsSessionConflict(false);
    }

    // CHECK 2: SUSPENDED
    if (dbUser.planStatus === 'suspended') {
      setIsAccountSuspended(true);
      return;
    } else {
      setIsAccountSuspended(false);
    }

    // CHECK 3: EXPIRED PLAN
    const now = new Date();
    const expiry = new Date(dbUser.planExpiresAt);
    if (now > expiry) {
      setIsPlanExpired(true);
    } else {
      setIsPlanExpired(false);
      // update days remaining in session
      const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (session.daysRemaining !== days) {
        saveStoredSession({ ...session, daysRemaining: days, planStatus: 'active' });
      }
    }
  };

  useEffect(() => {
    validateSession();

    // Listen to cross-tab updates or admin modifications
    const handleStorageChange = () => validateSession();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('np_users_updated', handleStorageChange);
    window.addEventListener('np_session_updated', handleStorageChange);

    // Heartbeat check every 2 seconds
    const interval = setInterval(validateSession, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('np_users_updated', handleStorageChange);
      window.removeEventListener('np_session_updated', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // ----------------------------------------------------
  // ACTION: SWITCH USER / LOGIN AS DIFFERENT ROLE
  // ----------------------------------------------------
  const handleLoginAs = (email: string) => {
    const users = getStoredUsers();
    const target = users.find((u) => u.email === email);
    if (!target) return;

    // Generate unique session token for single-device enforcement
    const newSessionToken = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Update DB
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
    const isExpired = now > expiry;
    const days = Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    const newSession: SessionUser = {
      id: target._id,
      name: target.name,
      email: target.email,
      role: target.role,
      planStatus: isExpired ? 'expired' : target.planStatus,
      planExpiresAt: target.planExpiresAt as string,
      sessionToken: newSessionToken,
      daysRemaining: days,
    };

    saveStoredSession(newSession);
    setCurrentUser(newSession);
    setShowSwitchUserModal(false);
    setIsSessionConflict(false);
  };

  // ----------------------------------------------------
  // SIMULATE 2ND DEVICE LOGIN (CONFLICT DEMO)
  // Generates a remote login for current user from another browser/terminal
  // ----------------------------------------------------
  const handleSimulateSecondDeviceLogin = () => {
    if (!currentUser) return;
    const users = getStoredUsers();
    const foreignToken = `foreign_device_${Date.now()}_chrome_mobile`;

    // Overwrite DB token with the new device's token
    const updatedUsers = users.map((u) => {
      if (u.email === currentUser.email) {
        return {
          ...u,
          currentSessionToken: foreignToken,
        };
      }
      return u;
    });
    saveStoredUsers(updatedUsers);

    // This tab still holds its old sessionToken, triggering the conflict!
    validateSession();
  };

  const handleLogout = () => {
    if (currentUser) {
      // Clear token from DB
      const users = getStoredUsers();
      const updated = users.map((u) => {
        if (u.email === currentUser.email) {
          return { ...u, currentSessionToken: null, isSessionActive: false };
        }
        return u;
      });
      saveStoredUsers(updated);
    }
    saveStoredSession(null);
    setCurrentUser(null);
    setIsSessionConflict(false);
  };

  // Quick 1-click renewal from expired overlay (for testing/admin convenience)
  const handleQuickRenew = () => {
    if (!currentUser) return;
    const users = getStoredUsers();
    const updated = users.map((u) => {
      if (u.email === currentUser.email) {
        const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        return {
          ...u,
          planExpiresAt: newExpiry,
          planStatus: 'active' as const,
          effectiveStatus: 'active' as const,
        };
      }
      return u;
    });
    saveStoredUsers(updated);
    setIsPlanExpired(false);
    validateSession();
  };

  return (
    <div className="relative w-full min-h-screen flex flex-col">
      {/* ---------------------------------------------------- */}
      {/* TOP USER & AUTH STATUS BANNER (Inside Header)         */}
      {/* ---------------------------------------------------- */}
      <div className="no-print bg-neutral-900 border-b border-neutral-800 px-6 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-neutral-400">Signed In:</span>
            <span className="font-semibold text-white">{currentUser?.name || 'Guest'}</span>
            <span className="text-[10px] text-neutral-500 font-mono">({currentUser?.email})</span>
          </div>

          <span className="text-neutral-700">|</span>

          {/* Role Badge */}
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
              currentUser?.role === 'admin'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-neutral-800 text-neutral-300'
            }`}
          >
            ROLE: {currentUser?.role?.toUpperCase() || 'USER'}
          </span>

          <span className="text-neutral-700">|</span>

          {/* Plan Status & Validity Badge */}
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400">Validity:</span>
            <span
              className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold ${
                isPlanExpired
                  ? 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {isPlanExpired ? '0 DAYS (EXPIRED)' : `${currentUser?.daysRemaining || 0} DAYS LEFT`}
            </span>
          </div>

          <span className="text-neutral-700 hidden md:inline">|</span>

          {/* Single-Device Token Indicator */}
          <div className="hidden md:flex items-center gap-1.5 text-neutral-400">
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px]">Active Session:</span>
            <span className="font-mono text-[10px] text-cyan-300">
              {currentUser?.sessionToken ? `${currentUser.sessionToken.slice(0, 10)}...` : 'None'}
            </span>
          </div>
        </div>

        {/* Auth Action Controls */}
        <div className="flex items-center gap-2">
          {/* Master Testing Mode Toggle Button */}
          <button
            onClick={() => setShowMasterHUD(!showMasterHUD)}
            className={`px-2.5 py-1 rounded border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              showMasterHUD
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-neutral-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                : 'bg-neutral-800 text-cyan-300 border-neutral-700 hover:bg-neutral-750'
            }`}
            title="Toggle Master User Testing HUD & Customer Experience Simulator"
          >
            <UserCog className="w-3.5 h-3.5" />
            <span>Master Testing Mode</span>
          </button>

          {/* Pricing / Upgrade Plans Button */}
          {onOpenPricing && (
            <button
              onClick={onOpenPricing}
              className="px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>Plans (₹29/₹199)</span>
            </button>
          )}

          {/* Switch User / Account Selector */}
          <button
            onClick={() => setShowSwitchUserModal(true)}
            className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-750 text-cyan-300 border border-neutral-700 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            <UserCheck className="w-3 h-3" />
            <span>Switch User</span>
          </button>

          {/* Admin Portal Shortcut if Admin */}
          {currentUser?.role === 'admin' && onOpenAdminPortal && (
            <button
              onClick={onOpenAdminPortal}
              className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </button>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-1 text-neutral-400 hover:text-white transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* MAIN VIEWPORT (WRAPPED TOOLS)                        */}
      {/* ---------------------------------------------------- */}
      <div className="relative flex-1 flex flex-col">
        {children}

        {/* ---------------------------------------------------- */}
        {/* GLOBAL ACCESS GUARD 1: SUBSCRIPTION EXPIRED OVERLAY   */}
        {/* ---------------------------------------------------- */}
        {isPlanExpired && (
          <div className="absolute inset-0 z-40 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Lock className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Access Expired
                </h3>
                <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                  Your print portal subscription plan has ended for{' '}
                  <span className="text-neutral-200 font-mono">{currentUser?.email}</span>.
                  Document processing tools and ultra-HD canvas rendering are locked.
                </p>
              </div>

              <div className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 text-xs text-left font-mono space-y-1 text-neutral-400">
                <div className="flex justify-between">
                  <span>Current Status:</span>
                  <span className="text-rose-400 font-semibold uppercase">EXPIRED</span>
                </div>
                <div className="flex justify-between">
                  <span>Plan Expiry Date:</span>
                  <span className="text-neutral-300">
                    {currentUser?.planExpiresAt
                      ? new Date(currentUser.planExpiresAt).toLocaleDateString('en-GB')
                      : 'Expired'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Enforcement:</span>
                  <span className="text-cyan-400">Strict Single-Device Guard</span>
                </div>
              </div>

              <div className="w-full flex flex-col gap-2 pt-2">
                {currentUser?.role === 'admin' ? (
                  <button
                    onClick={onOpenAdminPortal}
                    className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Open Admin Portal to Extend Validity</span>
                  </button>
                ) : (
                  <>
                    {onOpenPricing && (
                      <button
                        onClick={onOpenPricing}
                        className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-cyan-500/20"
                      >
                        <Zap className="w-4 h-4" />
                        <span>View Plans & Pay (Razorpay / UPI)</span>
                      </button>
                    )}
                    <button
                      onClick={handleQuickRenew}
                      className="w-full py-2 px-4 bg-neutral-800 hover:bg-neutral-750 text-cyan-300 font-medium rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Instant Demo Renew (+30 Days)</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => setShowSwitchUserModal(true)}
                  className="w-full py-2 px-4 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-medium rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Switch to Another Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* GLOBAL ACCESS GUARD 2: ACCOUNT SUSPENDED OVERLAY    */}
        {/* ---------------------------------------------------- */}
        {isAccountSuspended && (
          <div className="absolute inset-0 z-40 bg-neutral-950/90 backdrop-blur-md flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ShieldAlert className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Account Suspended
                </h3>
                <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                  Your access has been temporarily suspended by an administrator.
                  Contact your portal owner to reactivate your counter.
                </p>
              </div>

              <button
                onClick={() => setShowSwitchUserModal(true)}
                className="w-full py-2.5 px-4 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Switch Account
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* SINGLE-DEVICE ENFORCEMENT MODAL (DEVICE CONFLICT)     */}
        {/* ---------------------------------------------------- */}
        {isSessionConflict && (
          <div className="fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-neutral-900 border border-rose-500/40 rounded-2xl p-8 shadow-2xl text-center flex flex-col items-center gap-4 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <Smartphone className="w-8 h-8 animate-bounce" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Logged in from another device
                </h3>
                <p className="text-xs text-rose-300/90 mt-1.5 leading-relaxed">
                  Your account was logged in from another browser or terminal.
                  To ensure security and prevent account sharing, active sessions are restricted to a single device at a time.
                </p>
              </div>

              <div className="w-full bg-rose-950/20 border border-rose-900/60 rounded-xl p-3 text-xs text-left font-mono space-y-1 text-rose-300">
                <div>Account: {currentUser?.email}</div>
                <div>Status: Session Token Revoked / Terminated</div>
              </div>

              <div className="w-full flex flex-col gap-2 pt-2">
                <button
                  onClick={() => {
                    // Re-login to reclaim this device as the active one
                    if (currentUser) {
                      handleLoginAs(currentUser.email);
                    }
                  }}
                  className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Resume Session on This Device</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full py-2 px-4 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-medium rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* SWITCH USER / DEMO ROLE SELECTION MODAL               */}
      {/* ---------------------------------------------------- */}
      {showSwitchUserModal && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-cyan-400" />
                  <span>Switch Account / Test Roles</span>
                </h3>
                <p className="text-xs text-neutral-400">
                  Select a test profile to verify permissions, validity guards, and single-device handling.
                </p>
              </div>
              <button
                onClick={() => setShowSwitchUserModal(false)}
                className="text-neutral-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {getStoredUsers().map((u) => {
                const isCurrent = currentUser?.email === u.email;
                const isExp = new Date() > new Date(u.planExpiresAt);

                return (
                  <button
                    key={u._id}
                    onClick={() => handleLoginAs(u.email)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isCurrent
                        ? 'bg-cyan-950/30 border-cyan-500/50 text-white'
                        : 'bg-neutral-950/60 border-neutral-800 hover:bg-neutral-800/60 text-neutral-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white">{u.name}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                            u.role === 'admin'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : u.role === 'master'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {u.role === 'master' ? 'MASTER SIMULATOR' : u.role.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono mt-0.5">{u.email}</div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block ${
                          u.planStatus === 'suspended'
                            ? 'bg-neutral-800 text-neutral-400'
                            : isExp
                            ? 'bg-rose-950/80 text-rose-400'
                            : 'bg-emerald-950/80 text-emerald-400'
                        }`}
                      >
                        {u.planStatus === 'suspended'
                          ? 'SUSPENDED'
                          : isExp
                          ? 'EXPIRED'
                          : 'ACTIVE (UNLOCKED)'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSwitchUserModal(false)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 rounded-lg text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MASTER USER TESTING HUD (SIMULATE USERS EXPERIENCE)   */}
      {/* ---------------------------------------------------- */}
      {showMasterHUD && (
        <MasterTestingHUD
          currentUser={currentUser}
          onUserSwitched={(user) => {
            validateSession();
            onSessionStateChange?.(user);
          }}
          onOpenAdmin={onOpenAdminPortal}
          onOpenPricing={onOpenPricing}
        />
      )}
    </div>
  );
}
