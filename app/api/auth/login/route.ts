/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * app/api/auth/login/route.ts
 * Next.js App Router API Route: User Login & Single-Device Session Enforcement.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password hash
    const inputHash = hashPassword(password);
    if (user.password !== inputHash && user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check account status
    if (user.planStatus === 'suspended') {
      return NextResponse.json(
        { error: 'Account suspended. Please contact administrator.' },
        { status: 403 }
      );
    }

    // ----------------------------------------------------
    // SINGLE-DEVICE ENFORCEMENT:
    // Generate a fresh unique session UUID token.
    // Saving this immediately invalidates any other active device session!
    // ----------------------------------------------------
    const newSessionToken = crypto.randomUUID();
    user.currentSessionToken = newSessionToken;
    await user.save();

    // Check if subscription has expired
    const isExpired = new Date() > new Date(user.planExpiresAt);
    const effectivePlanStatus = isExpired ? 'expired' : user.planStatus;

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        planStatus: effectivePlanStatus,
        planExpiresAt: user.planExpiresAt,
        sessionToken: newSessionToken,
      },
    });

    // Set secure HTTP-only cookie with the sessionToken
    response.cookies.set('np_session_token', newSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    response.cookies.set('np_user_email', user.email, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
