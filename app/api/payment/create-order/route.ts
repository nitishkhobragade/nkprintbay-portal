/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * app/api/payment/create-order/route.ts
 * Next.js App Router API Route: Creates Razorpay Checkout Orders.
 */

import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db';
import Payment from '@/models/Payment';
import User from '@/models/User';

export const PLANS_CONFIG: Record<string, { id: string; name: string; amountInRupees: number; days: number }> = {
  'daily-29': {
    id: 'daily-29',
    name: 'Daily Pass',
    amountInRupees: 29,
    days: 1,
  },
  'monthly-199': {
    id: 'monthly-199',
    name: 'Monthly Pro',
    amountInRupees: 199,
    days: 30,
  },
  'yearly-999': {
    id: 'yearly-999',
    name: 'Yearly VIP',
    amountInRupees: 999,
    days: 365,
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId, userId, userEmail, userName } = body;

    const plan = PLANS_CONFIG[planId];
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    const amountInPaise = plan.amountInRupees * 100;
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_NPPrintPortalDemo';
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    let orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Try Razorpay official SDK if live/test secret key is provided
    if (keySecret && keySecret !== 'sampleKeySecret' && keySecret.length > 5) {
      try {
        const instance = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });

        const rzpOrder = await instance.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `rcpt_${Date.now()}`,
          notes: {
            planId: plan.id,
            userEmail,
            validityDays: String(plan.days),
          },
        });

        orderId = rzpOrder.id;
      } catch (err: any) {
        console.warn('Razorpay SDK order call failed, using sandbox fallback order:', err.message);
      }
    }

    // Persist pending order to Database
    try {
      await connectToDatabase();
      await Payment.create({
        userId: userId || 'anonymous_user',
        userEmail: userEmail.toLowerCase().trim(),
        userName: userName || userEmail.split('@')[0],
        planId: plan.id,
        planName: plan.name,
        validityDays: plan.days,
        amount: plan.amountInRupees,
        currency: 'INR',
        paymentMethod: 'razorpay',
        status: 'pending',
        razorpayOrderId: orderId,
      });
    } catch (dbErr) {
      console.warn('Database logging warning:', dbErr);
    }

    return NextResponse.json({
      success: true,
      orderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId,
      plan: {
        id: plan.id,
        name: plan.name,
        days: plan.days,
        amount: plan.amountInRupees,
      },
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
