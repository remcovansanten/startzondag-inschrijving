import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const taskCount = await prisma.taak.count();
    const adminCount = await prisma.admin.count();
    const registrationCount = await prisma.aanmelding.count();
    
    // Get database URL (hide sensitive parts)
    const dbUrl = process.env.DATABASE_URL || 'not set';
    const urlParts = dbUrl.match(/^([^:]+):\/\/([^@]+)@([^/]+)/);
    const maskedUrl = urlParts 
      ? `${urlParts[1]}://***@${urlParts[3]}` 
      : 'invalid format';
    
    return NextResponse.json({
      database: {
        url: maskedUrl,
        connected: true,
      },
      counts: {
        tasks: taskCount,
        admins: adminCount,
        registrations: registrationCount,
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasAdminPassword: !!process.env.ADMIN_PASSWORD,
        hasJwtSecret: !!process.env.JWT_SECRET,
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      error: 'Database connection failed',
      message: error.message,
      database: {
        url: process.env.DATABASE_URL ? 'set but failed' : 'not set',
      }
    }, { status: 500 });
  }
}