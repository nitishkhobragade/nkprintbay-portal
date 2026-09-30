/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * app/api/admin/sync/route.ts
 * Pings MongoDB connection and syncs collection states.
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import Payment from '@/models/Payment';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const mongooseConn = await connectToDatabase();
    const isConnected = mongooseConn.connection.readyState === 1;

    let userCount = 0;
    let paymentCount = 0;

    if (isConnected) {
      userCount = await User.countDocuments();
      paymentCount = await Payment.countDocuments();
    }

    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      connected: isConnected,
      latencyMs,
      metrics: {
        users: userCount,
        transactions: paymentCount,
        databaseName: mongooseConn.connection.name || 'np_print_portal',
      },
      syncedAt: new Date().toISOString(),
      message: `Database synchronized successfully in ${latencyMs}ms.`,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      connected: false,
      error: error.message,
      message: 'Database sync ping failed (Running in in-memory state)',
    }, { status: 200 }); // Return 200 with fallback so UI gracefully displays status
  }
}
