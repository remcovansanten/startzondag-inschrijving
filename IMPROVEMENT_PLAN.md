# Comprehensive Codebase Improvement Plan

## Overview
This plan organizes improvements into 5 parallel workstreams that can be executed simultaneously without file conflicts. Each workstream is assigned to a dedicated agent.

---

## 🎯 Execution Strategy

### Parallel Execution Design
Tasks are organized to minimize file conflicts:
- **Different files** = Can run in parallel
- **Same files** = Sequenced within same agent
- **New files only** = Completely parallel safe

### Estimated Total Time
- **Sequential execution:** ~40-50 hours
- **Parallel execution (5 agents):** ~12-16 hours
- **Time savings:** ~70%

---

## 📋 Workstream 1: Security Hardening (CRITICAL)
**Agent:** `security-agent`
**Priority:** 🔴 Critical
**Estimated Time:** 2-3 hours
**Files Modified:** `package.json`, `lib/auth.ts`, `middleware.ts`, `app/api/aanmelden/route.ts`, `next.config.ts`

### Tasks

#### 1.1 Fix Dependency Vulnerabilities
**File:** `package.json`
**Action:**
```bash
npm install next@15.5.6
npm install @playwright/test@1.55.2
npm audit fix
```
**Validation:** Run `npm audit` - should show 0 critical/high vulnerabilities

---

#### 1.2 Remove JWT Secret Fallback
**File:** `lib/auth.ts:4`
**Current:**
```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-min-32-chars';
```
**New:**
```typescript
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error(
    'JWT_SECRET environment variable must be set and at least 32 characters. ' +
    'Generate one with: openssl rand -base64 32'
  );
}
```
**Validation:** Start dev server without JWT_SECRET - should fail with clear error

---

#### 1.3 Add JWT Validation to Middleware
**File:** `middleware.ts:4-16`
**Current:**
```typescript
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin') &&
      !request.nextUrl.pathname.startsWith('/admin/login')) {

    const token = request.cookies.get('auth-token');

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}
```
**New:**
```typescript
import { verifyToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin') &&
      !request.nextUrl.pathname.startsWith('/admin/login')) {

    const token = request.cookies.get('auth-token');

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Verify token is valid and not expired
    const session = await verifyToken(token.value);
    if (!session) {
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('auth-token');
      return response;
    }
  }

  return NextResponse.next();
}
```
**Validation:**
- Login to admin, expire JWT manually, try to access dashboard
- Should redirect to login and clear cookie

---

#### 1.4 Sanitize Error Logging
**File:** `app/api/aanmelden/route.ts:134-138`
**Current:**
```typescript
console.error('Email send error:', {
  message: emailError.message,
  stack: emailError.stack,
  error: emailError,
});
```
**New:**
```typescript
console.error('Email send error:', {
  message: emailError.message,
  statusCode: emailError.statusCode,
  // Don't log stack traces or full error objects in production
  ...(process.env.NODE_ENV === 'development' && { stack: emailError.stack })
});
```
**Also update:** `app/api/aanmelden/route.ts:147` (Registration error logging)
**Validation:** Check logs don't contain sensitive API keys

---

#### 1.5 Add HSTS Header
**File:** `next.config.ts`
**Action:** Add Strict-Transport-Security header
**Current structure:** Check existing config
**Add:**
```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload'
        },
      ],
    },
  ];
}
```
**Validation:** Check response headers in production include HSTS

---

## 📋 Workstream 2: E2E Testing Infrastructure
**Agent:** `e2e-testing-agent`
**Priority:** 🟠 High
**Estimated Time:** 8-10 hours
**Files Created:** All new files in `e2e/` directory (no conflicts)

### Tasks

#### 2.1 Setup E2E Test Infrastructure
**Files to create:**
- `e2e/fixtures/test-data.ts` - Test data factory
- `e2e/helpers/db-helpers.ts` - Database setup/teardown
- `e2e/helpers/auth-helpers.ts` - Login helpers

**Content for `e2e/fixtures/test-data.ts`:**
```typescript
export const testTasks = {
  openTask: {
    naam: 'Test Task - Open',
    beschrijving: 'Test task with availability',
    maxAantal: 5,
    categorie: 'Test Category'
  },
  fullTask: {
    naam: 'Test Task - Full',
    beschrijving: 'Test task that is full',
    maxAantal: 1,
    categorie: 'Test Category'
  }
};

export const testRegistration = {
  naam: 'Test User',
  email: 'test@example.com',
  telefoon: '06-12345678',
  opmerking: 'Test registration'
};

export const testAdmin = {
  username: 'testadmin',
  password: 'test-password-32-chars-minimum'
};
```

---

#### 2.2 Registration Flow Tests
**File:** `e2e/registration.spec.ts`

**Test cases:**
1. ✅ Complete registration flow (form → submit → confirmation)
2. ✅ Form validation (empty fields, invalid email, invalid phone)
3. ✅ Duplicate registration prevention (same email, same task)
4. ✅ Task capacity enforcement (cannot register when full)
5. ✅ Success message and redirect to confirmation page

**Key assertions:**
- Form fields are visible and functional
- Validation errors display correctly
- Database contains registration after submit
- Email is sent (mock or verify Resend call)
- Confirmation page shows correct details

---

#### 2.3 Edit/Cancel Registration Tests
**File:** `e2e/edit-cancel.spec.ts`

**Test cases:**
1. ✅ Access registration via token link
2. ✅ Edit registration details (name, phone, remarks)
3. ✅ Cancel registration (delete)
4. ✅ Invalid token shows error
5. ✅ Token link works from email

**Key assertions:**
- Token-based access works
- Pre-filled form shows existing data
- Updates persist to database
- Cancellation removes from database
- Task capacity updates after cancellation

---

#### 2.4 Admin Authentication Tests
**File:** `e2e/admin-auth.spec.ts`

**Test cases:**
1. ✅ Login with valid credentials
2. ✅ Login with invalid credentials
3. ✅ Protected routes redirect to login
4. ✅ Logout clears session
5. ✅ Session expires after 4 hours (mock time)

**Key assertions:**
- Login form accessible
- Successful login redirects to dashboard
- Failed login shows error
- Cookie is set on success
- Protected pages check authentication

---

#### 2.5 Admin Dashboard Tests
**File:** `e2e/admin-dashboard.spec.ts`

**Test cases:**
1. ✅ Dashboard displays task statistics
2. ✅ Create new task
3. ✅ Edit existing task
4. ✅ Delete task (with confirmation)
5. ✅ View registrations for task
6. ✅ Delete registration
7. ✅ Excel export downloads file

**Key assertions:**
- Stats cards show correct numbers
- Task CRUD operations work
- Registration management works
- Export generates valid Excel file

---

#### 2.6 Concurrent Registration Tests
**File:** `e2e/concurrency.spec.ts`

**Test cases:**
1. ✅ Multiple users registering simultaneously
2. ✅ Task capacity enforced under race conditions
3. ✅ Last registration fails when task becomes full

**Implementation:**
```typescript
test('concurrent registrations respect capacity', async ({ browser }) => {
  // Create task with capacity 3
  // Launch 5 parallel registrations
  // Assert exactly 3 succeed, 2 fail with "task full" error
});
```

---

## 📋 Workstream 3: Unit Testing Expansion
**Agent:** `unit-testing-agent`
**Priority:** 🟠 High
**Estimated Time:** 12-14 hours
**Files Created:** All new files in `__tests__/` directory (no conflicts)

### Tasks

#### 3.1 API Route Tests - Registration
**File:** `__tests__/api/aanmelden.test.ts`

**Test cases:**
1. ✅ Successful registration creates database record
2. ✅ Missing required fields returns 400
3. ✅ Invalid email format returns 400
4. ✅ Invalid phone number returns 400
5. ✅ Duplicate email for same task returns 400
6. ✅ Task full returns 400
7. ✅ Non-existent task returns 404
8. ✅ Rate limit enforcement (10/hour per IP)
9. ✅ Rate limit enforcement (5/hour per email)
10. ✅ Unique token generated for each registration

**Mock dependencies:**
- Prisma client (use in-memory or test database)
- Email sending (mock Resend API)
- Rate limiter (mock or use real implementation)

---

#### 3.2 API Route Tests - Edit/Cancel
**File:** `__tests__/api/wijzig.test.ts`

**Test cases:**
1. ✅ GET with valid token returns registration
2. ✅ GET with invalid token returns 404
3. ✅ PUT updates registration successfully
4. ✅ PUT with invalid data returns 400
5. ✅ DELETE removes registration
6. ✅ DELETE with invalid token returns 404

---

#### 3.3 API Route Tests - Admin Auth
**File:** `__tests__/api/admin/login.test.ts`

**Test cases:**
1. ✅ Valid credentials return JWT token
2. ✅ Invalid username returns 401
3. ✅ Invalid password returns 401
4. ✅ Auto-creates first admin from env vars
5. ✅ Cookie is set with correct attributes (httpOnly, secure)
6. ✅ Token expires after 4 hours

---

#### 3.4 API Route Tests - Task Management
**File:** `__tests__/api/admin/taken.test.ts`

**Test cases:**
1. ✅ Requires authentication
2. ✅ Create task with valid data
3. ✅ Create task with invalid data returns 400
4. ✅ Update task
5. ✅ Delete task (cascades to registrations)
6. ✅ List all tasks with registration counts

---

#### 3.5 Library Tests - Auth
**File:** `__tests__/lib/auth.test.ts`

**Test cases:**
1. ✅ createToken generates valid JWT
2. ✅ verifyToken validates signature
3. ✅ verifyToken rejects expired tokens
4. ✅ verifyToken rejects tampered tokens
5. ✅ JWT_SECRET validation throws if missing
6. ✅ JWT_SECRET validation throws if < 32 chars
7. ✅ Session management (set/get/clear)

---

#### 3.6 Library Tests - Email
**File:** `__tests__/lib/email.test.ts`

**Test cases:**
1. ✅ sendConfirmationEmail formats correctly
2. ✅ Email contains all required info (name, task, link)
3. ✅ Email retries on failure (exponential backoff)
4. ✅ Email fails gracefully if API key missing
5. ✅ Cancellation email sends correctly

**Mock:** Resend API calls

---

#### 3.7 Component Tests - AanmeldForm
**File:** `__tests__/components/AanmeldForm.test.tsx`

**Test cases:**
1. ✅ Renders all form fields
2. ✅ Validates required fields
3. ✅ Validates email format
4. ✅ Validates phone format
5. ✅ Shows loading state on submit
6. ✅ Shows success message
7. ✅ Shows error message
8. ✅ Disables submit during loading

---

## 📋 Workstream 4: Performance Optimization
**Agent:** `performance-agent`
**Priority:** 🟡 Medium
**Estimated Time:** 3-4 hours
**Files Modified:** `app/page.tsx`, `lib/rate-limit.ts`, `app/api/aanmelden/route.ts`, `package.json`

### Tasks

#### 4.1 Implement ISR for Task List
**File:** `app/page.tsx`

**Current:**
```typescript
export const dynamic = 'force-dynamic';

export default async function Home() {
  const taken = await prisma.taak.findMany({...});
  // ...
}
```

**New:**
```typescript
// Remove force-dynamic, add revalidation
export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home() {
  const taken = await prisma.taak.findMany({
    include: {
      _count: {
        select: { aanmeldingen: true }
      }
    },
    orderBy: [
      { categorie: 'asc' },
      { naam: 'asc' }
    ]
  });

  return (
    // ... existing JSX
  );
}
```

**Also add:** On-demand revalidation in registration API
**File:** `app/api/aanmelden/route.ts:142` (after successful registration)
```typescript
import { revalidatePath } from 'next/cache';

// After successful registration
revalidatePath('/');
return NextResponse.json({
  success: true,
  message: 'Aanmelding succesvol',
});
```

**Validation:**
- Homepage serves from cache
- Updates within 60 seconds of registration
- Response time < 100ms (cached) vs ~500ms (database)

---

#### 4.2 Implement Redis Rate Limiter
**Files:** `lib/rate-limit.ts`, `app/api/aanmelden/route.ts`, `package.json`

**Step 1:** Install dependencies
```bash
npm install @upstash/redis @upstash/ratelimit
```

**Step 2:** Create new rate limiter
**File:** `lib/rate-limit.ts` (replace entire file)
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Only use Redis in production, fallback to in-memory for development
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? Redis.fromEnv()
  : undefined;

// IP-based rate limiter: 10 requests per hour
export const ipRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 h"),
      analytics: true,
      prefix: "ratelimit:ip",
    })
  : null;

// Email-based rate limiter: 5 requests per hour
export const emailRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 h"),
      analytics: true,
      prefix: "ratelimit:email",
    })
  : null;

// Fallback in-memory rate limiter for development
const memoryAttempts = new Map<string, { count: number; resetTime: number }>();

export async function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 3600000
): Promise<{ success: boolean; remaining?: number; reset?: number }> {
  // Use Redis in production
  if (ipRateLimiter && identifier.startsWith('ip:')) {
    const result = await ipRateLimiter.limit(identifier);
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset
    };
  }

  if (emailRateLimiter && identifier.startsWith('email:')) {
    const result = await emailRateLimiter.limit(identifier);
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset
    };
  }

  // Fallback to in-memory for development
  const now = Date.now();
  const userAttempts = memoryAttempts.get(identifier);

  if (memoryAttempts.size > 1000) {
    for (const [key, value] of memoryAttempts.entries()) {
      if (value.resetTime < now) {
        memoryAttempts.delete(key);
      }
    }
  }

  if (!userAttempts || userAttempts.resetTime < now) {
    memoryAttempts.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    });
    return { success: true };
  }

  if (userAttempts.count >= maxAttempts) {
    return { success: false, reset: userAttempts.resetTime };
  }

  userAttempts.count++;
  return { success: true };
}

export function getRemainingTime(identifier: string): number {
  const userAttempts = memoryAttempts.get(identifier);
  if (!userAttempts) return 0;

  const remaining = userAttempts.resetTime - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 60000) : 0;
}
```

**Step 3:** Update registration API
**File:** `app/api/aanmelden/route.ts:46-59`
```typescript
// Check rate limit by IP and email
const ipLimit = await checkRateLimit(`ip:${ip}`, 10, 3600000);
const emailLimit = await checkRateLimit(`email:${email}`, 5, 3600000);

if (!ipLimit.success || !emailLimit.success) {
  const resetTime = ipLimit.reset || emailLimit.reset || Date.now();
  const remainingMinutes = Math.ceil((resetTime - Date.now()) / 60000);

  return NextResponse.json(
    {
      message: `Te veel aanmeldpogingen. Probeer het over ${remainingMinutes} minuten opnieuw.`
    },
    { status: 429 }
  );
}
```

**Step 4:** Update environment variables
**Files:** `.env.example`, `.env.development`, `.env.production`
Add:
```bash
# Upstash Redis (for rate limiting in production)
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

**Step 5:** Update documentation
**File:** `docs/ENVIRONMENT-SETUP.md`
Add Redis configuration instructions

**Validation:**
- Rate limiting works in production (Redis)
- Rate limiting works in development (in-memory)
- Limits persist across serverless function instances
- Test: Make 11 requests from same IP → 11th should fail

---

## 📋 Workstream 5: Admin Features & UX
**Agent:** `admin-features-agent`
**Priority:** 🟢 Low
**Estimated Time:** 6-8 hours
**Files Modified:** Admin dashboard files, new Prisma model

### Tasks

#### 5.1 Add Admin Audit Log
**Step 1:** Update Prisma schema
**File:** `prisma/schema.prisma`

Add model:
```prisma
model AuditLog {
  id        String   @id @default(cuid())
  adminId   String
  admin     Admin    @relation(fields: [adminId], references: [id], onDelete: Cascade)
  action    String   // "CREATE_TASK", "DELETE_TASK", "DELETE_REGISTRATION", etc.
  entity    String   // "Taak", "Aanmelding"
  entityId  String?  // ID of affected entity
  details   Json?    // Additional context
  ipAddress String?  // Admin's IP
  userAgent String?  // Admin's browser
  createdAt DateTime @default(now())

  @@index([adminId])
  @@index([createdAt])
  @@index([action])
}

model Admin {
  id            String      @id @default(cuid())
  username      String      @unique
  passwordHash  String
  createdAt     DateTime    @default(now())
  auditLogs     AuditLog[]  // Add this relation
}
```

Run: `npm run db:push`

**Step 2:** Create audit log utility
**File:** `lib/audit.ts` (new file)
```typescript
import { prisma } from '@/lib/db';

export type AuditAction =
  | 'CREATE_TASK'
  | 'UPDATE_TASK'
  | 'DELETE_TASK'
  | 'DELETE_REGISTRATION'
  | 'EXPORT_DATA'
  | 'BULK_UPLOAD';

export async function createAuditLog({
  adminId,
  action,
  entity,
  entityId,
  details,
  ipAddress,
  userAgent,
}: {
  adminId: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        entity,
        entityId,
        details: details ? JSON.parse(JSON.stringify(details)) : undefined,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break operations
  }
}
```

**Step 3:** Add audit logging to admin API routes

**File:** `app/api/admin/taken/route.ts` (CREATE)
Add after successful task creation:
```typescript
import { createAuditLog } from '@/lib/audit';
import { getSession } from '@/lib/auth';

const session = await getSession();
const task = await prisma.taak.create({...});

await createAuditLog({
  adminId: session.id,
  action: 'CREATE_TASK',
  entity: 'Taak',
  entityId: task.id,
  details: { naam: task.naam, maxAantal: task.maxAantal },
  ipAddress: request.headers.get('x-forwarded-for') || undefined,
  userAgent: request.headers.get('user-agent') || undefined,
});
```

**File:** `app/api/admin/taken/[id]/route.ts` (DELETE)
```typescript
await createAuditLog({
  adminId: session.id,
  action: 'DELETE_TASK',
  entity: 'Taak',
  entityId: id,
  details: { naam: task.naam },
});
```

**File:** `app/api/admin/aanmeldingen/[id]/route.ts` (DELETE)
```typescript
await createAuditLog({
  adminId: session.id,
  action: 'DELETE_REGISTRATION',
  entity: 'Aanmelding',
  entityId: id,
  details: { naam: aanmelding.naam, email: aanmelding.email },
});
```

**Step 4:** Create audit log viewer page
**File:** `app/admin/dashboard/audit/page.tsx` (new file)
```typescript
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AuditLogPage() {
  const session = await getSession();
  if (!session) redirect('/admin/login');

  const logs = await prisma.auditLog.findMany({
    include: {
      admin: {
        select: { username: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 100, // Last 100 entries
  });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Audit Log</h1>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Admin
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Entity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(log.createdAt).toLocaleString('nl-NL')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {log.admin.username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {log.entity}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {log.details ? JSON.stringify(log.details) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Step 5:** Add link to audit log in dashboard navigation

---

#### 5.2 Add Search/Filter to Admin Dashboard
**File:** `app/admin/dashboard/page.tsx`

Add client component for search:
**File:** `components/TaskSearch.tsx` (new file)
```typescript
'use client';

import { useState } from 'react';

interface Task {
  id: string;
  naam: string;
  categorie: string | null;
  maxAantal: number;
  _count: { aanmeldingen: number };
}

export default function TaskSearch({ tasks }: { tasks: Task[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = Array.from(
    new Set(tasks.map(t => t.categorie).filter(Boolean))
  );

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.naam.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || task.categorie === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Zoek taken..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">Alle categorieën</option>
          {categories.map(cat => (
            <option key={cat} value={cat!}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Task table here */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full">
          {/* Render filteredTasks */}
        </table>
      </div>
    </div>
  );
}
```

Update dashboard to use this component.

---

#### 5.3 Add Bulk Delete for Registrations
**File:** `app/admin/dashboard/taken/[id]/page.tsx`

Add client component for bulk actions:
**File:** `components/BulkRegistrationActions.tsx` (new file)
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Registration {
  id: string;
  naam: string;
  email: string;
  telefoon: string;
}

export default function BulkRegistrationActions({
  registrations
}: {
  registrations: Registration[]
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const toggleSelectAll = () => {
    if (selected.size === registrations.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(registrations.map(r => r.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`${selected.size} aanmeldingen verwijderen?`)) return;

    setLoading(true);
    try {
      await Promise.all(
        Array.from(selected).map(id =>
          fetch(`/api/admin/aanmeldingen/${id}`, { method: 'DELETE' })
        )
      );
      setSelected(new Set());
      router.refresh();
    } catch (error) {
      alert('Fout bij verwijderen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {selected.size > 0 && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
          <span>{selected.size} geselecteerd</span>
          <button
            onClick={handleBulkDelete}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            {loading ? 'Verwijderen...' : 'Verwijder selectie'}
          </button>
        </div>
      )}

      <table className="min-w-full">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={selected.size === registrations.length}
                onChange={toggleSelectAll}
              />
            </th>
            <th>Naam</th>
            <th>Email</th>
            <th>Telefoon</th>
          </tr>
        </thead>
        <tbody>
          {registrations.map(reg => (
            <tr key={reg.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selected.has(reg.id)}
                  onChange={() => toggleSelect(reg.id)}
                />
              </td>
              <td>{reg.naam}</td>
              <td>{reg.email}</td>
              <td>{reg.telefoon}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

#### 5.4 Update Dependencies (Safe Updates Only)
**File:** `package.json`

Update non-breaking versions:
```bash
npm install @types/react@latest @types/react-dom@latest
npm install @types/node@latest
npm install typescript@latest
npm install @prisma/client@latest prisma@latest
```

**DO NOT UPDATE (breaking changes):**
- ❌ `next@16.x` (major version)
- ❌ `tailwindcss@4.x` (major version)
- ❌ `resend@6.x` (check changelog first)

---

## 🚀 Execution Plan

### Phase 1: Launch Parallel Agents (All at once)
Run all 5 agents simultaneously:

```bash
# Security improvements (2-3 hours)
Agent 1: security-agent

# E2E tests (8-10 hours)
Agent 2: e2e-testing-agent

# Unit tests (12-14 hours)
Agent 3: unit-testing-agent

# Performance (3-4 hours)
Agent 4: performance-agent

# Admin features (6-8 hours)
Agent 5: admin-features-agent
```

### Phase 2: Integration & Validation (2-3 hours)
After all agents complete:
1. Run full test suite: `npm run test`
2. Run E2E tests: `npm run test:e2e`
3. Type check: `npm run type-check`
4. Lint: `npm run lint`
5. Build: `npm run build`
6. Manual testing of critical paths

### Phase 3: Commit & Push (30 minutes)
1. Review all changes
2. Create comprehensive commit message
3. Push to branch: `claude/codebase-analysis-improvements-011CUzQaVDQhm5GVeCnouwkz`

---

## ✅ Success Criteria

### Security
- [ ] No critical/high npm vulnerabilities
- [ ] JWT validation in middleware
- [ ] No hardcoded secrets
- [ ] HSTS header present
- [ ] Sanitized error logs

### Testing
- [ ] ≥80% unit test coverage
- [ ] ≥5 E2E test suites with >20 test cases
- [ ] All tests passing
- [ ] CI/CD pipeline green

### Performance
- [ ] Homepage response < 100ms (cached)
- [ ] ISR revalidation working
- [ ] Redis rate limiter in production
- [ ] No performance regressions

### Features
- [ ] Audit log tracking all admin actions
- [ ] Search/filter in admin dashboard
- [ ] Bulk delete for registrations
- [ ] Dependencies updated (safe versions)

---

## 📊 Risk Assessment

### Low Risk (Safe to proceed)
- ✅ E2E test creation (new files only)
- ✅ Unit test creation (new files only)
- ✅ Audit log (additive feature)
- ✅ Search/filter (UI enhancement)

### Medium Risk (Test thoroughly)
- ⚠️ ISR implementation (changes caching behavior)
- ⚠️ JWT validation in middleware (could break auth)
- ⚠️ Rate limiter replacement (different behavior)

### Mitigation Strategy
- Feature flags for risky changes
- Gradual rollout via OTAP pipeline
- Rollback plan: revert commit
- Monitoring: Check Vercel logs after deployment

---

## 📝 Notes

### File Conflict Matrix
No conflicts expected - each agent works on distinct files:

| Agent | Primary Files |
|-------|---------------|
| Security | `lib/auth.ts`, `middleware.ts`, `next.config.ts` |
| E2E Testing | `e2e/*.spec.ts` (new files) |
| Unit Testing | `__tests__/**/*.test.ts` (new files) |
| Performance | `app/page.tsx`, `lib/rate-limit.ts` |
| Admin Features | `app/admin/**`, `components/Bulk*.tsx`, `lib/audit.ts` |

### Environment Variables Needed
Add to `.env.production`:
```bash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### Database Migrations
Run after schema changes:
```bash
npm run db:push
```

---

## 🎯 Timeline Summary

| Phase | Duration | Parallel? |
|-------|----------|-----------|
| **Phase 1: Parallel Execution** | 12-16 hours | ✅ Yes (5 agents) |
| **Phase 2: Integration** | 2-3 hours | ❌ No |
| **Phase 3: Commit & Push** | 30 min | ❌ No |
| **Total elapsed time** | ~14-20 hours | - |
| **Total effort time** | ~40-50 hours | - |

**Time savings from parallelization: ~65-70%**
