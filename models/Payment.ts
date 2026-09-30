/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * models/Payment.ts
 * MongoDB / Mongoose Schema for Subscription Payments & Manual UPI Recharges.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

export type PaymentMethod = 'razorpay' | 'manual_upi';
export type PaymentStatus = 'success' | 'pending' | 'failed' | 'rejected';

export interface IPayment extends Document {
  userId: string;
  userEmail: string;
  userName: string;
  planId: string;
  planName: string;
  validityDays: number;
  amount: number; // In INR
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  
  // Razorpay Gateway Details
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;

  // Manual UPI / Offline Bank Details
  utrNumber?: string;
  screenshotUrl?: string;
  approvedBy?: string;
  approvedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema<IPayment> = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    planId: {
      type: String,
      required: true,
    },
    planName: {
      type: String,
      required: true,
    },
    validityDays: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'manual_upi'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['success', 'pending', 'failed', 'rejected'],
      default: 'pending',
      index: true,
    },
    razorpayOrderId: {
      type: String,
      default: null,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
      index: true,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
    utrNumber: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    screenshotUrl: {
      type: String,
      default: null,
    },
    approvedBy: {
      type: String,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Payment: Model<IPayment> =
  (mongoose.models && mongoose.models.Payment) ||
  mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;
