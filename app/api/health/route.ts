import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: {
      configured: !!process.env.DATABASE_URL,
      type: process.env.DATABASE_URL?.includes('prisma.io') ? 'Prisma Accelerate' : 'Standard PostgreSQL'
    },
    checks: {}
  };

  // Check database connection
  try {
    const startTime = Date.now();
    const taskCount = await prisma.taak.count();
    const duration = Date.now() - startTime;
    
    results.checks.database = {
      status: 'ok',
      taskCount,
      responseTime: `${duration}ms`
    };
  } catch (error: any) {
    results.checks.database = {
      status: 'error',
      error: error.message,
      code: error.code
    };
  }

  // Check admin exists
  try {
    const adminCount = await prisma.admin.count();
    results.checks.admin = {
      status: adminCount > 0 ? 'ok' : 'warning',
      count: adminCount
    };
  } catch (error: any) {
    results.checks.admin = {
      status: 'error',
      error: error.message
    };
  }

  // Overall health
  results.healthy = results.checks.database?.status === 'ok';

  return NextResponse.json(results, {
    status: results.healthy ? 200 : 503
  });
}