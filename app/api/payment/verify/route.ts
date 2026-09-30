/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * app/api/payment/verify/route.ts
 * Next.js App Router API Route: Verifies Razorpay HMAC Signatures & Manual UPI UTRs.
 * Automatically extends user validity and activates account on success.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db';
import Payment from '@/models/Payment';
import User from '@/models/User';
import { PLANS_CONFIG } from '../create-order/route';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      paymentMethod = 'razorpay',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      planId,
      userEmail,
      userName,
      utrNumber,
      screenshotUrl,
    } = body;

    const plan = PLANS_CONFIG[planId] || PLANS_CONFIG['monthly-199'];
    const email = userEmail?.toLowerCase()?.trim();

    if (!email) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    // ----------------------------------------------------
    // CASE 1: MANUAL UPI RECHARGE SUBMISSION (UTR)
    // ----------------------------------------------------
    if (paymentMethod === 'manual_upi') {
      if (!utrNumber || utrNumber.trim().length < 8) {
        return NextResponse.json(
          { error: 'Valid 12-digit UPI / UTR Transaction ID is required' },
          { status: 400 }
        );
      }

      await connectToDatabase();

      const existingUtr = await Payment.findOne({ utrNumber: utrNumber.trim() });
      if (existingUtr && existingUtr.status === 'success') {
        return NextResponse.json(
          { error: 'This UTR number has already been redeemed' },
          { status: 400 }
        );
      }

      const pendingPayment = await Payment.create({
        userId: email,
        userEmail: email,
        userName: userName || email.split('@')[0],
        planId: plan.id,
        planName: plan.name,
        validityDays: plan.days,
        amount: plan.amountInRupees,
        currency: 'INR',
        paymentMethod: 'manual_upi',
        status: 'pending',
        utrNumber: utrNumber.trim(),
        screenshotUrl: screenshotUrl || null,
      });

      return NextResponse.json({
        success: true,
        message: 'UPI UTR submitted successfully! Admin will verify and activate within 5-10 minutes.',
        payment: pendingPayment,
      });
    }

    // ----------------------------------------------------
    // CASE 2: RAZORPAY PAYMENT VERIFICATION
    // ----------------------------------------------------
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Cryptographic signature check
    let isSignatureValid = false;

    if (keySecret && keySecret !== 'sampleKeySecret' && razorpayOrderId && razorpayPaymentId && razorpaySignature) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      isSignatureValid = generatedSignature === razorpaySignature;
    } else {
      // In sandbox/demo test mode, allow verification with test payment ID
      isSignatureValid = Boolean(razorpayPaymentId && razorpayOrderId);
    }

    if (!isSignatureValid) {
      return NextResponse.json(
        { error: 'Payment signature verification failed' },
        { status: 400 }
      );
    }

    // ----------------------------------------------------
    // AUTOMATED PLAN ACTIVATION & VALIDITY CALCULATION
    // Formula: currentExpiresAt > now ? currentExpiresAt + planDays : now + planDays
    // ----------------------------------------------------
    await connectToDatabase();

    let user = await User.findOne({ email });
    const now = new Date();
    const daysToAdd = plan.days;

    let newExpiryDate: Date;
    if (user && user.planExpiresAt && new Date(user.planExpiresAt) > now) {
      newExpiryDate = new Date(new Date(user.planExpiresAt).getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    } else {
      newExpiryDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    }

    if (user) {
      user.planExpiresAt = newExpiryDate;
      user.planStatus = 'active';
      await user.save();
    } else {
      // Create user if not registered
      user = await User.create({
        name: userName || email.split('@')[0],
        email,
        password: crypto.randomBytes(8).toString('hex'),
        role: 'user',
        planStatus: 'active',
        planExpiresAt: newExpiryDate,
      });
    }

    // Update or log payment record
    const paymentRecord = await Payment.findOneAndUpdate(
      { razorpayOrderId },
      {
        userId: user._id,
        userEmail: email,
        userName: user.name,
        planId: plan.id,
        planName: plan.name,
        validityDays: plan.days,
        amount: plan.amountInRupees,
        paymentMethod: 'razorpay',
        status: 'success',
        razorpayPaymentId,
        razorpaySignature,
      },
      { upsert: true, new: true }
    );

    const daysRemaining = Math.ceil((newExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return NextResponse.json({
      success: true,
      message: `Payment verified! ${plan.name} (+${plan.days} Days) activated successfully.`,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        planStatus: 'active',
        planExpiresAt: newExpiryDate.toISOString(),
        daysRemaining,
      },
      payment: paymentRecord,
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
