/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * app/api/admin/backup/route.ts
 * Generates a full downloadable JSON backup of users, transactions, and portal state.
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import Payment from '@/models/Payment';

export async function GET(req: NextRequest) {
  try {
    let usersData: any[] = [];
    let transactionsData: any[] = [];

    try {
      await connectToDatabase();
      usersData = await User.find({}).lean();
      transactionsData = await Payment.find({}).lean();
    } catch (e) {
      console.warn('DB read fallback during backup generation:', e);
    }

    const now = new Date();
    // Format DD/MM/YYYY
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateFormatted = `${day}_${month}_${year}`;

    const backupPayload = {
      app: 'NP Job Portal / NP Print Portal',
      version: '2.5.0',
      exportedAt: now.toISOString(),
      formattedDate: `${day}/${month}/${year}`,
      totalUsers: usersData.length,
      totalTransactions: transactionsData.length,
      collections: {
        users: usersData,
        transactions: transactionsData,
      },
    };

    const fileName = `np_print_portal_backup_${dateFormatted}.json`;

    return new NextResponse(JSON.stringify(backupPayload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
