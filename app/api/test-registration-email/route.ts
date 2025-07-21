import { NextRequest, NextResponse } from 'next/server';
import { sendConfirmationEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing registration email...');
    console.log('Environment check:', {
      hasResendKey: !!process.env.RESEND_API_KEY,
      resendKeyStart: process.env.RESEND_API_KEY?.substring(0, 10),
      emailFrom: process.env.EMAIL_FROM,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    });

    const testData = {
      naam: 'Test Vrijwilliger',
      taakNaam: 'Koffie schenken',
      telefoon: '06-12345678',
      email: 'remcovansanten@me.com',
      wijzigLink: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/wijzig/test-token-123`,
    };

    const result = await sendConfirmationEmail('remcovansanten@me.com', testData);

    return NextResponse.json({
      success: true,
      result,
      environment: {
        hasResendKey: !!process.env.RESEND_API_KEY,
        emailFrom: process.env.EMAIL_FROM,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
      }
    });
  } catch (error: any) {
    console.error('Test registration email error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      stack: error.stack,
      environment: {
        hasResendKey: !!process.env.RESEND_API_KEY,
        emailFrom: process.env.EMAIL_FROM,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
      }
    }, { status: 500 });
  }
}