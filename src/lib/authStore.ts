/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * src/lib/authStore.ts
 * Real-time Authentication, Single-Device Session Enforcement,
 * and Subscription Validity State Store for NP Print Portal.
 */

import { useState, useEffect, useCallback } from 'react';
import { AdminUserData } from '../../app/admin/page';

export type UserRole = 'admin' | 'user' | 'master';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  planStatus: 'active' | 'expired' | 'suspended';
  planName?: string;
  freePrintsLeft?: number;
  creditsRemaining?: number;
  planExpiresAt: string;
  sessionToken: string;
  daysRemaining: number;
}

const STORAGE_USERS_KEY = 'np_admin_users_db';
const STORAGE_SESSION_KEY = 'np_active_session_data';

// Initial pre-seeded users (Includes Admin credentials requested by user)
export const SEED_USERS: AdminUserData[] = [
  {
    _id: 'usr_admin_nitish',
    name: 'Nitish Khobragade (Admin)',
    email: 'djnitish97@gmail.com',
    phone: '+91 99000 00001',
    role: 'admin',
    planStatus: 'active',
    effectiveStatus: 'active',
    planName: 'Super Admin Lifetime License',
    planExpiresAt: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000).toISOString(),
    currentSessionToken: 'sess_admin_master_token_nitish',
    isSessionActive: true,
    daysRemaining: 3650,
    createdAt: new Date().toISOString(),
    password: 'admin@nk',
  },
  {
    _id: 'usr_operator',
    name: 'Sharma Cyber Prints (Operator)',
    email: 'operator@printshop.in',
    phone: '+91 98765 43210',
    role: 'user',
    planStatus: 'active',
    effectiveStatus: 'active',
    planName: 'Starter Free Trial (Valid 14 Days)',
    planExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    currentSessionToken: 'sess_operator_device_101',
    isSessionActive: true,
    daysRemaining: 14,
    createdAt: new Date().toISOString(),
    password: 'operator@123',
  },
  {
    _id: 'usr_expired',
    name: 'Expired Counter (Demo)',
    email: 'expired.demo@counter.com',
    phone: '+91 91234 56789',
    role: 'user',
    planStatus: 'expired',
    effectiveStatus: 'expired',
    planName: 'Expired Plan',
    planExpiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    currentSessionToken: null,
    isSessionActive: false,
    daysRemaining: 0,
    createdAt: new Date().toISOString(),
    password: 'demo@123',
  }
];

export function getStoredUsers(): AdminUserData[] {
  if (typeof window === 'undefined') return SEED_USERS;
  const raw = localStorage.getItem(STORAGE_USERS_KEY);
  let users: AdminUserData[] = SEED_USERS;
  if (raw) {
    try {
      users = JSON.parse(raw);
    } catch {
      users = SEED_USERS;
    }
  }

  // Ensure Admin user always exists with the requested credentials
  const adminIdx = users.findIndex(
    (u) => u.email.toLowerCase() === 'djnitish97@gmail.com'
  );
  if (adminIdx === -1) {
    users.unshift(SEED_USERS[0]);
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } else {
    // Keep password and role up-to-date
    if (
      users[adminIdx].password !== 'admin@nk' ||
      users[adminIdx].role !== 'admin' ||
      users[adminIdx].planStatus !== 'active'
    ) {
      users[adminIdx].password = 'admin@nk';
      users[adminIdx].role = 'admin';
      users[adminIdx].planStatus = 'active';
      users[adminIdx].effectiveStatus = 'active';
      users[adminIdx].name = 'Nitish Khobragade (Admin)';
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    }
  }

  return users;
}

export function saveStoredUsers(users: AdminUserData[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  // Broadcast update across tabs
  window.dispatchEvent(new Event('np_users_updated'));
}

export function getStoredSession(): SessionUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_SESSION_KEY);
  if (!raw) {
    // Return null when logged out or visiting for the first time!
    // Do NOT auto-login as Admin!
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredSession(session: SessionUser | null) {
  if (typeof window === 'undefined') return;
  if (!session) {
    localStorage.removeItem(STORAGE_SESSION_KEY);
  } else {
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
  }
  window.dispatchEvent(new Event('np_session_updated'));
}
