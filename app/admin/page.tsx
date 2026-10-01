'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * app/admin/page.tsx
 * Admin Portal & Super Admin Management Suite for NP Job Portal / Print Bay.
 * Features:
 * - Live MongoDB Database Synchronization & Ping
 * - 1-Click Backup Database (.json) & Restore from Backup
 * - Direct Export to Excel (.csv) & Printable PDF Report
 * - Full User Accounts Management (Name, Phone, Email, Registered On, Current Plan, Expiry, Validity)
 * - Strict Date Format: DD/MM/YYYY & DD/MM/YYYY hh:mm A across the entire suite
 * - Manual UPI UTR Verification & Approval
 * - Single-Device Session Reset & Account Suspension
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Search,
  Filter,
  ArrowLeft,
  Calendar,
  Layers,
  Sparkles,
  Zap,
  Lock,
  Download,
  Upload,
  FileSpreadsheet,
  Printer,
  Database,
  Phone,
  Mail,
  UserPlus,
  CreditCard,
  QrCode,
  Check,
  X,
  FileCheck,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatDDMMYYYY, formatDDMMYYYYWithTime } from '@/lib/dateUtils';

export interface AdminUserData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'user' | 'master';
  planStatus: 'active' | 'expired' | 'suspended';
  effectiveStatus?: 'active' | 'expired' | 'suspended';
  planName?: string;
  planExpiresAt: string | Date;
  currentSessionToken: string | null;
  isSessionActive?: boolean;
  daysRemaining?: number;
  createdAt: string | Date;
  password?: string;
}

export interface TransactionItem {
  _id: string;
  userId: string;
  userEmail: string;
  userName: string;
  planId: string;
  planName: string;
  validityDays: number;
  amount: number;
  paymentMethod: 'razorpay' | 'manual_upi';
  status: 'success' | 'pending' | 'failed' | 'rejected';
  utrNumber?: string;
  razorpayPaymentId?: string;
  createdAt: string;
  approvedBy?: string;
}

interface AdminDashboardProps {
  onBackToPortal?: () => void;
  currentAdminEmail?: string;
  currentAdminToken?: string;
}

export default function AdminPage({
  onBackToPortal,
  currentAdminEmail = 'admin@npportal.com',
  currentAdminToken = 'admin-active-session-token',
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'transactions'>('users');
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'suspended'>('all');
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Restore Modal State
  const [showRestoreModal, setShowRestoreModal] = useState<boolean>(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePreview, setRestorePreview] = useState<{ usersCount: number; txnCount: number } | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const restoreInputRef = useRef<HTMLInputElement | null>(null);

  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('+91 ');
  const [newUserPassword, setNewUserPassword] = useState('Password@123');
  const [newUserRole, setNewUserRole] = useState<'user' | 'admin'>('user');
  const [newUserDays, setNewUserDays] = useState(30);

  // Load initial data on mount
  useEffect(() => {
    fetchUsers();
    fetchTransactions();

    const handleUpdate = () => {
      fetchUsers();
      fetchTransactions();
    };
    window.addEventListener('np_payment_updated', handleUpdate);
    window.addEventListener('np_users_updated', handleUpdate);

    return () => {
      window.removeEventListener('np_payment_updated', handleUpdate);
      window.removeEventListener('np_users_updated', handleUpdate);
    };
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${currentAdminToken}`,
          'x-admin-email': currentAdminEmail,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.users && Array.isArray(data.users)) {
          setUsers(data.users);
          saveUsersLocally(data.users);
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Backend users API unavailable, loading local store:', e);
    }

    // Fallback to local storage
    const local = localStorage.getItem('np_admin_users_db');
    if (local) {
      try {
        setUsers(JSON.parse(local));
      } catch {
        setUsers([]);
      }
    }
    setIsLoading(false);
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/admin/transactions');
      if (res.ok) {
        const data = await res.json();
        if (data.transactions && Array.isArray(data.transactions)) {
          setTransactions(data.transactions);
          localStorage.setItem('np_pending_recharges', JSON.stringify(data.transactions));
          return;
        }
      }
    } catch (e) {}

    const localTx = localStorage.getItem('np_pending_recharges');
    if (localTx) {
      try {
        setTransactions(JSON.parse(localTx));
      } catch {}
    }
  };

  const saveUsersLocally = (updated: AdminUserData[]) => {
    setUsers(updated);
    localStorage.setItem('np_admin_users_db', JSON.stringify(updated));
    window.dispatchEvent(new Event('np_users_updated'));
  };

  const showFeedback = (text: string, type: 'success' | 'error') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // ----------------------------------------------------
  // ACTION: SYNC DATABASE (PING & CACHE PURGE)
  // ----------------------------------------------------
  const handleSyncDatabase = async () => {
    setIsSyncing(true);
    setSyncStatus('Pinging MongoDB connection...');
    try {
      const res = await fetch('/api/admin/sync', { method: 'POST' });
      const data = await res.json();
      await fetchUsers();
      await fetchTransactions();

      if (data.connected) {
        showFeedback(`Synced in ${data.latencyMs}ms: ${data.metrics?.users} Users, ${data.metrics?.transactions} Transactions.`, 'success');
      } else {
        showFeedback(`Database state synchronized with Local Storage (${users.length} users).`, 'success');
      }
    } catch (e: any) {
      showFeedback(`Sync error: ${e.message}`, 'error');
    } finally {
      setIsSyncing(false);
      setSyncStatus(null);
    }
  };

  // ----------------------------------------------------
  // ACTION: DOWNLOAD BACKUP (.JSON)
  // ----------------------------------------------------
  const handleDownloadBackup = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();

    const backupPayload = {
      app: 'NP Job Portal / Print Bay',
      version: '2.5.0',
      exportedAt: now.toISOString(),
      formattedDate: `${day}/${month}/${year}`,
      totalUsers: users.length,
      totalTransactions: transactions.length,
      collections: {
        users,
        transactions,
      },
    };

    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `np_database_backup_${day}_${month}_${year}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showFeedback('Database backup (.json) downloaded successfully.', 'success');
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
  };

  // ----------------------------------------------------
  // ACTION: RESTORE FROM BACKUP
  // ----------------------------------------------------
  const handleSelectRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.collections) {
          showFeedback('Invalid backup structure: missing collections key', 'error');
          return;
        }
        setRestoreFile(file);
        setRestorePreview({
          usersCount: parsed.collections.users?.length || 0,
          txnCount: parsed.collections.transactions?.length || 0,
        });
        setShowRestoreModal(true);
      } catch (err: any) {
        showFeedback('Failed to parse backup JSON file: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (!restoreFile) return;
    setIsRestoring(true);

    try {
      const text = await restoreFile.text();
      const payload = JSON.parse(text);

      const res = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (payload.collections?.users) {
        saveUsersLocally(payload.collections.users);
      }
      if (payload.collections?.transactions) {
        setTransactions(payload.collections.transactions);
        localStorage.setItem('np_pending_recharges', JSON.stringify(payload.collections.transactions));
      }

      setShowRestoreModal(false);
      setRestoreFile(null);
      setRestorePreview(null);
      showFeedback(`Database restored: ${restorePreview?.usersCount} users loaded.`, 'success');
      confetti({ particleCount: 50, spread: 80, origin: { y: 0.7 } });
    } catch (err: any) {
      showFeedback('Restore error: ' + err.message, 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  // ----------------------------------------------------
  // ACTION: EXPORT USERS TO EXCEL (.CSV)
  // ----------------------------------------------------
  const handleExportUsersCSV = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();

    const headers = [
      'Name',
      'Phone Number',
      'Email',
      'Role',
      'Registered On (DD/MM/YYYY hh:mm A)',
      'Current Plan',
      'Plan Status',
      'Plan Expiry (DD/MM/YYYY)',
      'Validity Left (Days)',
    ];

    const rows = users.map((u) => {
      const regDate = formatDDMMYYYYWithTime(u.createdAt);
      const expDate = formatDDMMYYYY(u.planExpiresAt);
      const effStatus = (u.effectiveStatus || u.planStatus).toUpperCase();
      const planName = u.planName || (u.daysRemaining && u.daysRemaining > 30 ? 'Yearly Pro Pass' : 'Monthly Unlimited');

      return [
        `"${u.name.replace(/"/g, '""')}"`,
        `"${u.phone || 'N/A'}"`,
        `"${u.email}"`,
        `"${u.role.toUpperCase()}"`,
        `"${regDate}"`,
        `"${planName}"`,
        `"${effStatus}"`,
        `"${expDate}"`,
        `"${u.daysRemaining || 0}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `np_users_report_${day}_${month}_${year}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showFeedback('Exported users to Excel (.csv) successfully.', 'success');
  };

  // ----------------------------------------------------
  // ACTION: DOWNLOAD PRINTABLE PDF REPORT
  // ----------------------------------------------------
  const handleDownloadPdfReport = () => {
    showFeedback('Opening printable PDF report preview...', 'success');
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // ----------------------------------------------------
  // USER ACTIONS: EXTEND, SUSPEND, RESET SESSION
  // ----------------------------------------------------
  const handleExtendValidity = async (userId: string, daysToAdd = 30) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentAdminToken}`,
          'x-admin-email': currentAdminEmail,
        },
        body: JSON.stringify({ userId, action: 'extendValidity', days: daysToAdd }),
      });

      if (res.ok) {
        fetchUsers();
        showFeedback(`Added +${daysToAdd} Day(s) validity`, 'success');
        return;
      }
    } catch (e) {}

    const updated = users.map((u) => {
      if (u._id === userId) {
        const curExp = new Date(u.planExpiresAt);
        const base = curExp > new Date() ? curExp.getTime() : Date.now();
        const newExp = new Date(base + daysToAdd * 24 * 60 * 60 * 1000);
        return {
          ...u,
          planExpiresAt: newExp.toISOString(),
          planStatus: 'active' as const,
          effectiveStatus: 'active' as const,
          daysRemaining: Math.ceil((newExp.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        };
      }
      return u;
    });

    saveUsersLocally(updated);
    showFeedback(`Added +${daysToAdd} Day(s) validity`, 'success');
  };

  const handleToggleSuspend = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentAdminToken}`,
          'x-admin-email': currentAdminEmail,
        },
        body: JSON.stringify({ userId, action: 'setPlanStatus', planStatus: newStatus }),
      });
      if (res.ok) {
        fetchUsers();
        showFeedback(`User status changed to ${newStatus}`, 'success');
        return;
      }
    } catch (e) {}

    const updated = users.map((u) => {
      if (u._id === userId) {
        return {
          ...u,
          planStatus: newStatus as any,
          effectiveStatus: newStatus as any,
        };
      }
      return u;
    });
    saveUsersLocally(updated);
    showFeedback(`User status changed to ${newStatus}`, 'success');
  };

  const handleResetSession = async (userId: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentAdminToken}`,
          'x-admin-email': currentAdminEmail,
        },
        body: JSON.stringify({ userId, action: 'resetSession' }),
      });
      if (res.ok) {
        fetchUsers();
        showFeedback('Active single-device session token purged. User can log in from fresh device.', 'success');
        return;
      }
    } catch (e) {}

    const updated = users.map((u) => {
      if (u._id === userId) {
        return { ...u, currentSessionToken: null, isSessionActive: false };
      }
      return u;
    });
    saveUsersLocally(updated);
    showFeedback('Active device session cleared.', 'success');
  };

  // UTR Actions
  const handleApproveUtr = async (tx: TransactionItem) => {
    try {
      const res = await fetch('/api/admin/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: tx._id,
          action: 'approve',
          adminEmail: currentAdminEmail,
        }),
      });

      if (res.ok) {
        fetchTransactions();
        fetchUsers();
        showFeedback(`Approved UTR ${tx.utrNumber}. Extended +${tx.validityDays} Days for ${tx.userEmail}`, 'success');
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
        return;
      }
    } catch (e) {}

    const updatedTx = transactions.map((t) => {
      if (t._id === tx._id) {
        return { ...t, status: 'success' as const, approvedBy: currentAdminEmail };
      }
      return t;
    });
    setTransactions(updatedTx);
    localStorage.setItem('np_pending_recharges', JSON.stringify(updatedTx));

    const updatedUsers = users.map((u) => {
      if (u.email.toLowerCase() === tx.userEmail.toLowerCase()) {
        const now = new Date();
        const curExp = u.planExpiresAt ? new Date(u.planExpiresAt) : now;
        const base = curExp > now ? curExp.getTime() : now.getTime();
        const newExp = new Date(base + tx.validityDays * 24 * 60 * 60 * 1000);
        return {
          ...u,
          planExpiresAt: newExp.toISOString(),
          planStatus: 'active' as const,
          effectiveStatus: 'active' as const,
          daysRemaining: Math.ceil((newExp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        };
      }
      return u;
    });
    saveUsersLocally(updatedUsers);

    showFeedback(`Approved UTR ${tx.utrNumber}. Extended +${tx.validityDays} Days for ${tx.userEmail}`, 'success');
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
  };

  const handleRejectUtr = async (tx: TransactionItem) => {
    const updatedTx = transactions.map((t) => {
      if (t._id === tx._id) {
        return { ...t, status: 'rejected' as const };
      }
      return t;
    });
    setTransactions(updatedTx);
    localStorage.setItem('np_pending_recharges', JSON.stringify(updatedTx));
    showFeedback(`Rejected UTR ${tx.utrNumber}`, 'error');
  };

  // Add User Submission
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const newUser: AdminUserData = {
      _id: `usr_${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.toLowerCase().trim(),
      phone: newUserPhone.trim(),
      role: newUserRole,
      planStatus: 'active',
      effectiveStatus: 'active',
      planExpiresAt: new Date(Date.now() + newUserDays * 24 * 60 * 60 * 1000).toISOString(),
      currentSessionToken: null,
      isSessionActive: false,
      daysRemaining: newUserDays,
      createdAt: new Date().toISOString(),
    };

    const updated = [newUser, ...users];
    saveUsersLocally(updated);
    setShowAddModal(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPhone('+91 ');
    showFeedback(`Created new user ${newUser.name} with ${newUserDays} Days Validity`, 'success');
  };

  // Filtered lists
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery));
    const effStatus = u.effectiveStatus || u.planStatus;
    const matchesStatus = statusFilter === 'all' || effStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingTransactions = transactions.filter((t) => t.status === 'pending');

  return (
    <div className="w-full min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      
      {/* ---------------------------------------------------- */}
      {/* 1. TOP HEADER & DATABASE SUITE ACTIONS               */}
      {/* ---------------------------------------------------- */}
      <header className="no-print border-b border-neutral-800 bg-neutral-900/95 backdrop-blur px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40">
        
        {/* Left: Branding & Back Button */}
        <div className="flex items-center gap-3">
          {onBackToPortal && (
            <button
              onClick={onBackToPortal}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Portal</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
                <span>NP Super Admin Suite</span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ENTERPRISE
                </span>
              </h1>
              <span className="text-[11px] text-neutral-400 font-mono">
                Date Format: <strong className="text-cyan-400">DD/MM/YYYY</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Center: Tabs */}
        <nav className="flex items-center gap-1 bg-neutral-850 p-1 rounded-lg border border-neutral-750 text-xs">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'users'
                ? 'bg-neutral-900 text-cyan-400 shadow-sm font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Accounts ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors relative ${
              activeTab === 'transactions'
                ? 'bg-neutral-900 text-cyan-400 shadow-sm font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Recharges & UTRs</span>
            {pendingTransactions.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-neutral-950">
                {pendingTransactions.length}
              </span>
            )}
          </button>
        </nav>

        {/* Right: Suite Actions Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          
          {/* Sync Database */}
          <button
            onClick={handleSyncDatabase}
            disabled={isSyncing}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Live connection ping and collection refresh"
          >
            <Database className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : 'text-cyan-400'}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync DB'}</span>
          </button>

          {/* Download Backup (.json) */}
          <button
            onClick={handleDownloadBackup}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="1-click download of full database snapshot"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Backup (.json)</span>
          </button>

          {/* Restore from Backup */}
          <label className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 font-medium flex items-center gap-1.5 transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            <span>Restore</span>
            <input
              ref={restoreInputRef}
              type="file"
              accept=".json"
              onChange={handleSelectRestoreFile}
              className="hidden"
            />
          </label>

          {/* Export to Excel (.csv) */}
          <button
            onClick={handleExportUsersCSV}
            className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export all users to Excel CSV spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.csv)</span>
          </button>

          {/* Download PDF Report */}
          <button
            onClick={handleDownloadPdfReport}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Print or save PDF report"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>PDF Report</span>
          </button>

          {/* Add User */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </header>

      {/* ---------------------------------------------------- */}
      {/* 2. MAIN ADMIN DASHBOARD BODY                         */}
      {/* ---------------------------------------------------- */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
        
        {/* Feedback Alert Toast */}
        {feedbackMessage && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 transition-all ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/50 border-rose-500/40 text-rose-300'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 1: USERS & SINGLE-DEVICE SESSIONS                */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'users' && (
          <>
            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-neutral-400 block">Total Operators</span>
                  <span className="text-2xl font-bold font-mono text-white mt-1 block">{users.length}</span>
                </div>
                <Users className="w-6 h-6 text-neutral-500" />
              </div>

              <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-neutral-400 block">Active Pro Licenses</span>
                  <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
                    {users.filter((u) => (u.effectiveStatus || u.planStatus) === 'active').length}
                  </span>
                </div>
                <CheckCircle2 className="w-6 h-6 text-emerald-500/60" />
              </div>

              <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-neutral-400 block">Expired Accounts</span>
                  <span className="text-2xl font-bold font-mono text-rose-400 mt-1 block">
                    {users.filter((u) => (u.effectiveStatus || u.planStatus) === 'expired').length}
                  </span>
                </div>
                <AlertTriangle className="w-6 h-6 text-rose-500/60" />
              </div>

              <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-neutral-400 block">Online Workstations</span>
                  <span className="text-2xl font-bold font-mono text-cyan-400 mt-1 block">
                    {users.filter((u) => Boolean(u.currentSessionToken)).length}
                  </span>
                </div>
                <Smartphone className="w-6 h-6 text-cyan-500/60" />
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-neutral-400 text-xs">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All Accounts</option>
                  <option value="active">Active Only</option>
                  <option value="expired">Expired Only</option>
                  <option value="suspended">Suspended Only</option>
                </select>
              </div>
            </div>

            {/* USERS TABLE WITH STRICT DD/MM/YYYY FORMAT */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-900/90 text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Operator Name</th>
                      <th className="py-3 px-4">Phone Number</th>
                      <th className="py-3 px-4">Email Address</th>
                      <th className="py-3 px-4">Registered On (DD/MM/YYYY)</th>
                      <th className="py-3 px-4">Current Plan</th>
                      <th className="py-3 px-4">Plan Expiry (DD/MM/YYYY)</th>
                      <th className="py-3 px-4">Validity Left</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/80">
                    {filteredUsers.map((user) => {
                      const effStatus = user.effectiveStatus || user.planStatus;
                      const isOnline = Boolean(user.currentSessionToken);
                      const regFormatted = formatDDMMYYYYWithTime(user.createdAt);
                      const expFormatted = formatDDMMYYYY(user.planExpiresAt);
                      const planTitle = user.planName || (user.daysRemaining && user.daysRemaining > 30 ? 'Yearly Pro Pass' : 'Monthly Unlimited');

                      return (
                        <tr key={user._id} className="hover:bg-neutral-850/50 transition-colors">
                          
                          {/* Name + Role Badge */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              <span>{user.name}</span>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                                  user.role === 'admin'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : user.role === 'master'
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                    : 'bg-neutral-800 text-neutral-400'
                                }`}
                              >
                                {user.role === 'master' ? 'MASTER' : user.role.toUpperCase()}
                              </span>
                            </div>
                          </td>

                          {/* Phone */}
                          <td className="py-3 px-4 font-mono text-[11px] text-neutral-300">
                            {user.phone ? (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-cyan-400" />
                                <span>{user.phone}</span>
                              </span>
                            ) : (
                              <span className="text-neutral-500">—</span>
                            )}
                          </td>

                          {/* Email */}
                          <td className="py-3 px-4 font-mono text-[11px] text-neutral-300">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-neutral-500" />
                              <span>{user.email}</span>
                            </span>
                          </td>

                          {/* Registered On: DD/MM/YYYY hh:mm A */}
                          <td className="py-3 px-4 font-mono text-[11px] text-neutral-300">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-neutral-500" />
                              <span>{regDateOrFallback(user.createdAt)}</span>
                            </span>
                          </td>

                          {/* Current Plan */}
                          <td className="py-3 px-4">
                            <span className="text-neutral-200 font-medium block">
                              {planTitle}
                            </span>
                            <span
                              className={`text-[9px] font-semibold px-2 py-0.2 rounded-full inline-block mt-0.5 ${
                                effStatus === 'active'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                  : effStatus === 'suspended'
                                  ? 'bg-neutral-800 text-neutral-400'
                                  : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {effStatus.toUpperCase()}
                            </span>
                          </td>

                          {/* Plan Expiry: DD/MM/YYYY */}
                          <td className="py-3 px-4 font-mono text-[11px] text-neutral-200">
                            {expFormatted}
                          </td>

                          {/* Validity Left */}
                          <td className="py-3 px-4 font-mono text-[11px]">
                            <span className={`font-bold ${effStatus === 'active' ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {effStatus === 'active' ? `${user.daysRemaining || 0} Days` : '0 Days (Expired)'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Extend 30D */}
                              <button
                                onClick={() => handleExtendValidity(user._id, 30)}
                                className="px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded text-[10px] font-semibold transition-colors cursor-pointer"
                                title="Add +30 Days"
                              >
                                +30D
                              </button>

                              {/* Toggle Suspend */}
                              <button
                                onClick={() => handleToggleSuspend(user._id, user.planStatus)}
                                className={`px-2 py-1 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${
                                  user.planStatus === 'suspended'
                                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                                    : 'bg-neutral-800 text-neutral-400 hover:text-white border-neutral-700'
                                }`}
                                title={user.planStatus === 'suspended' ? 'Unsuspend' : 'Suspend'}
                              >
                                {user.planStatus === 'suspended' ? 'Unsuspend' : 'Suspend'}
                              </button>

                              {/* Reset Session */}
                              <button
                                onClick={() => handleResetSession(user._id)}
                                className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 rounded text-[10px] font-medium transition-colors cursor-pointer"
                                title="Purge single-device active session token"
                              >
                                Reset HW
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 2: RECHARGES & MANUAL UPI UTR VERIFICATION       */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'transactions' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">Payment Requests & UTR Verification</h2>
                <p className="text-xs text-neutral-400">
                  Verify 12-digit UPI Transaction References (UTR) submitted by operators at counter.
                </p>
              </div>

              <button
                onClick={fetchTransactions}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Refresh UTRs</span>
              </button>
            </div>

            <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-900/90 text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Operator / Email</th>
                    <th className="py-3 px-4">Plan Selected</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">UTR Reference</th>
                    <th className="py-3 px-4">Submitted At (DD/MM/YYYY)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Approve / Reject</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80">
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-neutral-850/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-white">
                        <div>{tx.userName || 'Operator'}</div>
                        <div className="text-[10px] text-neutral-400">{tx.userEmail}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-cyan-300">{tx.planName}</span>
                        <span className="text-[10px] text-neutral-400 block">+{tx.validityDays} Days</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-white text-xs">
                        ₹{tx.amount}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-300 text-xs tracking-wider">
                        {tx.utrNumber || tx.razorpayPaymentId || 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-neutral-300">
                        {formatDDMMYYYYWithTime(tx.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            tx.status === 'success'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                              : tx.status === 'pending'
                              ? 'bg-amber-950 text-amber-400 border border-amber-500/30 animate-pulse'
                              : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {tx.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {tx.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApproveUtr(tx)}
                              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleRejectUtr(tx)}
                              className="px-2.5 py-1 bg-neutral-800 hover:bg-rose-950 text-rose-300 border border-neutral-700 rounded text-[11px] transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-neutral-500 font-mono">
                            {tx.approvedBy ? `Approved by ${tx.approvedBy}` : 'Processed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ---------------------------------------------------- */}
      {/* RESTORE CONFIRMATION MODAL                           */}
      {/* ---------------------------------------------------- */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base text-white">Confirm Database Restore</h3>
              </div>
              <button onClick={() => setShowRestoreModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              You are about to restore database state from file: <strong className="text-cyan-400">{restoreFile?.name}</strong>.
            </p>

            <div className="bg-neutral-950/90 border border-neutral-800 rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-400">Users in Backup:</span>
                <span className="font-mono font-bold text-white">{restorePreview?.usersCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Transactions in Backup:</span>
                <span className="font-mono font-bold text-white">{restorePreview?.txnCount}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRestoreModal(false)}
                className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteRestore}
                disabled={isRestoring}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-neutral-950 font-bold rounded-lg text-xs"
              >
                {isRestoring ? 'Restoring...' : 'Confirm & Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* ADD USER MODAL                                       */}
      {/* ---------------------------------------------------- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-cyan-400" />
                <span>Add Operator Account</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Operator / Business Name:</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Verma Cyber Cafe"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Phone Number:</label>
                <input
                  type="text"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Email Address:</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="verma.prints@gmail.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-neutral-400 block mb-1">Role:</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="user">Operator (User)</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1">Initial Validity:</label>
                  <select
                    value={newUserDays}
                    onChange={(e) => setNewUserDays(parseInt(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  >
                    <option value={7}>7 Days (Trial)</option>
                    <option value={30}>30 Days (Pro Pass)</option>
                    <option value={90}>90 Days (Quarterly)</option>
                    <option value={365}>365 Days (Yearly)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold rounded-lg"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function regDateOrFallback(dateInput: any): string {
  if (!dateInput) return formatDDMMYYYYWithTime(new Date());
  return formatDDMMYYYYWithTime(dateInput);
}
