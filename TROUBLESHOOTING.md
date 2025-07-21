# Troubleshooting: No Data in Production

## The Issue
You've run `npm run seed` locally, but don't see data in production.

## Common Causes

### 1. Different Databases
Your local environment and Vercel are using DIFFERENT databases:
- Local: The DATABASE_URL in your `.env.local`
- Vercel: The DATABASE_URL in Vercel's environment variables

### 2. Using Prisma Accelerate
You're using Prisma Accelerate (`db.prisma.io`), which might have:
- Connection pooling that takes time to sync
- Different regions causing delays
- Caching issues

## Solutions

### Option 1: Add Data via Admin Panel (Recommended)
1. Go to `https://your-app.vercel.app/admin/login`
2. Login with admin credentials
3. Manually add tasks through the UI

### Option 2: Direct Database Seed
1. Deploy the debug endpoint (already created)
2. Visit `/api/debug` to see database status
3. Create a one-time seed endpoint:

```typescript
// app/api/seed-production/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  // Protect with secret
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  
  if (secret !== 'your-secret-key') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Create tasks directly in production
    const tasks = await prisma.taak.createMany({
      data: [
        { naam: 'Task 1', beschrijving: 'Description', maxAantal: 10, categorie: 'Test' },
        // ... more tasks
      ],
      skipDuplicates: true
    });

    return NextResponse.json({ created: tasks.count });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

Then visit: `https://your-app.vercel.app/api/seed-production?secret=your-secret-key`

### Option 3: Verify Database Connection
Your `.env.local` shows you're using Prisma Accelerate:
```
DATABASE_URL="postgres://...@db.prisma.io:5432/..."
```

This is different from standard Vercel Postgres. Make sure:
1. This is the same URL in Vercel's environment variables
2. The database actually exists and is accessible
3. You're looking at the right deployment

## Quick Check
Run this locally to see what's in YOUR database:
```bash
npx prisma studio
```

This opens a GUI where you can:
1. See if tasks exist
2. Add tasks manually
3. Verify the database connection