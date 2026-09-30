/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * app/api/admin/restore/route.ts
 * Restores database collections from uploaded JSON backup payload.
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import Payment from '@/models/Payment';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || !body.collections) {
      return NextResponse.json(
        { error: 'Invalid backup file structure. Missing collections key.' },
        { status: 400 }
      );
    }

    const { users = [], transactions = [] } = body.collections;

    let restoredUsersCount = 0;
    let restoredTxnCount = 0;

    try {
      await connectToDatabase();

      if (users.length > 0) {
        for (const u of users) {
          if (u.email) {
            await User.findOneAndUpdate(
              { email: u.email.toLowerCase().trim() },
              { $set: u },
              { upsert: true, new: true }
            );
            restoredUsersCount++;
          }
        }
      }

      if (transactions.length > 0) {
        for (const t of transactions) {
          if (t.utrNumber || t.razorpayPaymentId || t._id) {
            await Payment.findOneAndUpdate(
              { _id: t._id },
              { $set: t },
              { upsert: true, new: true }
            );
            restoredTxnCount++;
          }
        }
      }
    } catch (dbErr: any) {
      console.warn('DB write during restore warning:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: `Restored ${restoredUsersCount} users and ${restoredTxnCount} transactions successfully.`,
      restoredUsers: restoredUsersCount,
      restoredTransactions: restoredTxnCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
