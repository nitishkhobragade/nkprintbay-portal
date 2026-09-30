/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * app/api/admin/transactions/route.ts
 * Next.js App Router API Route: List & Approve Payment Transactions / Manual UTRs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Payment from '@/models/Payment';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const payments = await Payment.find().sort({ createdAt: -1 }).limit(50).lean();

    return NextResponse.json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error: any) {
    console.error('Admin GET transactions error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentId, action, adminEmail = 'admin@npportal.com' } = body;

    if (!paymentId || !action) {
      return NextResponse.json(
        { error: 'paymentId and action are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (action === 'approve') {
      payment.status = 'success';
      payment.approvedBy = adminEmail;
      payment.approvedAt = new Date();
      await payment.save();

      // Extend user validity in database
      const user = await User.findOne({ email: payment.userEmail.toLowerCase().trim() });
      if (user) {
        const now = new Date();
        const curExp = user.planExpiresAt ? new Date(user.planExpiresAt) : now;
        const base = curExp > now ? curExp.getTime() : now.getTime();
        user.planExpiresAt = new Date(base + payment.validityDays * 24 * 60 * 60 * 1000);
        user.planStatus = 'active';
        await user.save();
      }

      return NextResponse.json({
        success: true,
        message: `Approved UTR ${payment.utrNumber}. Extended +${payment.validityDays} Days for ${payment.userEmail}`,
        payment,
      });
    }

    if (action === 'reject') {
      payment.status = 'rejected';
      payment.approvedBy = adminEmail;
      payment.approvedAt = new Date();
      await payment.save();

      return NextResponse.json({
        success: true,
        message: `Rejected UTR ${payment.utrNumber}`,
        payment,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin PATCH transactions error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
