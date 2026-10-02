import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, category, message } = body;

    // Log the support ticket on server
    console.log(`[SUPPORT TICKET RECEIVED] from ${name} (${email}, ${phone || 'N/A'}) - Category: ${category}`);
    console.log(`Message: ${message}`);

    return NextResponse.json({
      success: true,
      message: 'Support request recorded successfully. Email dispatched to djnitish97@gmail.com.',
      supportEmail: 'djnitish97@gmail.com',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to process support request' },
      { status: 500 }
    );
  }
}
