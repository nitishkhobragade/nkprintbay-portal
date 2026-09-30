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

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  planStatus: 'active' | 'expired' | 'suspended';
  planExpiresAt: string;
  sessionToken: string;
  daysRemaining: number;
}

const STORAGE_USERS_KEY = 'np_admin_users_db';
const STORAGE_SESSION_KEY = 'np_active_session_data';

// Initial pre-seeded users
export const SEED_USERS: AdminUserData[] = [
  {
    _id: 'usr_admin',
    name: 'Super Admin',
    email: 'admin@npportal.com',
    role: 'admin',
    planStatus: 'active',
    effectiveStatus: 'active',
    planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    currentSessionToken: 'sess_admin_master_token',
    isSessionActive: true,
    daysRemaining: 365,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'usr_operator',
    name: 'Sharma Cyber Prints (Operator)',
    email: 'operator@printshop.in',
    role: 'user',
    planStatus: 'active',
    effectiveStatus: 'active',
    planExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    currentSessionToken: 'sess_operator_device_101',
    isSessionActive: true,
    daysRemaining: 14,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'usr_expired',
    name: 'Expired Counter (Demo)',
    email: 'expired.demo@counter.com',
    role: 'user',
    planStatus: 'expired',
    effectiveStatus: 'expired',
    planExpiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    currentSessionToken: null,
    isSessionActive: false,
    daysRemaining: 0,
    createdAt: new Date().toISOString(),
  }
];

export function getStoredUsers(): AdminUserData[] {
  if (typeof window === 'undefined') return SEED_USERS;
  const raw = localStorage.getItem(STORAGE_USERS_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(SEED_USERS));
    return SEED_USERS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return SEED_USERS;
  }
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
    // Default to the active operator user on first launch
    const defaultUser = SEED_USERS[1];
    const initialSession: SessionUser = {
      id: defaultUser._id,
      name: defaultUser.name,
      email: defaultUser.email,
      role: defaultUser.role,
      planStatus: 'active',
      planExpiresAt: defaultUser.planExpiresAt as string,
      sessionToken: defaultUser.currentSessionToken || 'sess_operator_device_101',
      daysRemaining: 14,
    };
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(initialSession));
    return initialSession;
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
