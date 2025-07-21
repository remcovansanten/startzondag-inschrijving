import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function GET() {
  const hasApiKey = !!process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || 'not set';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'not set';
  
  let testResult = null;
  
  if (hasApiKey) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const result = await resend.emails.send({
        from: emailFrom === 'not set' ? 'Startzondag GKE <onboarding@resend.dev>' : emailFrom,
        to: 'remcovansanten@me.com',
        subject: 'Test Email from Startzondag API',
        html: `
          <div>
            <h1>Email Configuration Test</h1>
            <p>This is a test email sent from the API endpoint.</p>
            <p>Time: ${new Date().toISOString()}</p>
            <p>Environment: ${process.env.NODE_ENV}</p>
          </div>
        `
      });
      testResult = { success: true, id: result.data?.id };
    } catch (error: any) {
      testResult = { 
        success: false, 
        error: error.message,
        statusCode: error.statusCode
      };
    }
  }
  
  return NextResponse.json({
    emailConfig: {
      hasApiKey,
      apiKeyLength: process.env.RESEND_API_KEY?.length || 0,
      emailFrom,
      siteUrl,
      environment: process.env.NODE_ENV
    },
    testResult
  });
}