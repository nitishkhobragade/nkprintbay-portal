/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * app/api/auth/session-check/route.ts
 * Next.js App Router API Route: Session Validation & Plan Validity Enforcement.
 * Checks single-device active sessionToken & subscription expiry.
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    
    // Retrieve sessionToken from Authorization header, request body, or cookies
    const authHeader = req.headers.get('authorization');
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const cookieToken = req.cookies.get('np_session_token')?.value;
    const sessionToken = headerToken || body.sessionToken || cookieToken;

    const email = body.email || req.cookies.get('np_user_email')?.value;

    if (!sessionToken || !email) {
      return NextResponse.json(
        {
          valid: false,
          reason: 'unauthenticated',
          message: 'No active session token found. Please log in.',
        },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return NextResponse.json(
        {
          valid: false,
          reason: 'user_not_found',
          message: 'User account not found.',
        },
        { status: 401 }
      );
    }

    // ----------------------------------------------------
    // CHECK 1: SINGLE-DEVICE SESSION CONFLICT
    // If incoming sessionToken !== user.currentSessionToken in DB:
    // A second login occurred elsewhere or admin cleared the session!
    // ----------------------------------------------------
    if (!user.currentSessionToken || user.currentSessionToken !== sessionToken) {
      return NextResponse.json(
        {
          valid: false,
          reason: 'session_conflict',
          message: 'Logged in from another device. Your session has ended.',
        },
        { status: 403 }
      );
    }

    // ----------------------------------------------------
    // CHECK 2: ACCOUNT SUSPENSION
    // ----------------------------------------------------
    if (user.planStatus === 'suspended') {
      return NextResponse.json(
        {
          valid: false,
          reason: 'suspended',
          message: 'Your account has been suspended by an administrator.',
        },
        { status: 403 }
      );
    }

    // ----------------------------------------------------
    // CHECK 3: SUBSCRIPTION PLAN EXPIRY
    // ----------------------------------------------------
    const now = new Date();
    const expiryDate = new Date(user.planExpiresAt);
    const isPlanExpired = now > expiryDate;

    return NextResponse.json({
      valid: true,
      planActive: !isPlanExpired,
      message: isPlanExpired
        ? 'Subscription Expired. Processing tools are locked until renewed.'
        : 'Session is valid and active.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        planStatus: isPlanExpired ? 'expired' : user.planStatus,
        planExpiresAt: user.planExpiresAt,
        daysRemaining: Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))),
      },
    });
  } catch (error: any) {
    console.error('Session verification error:', error);
    return NextResponse.json(
      { valid: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
