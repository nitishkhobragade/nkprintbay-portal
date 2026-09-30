/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * app/api/admin/users/route.ts
 * Next.js App Router API Route: Admin User Management & Validity Control.
 * Protected: Requires requester to have role === 'admin' and active session.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Helper to verify that the requester is an active admin.
 */
async function verifyAdminAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const adminEmail = req.headers.get('x-admin-email');

  if (!token || !adminEmail) {
    return { authorized: false, message: 'Missing admin credentials' };
  }

  await connectToDatabase();
  const adminUser = await User.findOne({ email: adminEmail.toLowerCase().trim() });

  if (!adminUser || adminUser.role !== 'admin') {
    return { authorized: false, message: 'Forbidden: Admin access required' };
  }

  if (adminUser.currentSessionToken !== token) {
    return { authorized: false, message: 'Admin session invalidated or logged in from another device' };
  }

  return { authorized: true, admin: adminUser };
}

// ----------------------------------------------------
// GET /api/admin/users: List all registered users
// ----------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminAuth(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: 403 });
    }

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    const now = new Date();
    const enrichedUsers = users.map((u) => {
      const expiry = new Date(u.planExpiresAt);
      const isExpired = now > expiry;
      const effectiveStatus = u.planStatus === 'suspended' ? 'suspended' : isExpired ? 'expired' : 'active';

      return {
        ...u,
        effectiveStatus,
        isSessionActive: Boolean(u.currentSessionToken),
        daysRemaining: Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      };
    });

    return NextResponse.json({
      success: true,
      count: enrichedUsers.length,
      users: enrichedUsers,
    });
  } catch (error: any) {
    console.error('Admin GET users error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------
// PATCH /api/admin/users: Modify user validity, status, or session
// Actions:
// - extendValidity: { days: 1 | 7 | 30 }
// - toggleStatus: { status: 'active' | 'suspended' }
// - resetSession: clears currentSessionToken
// ----------------------------------------------------
export async function PATCH(req: NextRequest) {
  try {
    const auth = await verifyAdminAuth(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: 403 });
    }

    const body = await req.json();
    const { userId, action, days } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'userId and action are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();

    if (action === 'extendValidity') {
      const addDays = Number(days) || 1;
      const currentExpiry = new Date(targetUser.planExpiresAt);
      // If current expiry is in the past, extend from now; otherwise add to current expiry
      const baseTime = currentExpiry > now ? currentExpiry.getTime() : now.getTime();
      targetUser.planExpiresAt = new Date(baseTime + addDays * 24 * 60 * 60 * 1000);
      if (targetUser.planStatus === 'expired') {
        targetUser.planStatus = 'active';
      }
      await targetUser.save();

      return NextResponse.json({
        success: true,
        message: `Extended validity by +${addDays} day(s) for ${targetUser.email}`,
        user: targetUser,
      });
    }

    if (action === 'toggleStatus') {
      targetUser.planStatus = targetUser.planStatus === 'suspended' ? 'active' : 'suspended';
      if (targetUser.planStatus === 'suspended') {
        // Disconnect immediately on suspension
        targetUser.currentSessionToken = null;
      }
      await targetUser.save();

      return NextResponse.json({
        success: true,
        message: `Account status updated to ${targetUser.planStatus} for ${targetUser.email}`,
        user: targetUser,
      });
    }

    if (action === 'forceResetSession') {
      // ----------------------------------------------------
      // Disconnect Remote Login: Clears token in database.
      // Next time the user's browser checks, it gets rejected!
      // ----------------------------------------------------
      targetUser.currentSessionToken = null;
      await targetUser.save();

      return NextResponse.json({
        success: true,
        message: `Active session token cleared. ${targetUser.email} has been remotely disconnected.`,
        user: targetUser,
      });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin PATCH user error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------
// POST /api/admin/users: Register a new user
// ----------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminAuth(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, role = 'user', validityDays = 30 } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    const expiry = new Date(Date.now() + Number(validityDays) * 24 * 60 * 60 * 1000);
    const hashedPassword = hashPassword(password);

    const newUser = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      planStatus: 'active',
      planExpiresAt: expiry,
      currentSessionToken: null,
    });

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        planStatus: newUser.planStatus,
        planExpiresAt: newUser.planExpiresAt,
      },
    });
  } catch (error: any) {
    console.error('Admin create user error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
