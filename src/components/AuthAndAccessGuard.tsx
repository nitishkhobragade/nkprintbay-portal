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
  UserCog,
  AlertCircle,
  Eye,
  EyeOff,
  Gift,
  Coins
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
import { formatDDMMYYYY } from '../lib/dateUtils';

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

  // Registration Modal State & Real-Time Duplicate Validation
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('register');
  const [showPasswordText, setShowPasswordText] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [regName, setRegName] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('+91 ');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regDuplicateError, setRegDuplicateError] = useState<string | null>(null);
  const [isSubmittingReg, setIsSubmittingReg] = useState<boolean>(false);

  const checkDuplicate = async (email: string, phone: string) => {
    if (!email.trim() && !phone.replace('+91', '').trim()) {
      setRegDuplicateError(null);
      return;
    }

    // Check locally first
    const users = getStoredUsers();
    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = phone.trim();

    const localDup = users.find(
      (u) =>
        (cleanEmail && u.email.toLowerCase() === cleanEmail) ||
        (cleanPhone && u.phone && u.phone.replace(/\s+/g, '') === cleanPhone.replace(/\s+/g, ''))
    );

    if (localDup) {
      setRegDuplicateError('This mobile number or email is already registered. Please login.');
      return;
    }

    // Check server-side route
    try {
      const res = await fetch(`/api/auth/register?email=${encodeURIComponent(cleanEmail)}&phone=${encodeURIComponent(cleanPhone)}`);
      if (res.status === 409) {
        const data = await res.json();
        setRegDuplicateError(data.error || 'This mobile number or email is already registered. Please login.');
      } else {
        setRegDuplicateError(null);
      }
    } catch {
      setRegDuplicateError(null);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) return;

    setIsSubmittingReg(true);
    setRegDuplicateError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          phone: regPhone.trim(),
          email: regEmail.trim(),
          password: regPassword.trim(),
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setRegDuplicateError(data.error || 'This mobile number or email is already registered. Please login.');
        setIsSubmittingReg(false);
        return;
      }

      // Add to local DB and log in
      const newUser = {
        _id: data.user?.id || `usr_${Date.now()}`,
        name: regName.trim(),
        phone: regPhone.trim(),
        email: regEmail.toLowerCase().trim(),
        role: 'user' as const,
        planStatus: 'active' as const,
        effectiveStatus: 'active' as const,
        planExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        currentSessionToken: data.user?.sessionToken || `sess_${Date.now()}`,
        isSessionActive: true,
        daysRemaining: 14,
        createdAt: new Date().toISOString(),
      };

      const existingUsers = getStoredUsers();
      saveStoredUsers([newUser, ...existingUsers]);

      const session: SessionUser = {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: 'user',
        planStatus: 'active',
        planExpiresAt: newUser.planExpiresAt,
        sessionToken: newUser.currentSessionToken,
        daysRemaining: 14,
      };

      saveStoredSession(session);
      setCurrentUser(session);
      setShowRegisterModal(false);
      setRegName('');
      setRegEmail('');
      setRegPhone('+91 ');
      setRegPassword('');
      validateSession();
    } catch (err: any) {
      setRegDuplicateError(`Registration error: ${err.message}`);
    } finally {
      setIsSubmittingReg(false);
    }
  };

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
      <div className="no-print bg-neutral-900/95 border-b border-neutral-800 px-3 sm:px-6 py-1.5 sm:py-2 flex flex-wrap items-center justify-between gap-2 text-xs w-full overflow-hidden">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-neutral-400 hidden xs:inline shrink-0">Signed In:</span>
            <span className="font-semibold text-white truncate max-w-[120px] sm:max-w-[180px]">{currentUser?.name || 'Guest'}</span>
            <span className="text-[10px] text-neutral-500 font-mono hidden xl:inline truncate max-w-[160px]">({currentUser?.email})</span>
          </div>

          <span className="text-neutral-700 hidden sm:inline">|</span>

          {/* Role Badge */}
          <span
            className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] font-mono font-medium shrink-0 ${
              currentUser?.role === 'admin'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-neutral-800 text-neutral-300'
            }`}
          >
            {currentUser?.role?.toUpperCase() || 'USER'}
          </span>

          <span className="text-neutral-700 hidden sm:inline">|</span>

          {/* Plan Status & Validity Badge */}
          <div className="flex items-center gap-1 shrink-0">
            <span
              className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold ${
                isPlanExpired
                  ? 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {isPlanExpired ? '0 DAYS (EXPIRED)' : `${currentUser?.daysRemaining || 0}D LEFT`}
            </span>
          </div>

          {/* Freemium Credits / Free Prints Badge */}
          <div className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 text-[10px] font-semibold shrink-0">
            <Gift className="w-3 h-3 text-amber-400" />
            <span>{currentUser?.freePrintsLeft ?? 4} Free Prints</span>
          </div>
        </div>

        {/* Auth Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
          {/* Master Testing Mode Toggle Button */}
          <button
            onClick={() => setShowMasterHUD(!showMasterHUD)}
            className={`px-2 sm:px-2.5 py-1 rounded border text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
              showMasterHUD
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-neutral-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                : 'bg-neutral-800 text-cyan-300 border-neutral-700 hover:bg-neutral-750'
            }`}
            title="Toggle Master User Testing HUD & Customer Experience Simulator"
          >
            <UserCog className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Master Mode</span>
            <span className="sm:hidden text-[10px]">Master</span>
          </button>

          {/* Pricing / Upgrade Plans Button */}
          {onOpenPricing && (
            <button
              onClick={onOpenPricing}
              className="px-2 sm:px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Zap className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="hidden md:inline">Plans (₹29/₹199)</span>
              <span className="md:hidden">Plans</span>
            </button>
          )}

          {/* Switch User / Account Selector */}
          <button
            onClick={() => setShowSwitchUserModal(true)}
            className="px-2 sm:px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-750 text-cyan-300 border border-neutral-700 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
            title="Switch User Profile"
          >
            <UserCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Switch User</span>
          </button>

          {/* Admin Portal Shortcut if Admin */}
          {currentUser?.role === 'admin' && onOpenAdminPortal && (
            <button
              onClick={onOpenAdminPortal}
              className="px-2 sm:px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-1 sm:p-1.5 text-neutral-400 hover:text-white transition-colors rounded hover:bg-neutral-800 cursor-pointer shrink-0"
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

            <div className="pt-2 flex items-center justify-between border-t border-neutral-800">
              <button
                onClick={() => {
                  setShowSwitchUserModal(false);
                  setShowRegisterModal(true);
                }}
                className="px-3.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>+ Register New Counter</span>
              </button>

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
      {/* AUTHENTICATION & REGISTRATION MODAL (GLASSMORPHISM) */}
      {/* ---------------------------------------------------- */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-neutral-900/90 border border-neutral-750 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl backdrop-blur-2xl flex flex-col gap-5 text-xs font-sans relative overflow-hidden">
            
            {/* Top decorative gradient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

            {/* Header & Close */}
            <div className="flex items-center justify-between relative z-10">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-white tracking-tight flex items-center gap-2">
                  <span>NK PrintBay</span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    OPERATOR ACCESS
                  </span>
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Sign in or create your counter operating license
                </p>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="w-8 h-8 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Tab Switcher: Login vs Create Account */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-950/80 border border-neutral-800 rounded-2xl relative z-10">
              <button
                onClick={() => {
                  setAuthModalTab('login');
                  setRegDuplicateError(null);
                }}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  authModalTab === 'login'
                    ? 'bg-neutral-850 text-white shadow-sm border border-neutral-750'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Sign In to Counter
              </button>
              <button
                onClick={() => {
                  setAuthModalTab('register');
                  setRegDuplicateError(null);
                }}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  authModalTab === 'register'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-neutral-950 shadow-md shadow-cyan-500/20'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Create Account (Free)
              </button>
            </div>

            {/* TAB 1: REGISTRATION */}
            {authModalTab === 'register' && (
              <div className="space-y-4 relative z-10">
                
                {/* Welcome Gift Highlight Banner */}
                <div className="bg-gradient-to-r from-cyan-950/60 to-purple-950/60 border border-cyan-500/30 rounded-2xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
                    <Gift className="w-4 h-4 text-amber-400 animate-bounce" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-[11px] block">
                      Welcome Bonus: 4 Free HD Prints!
                    </span>
                    <span className="text-[10px] text-neutral-300 block">
                      Get 10 credits & 7-day full access immediately upon sign-up.
                    </span>
                  </div>
                </div>

                {regDuplicateError && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{regDuplicateError}</span>
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <div>
                    <label className="text-neutral-300 block mb-1 font-medium">Business / Shop Name:</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Cyber Point"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-neutral-300 block mb-1 font-medium">Mobile Number (+91):</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={regPhone}
                      onBlur={() => checkDuplicate(regEmail, regPhone)}
                      onChange={(e) => {
                        setRegPhone(e.target.value);
                        if (regDuplicateError) setRegDuplicateError(null);
                      }}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-neutral-300 block mb-1 font-medium">Email Address:</label>
                    <input
                      type="email"
                      required
                      placeholder="ramesh.cyber@gmail.com"
                      value={regEmail}
                      onBlur={() => checkDuplicate(regEmail, regPhone)}
                      onChange={(e) => {
                        setRegEmail(e.target.value);
                        if (regDuplicateError) setRegDuplicateError(null);
                      }}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-neutral-300 block mb-1 font-medium">Password:</label>
                    <div className="relative">
                      <input
                        type={showPasswordText ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordText(!showPasswordText)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                      >
                        {showPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-neutral-400 pt-1">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded bg-neutral-950 border-neutral-800 text-cyan-500 focus:ring-0"
                    />
                    <span>Remember this workstation session (Single-Device protected)</span>
                  </label>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRegisterModal(false)}
                      className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-xl font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReg || Boolean(regDuplicateError)}
                      className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-neutral-950 font-extrabold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                    >
                      <span>{isSubmittingReg ? 'Validating...' : 'Claim 4 Free Prints'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: SIGN IN / SWITCH PROFILE */}
            {authModalTab === 'login' && (
              <div className="space-y-3 relative z-10">
                <span className="text-neutral-400 block text-[11px]">
                  Select an existing registered operator account or admin session:
                </span>

                <div className="space-y-2 max-h-[46vh] overflow-y-auto">
                  {getStoredUsers().map((u) => {
                    const isCurrent = currentUser?.email === u.email;
                    const isExp = new Date() > new Date(u.planExpiresAt);

                    return (
                      <button
                        key={u._id}
                        onClick={() => {
                          handleLoginAs(u.email);
                          setShowRegisterModal(false);
                        }}
                        className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
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
                              {u.role === 'master' ? 'MASTER' : u.role.toUpperCase()}
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
                            {u.planStatus === 'suspended' ? 'SUSPENDED' : isExp ? 'EXPIRED' : 'ACTIVE'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setShowRegisterModal(false)}
                    className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-xl"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
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
