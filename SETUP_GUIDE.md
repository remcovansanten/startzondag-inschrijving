# Database Migration & Redis Setup Guide

## 🗄️ Database Migration

### Status: ⚠️ Requires Manual Execution

The database migration couldn't be completed in the sandboxed environment due to network restrictions. You'll need to run it in your development or production environment.

### What Changed

The Prisma schema now includes a new `AuditLog` model:

```prisma
model AuditLog {
  id        String   @id @default(cuid())
  adminId   String
  admin     Admin    @relation(fields: [adminId], references: [id], onDelete: Cascade)
  action    String   // "CREATE_TASK", "UPDATE_TASK", "DELETE_TASK", etc.
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
  auditLogs     AuditLog[]  // New relation
}
```

### How to Run Migration

#### Option 1: Development Environment (Recommended)

```bash
# In your local development environment
npm run db:push
```

This will:
- Create the `AuditLog` table
- Add the relation to the `Admin` table
- Create indexes for performance

#### Option 2: Production with Migration History

If you want to maintain migration history:

```bash
# Create a migration
npx prisma migrate dev --name add-audit-log

# Apply to production later
npx prisma migrate deploy
```

### Verification

After running the migration, verify it succeeded:

```bash
# Open Prisma Studio to see the new table
npm run db:studio

# Or check with SQL
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"AuditLog\";"
```

---

## 🔴 Redis Setup for Production Rate Limiting

### Why Redis?

The rate limiter now uses Redis for production environments to:
- **Distribute rate limits** across all serverless instances
- **Persist limits** between cold starts
- **Scale infinitely** without memory concerns
- **Provide analytics** on rate limit hits

### Development vs Production

- **Development**: Automatically uses in-memory fallback (no Redis needed)
- **Production**: Uses Redis for distributed rate limiting (recommended)

---

## 📋 Step-by-Step Redis Setup

### Step 1: Create Upstash Account

1. Visit **https://upstash.com**
2. Sign up with GitHub, Google, or email
3. Verify your email

### Step 2: Create Redis Database

1. Click "**Create Database**"
2. Configure:
   - **Name**: `startzondag-ratelimit` (or your preferred name)
   - **Type**: Regional
   - **Region**: Choose closest to your Vercel region (e.g., `eu-west-1` for Europe)
   - **Eviction**: No eviction (or LRU if needed)
   - **TLS**: Enabled (recommended)

3. Click "**Create**"

### Step 3: Get Credentials

After creation, you'll see:
- **UPSTASH_REDIS_REST_URL**: `https://your-database.upstash.io`
- **UPSTASH_REDIS_REST_TOKEN**: `AXX...` (long token)

Copy both values.

### Step 4: Configure Environment Variables

#### For Local Development (Optional)

Add to `.env.local`:

```bash
# Upstash Redis (Optional for development)
UPSTASH_REDIS_REST_URL="https://your-database.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AXX_YOUR_TOKEN_HERE"
```

#### For Vercel Production (Required)

**Via Vercel CLI:**

```bash
vercel env add UPSTASH_REDIS_REST_URL production
# Paste: https://your-database.upstash.io

vercel env add UPSTASH_REDIS_REST_TOKEN production
# Paste: AXX_YOUR_TOKEN_HERE
```

**Via Vercel Dashboard:**

1. Go to **https://vercel.com/your-team/startzondag-inschrijving**
2. Navigate to **Settings** → **Environment Variables**
3. Add two variables:

   | Variable Name | Value | Environments |
   |--------------|-------|--------------|
   | `UPSTASH_REDIS_REST_URL` | `https://your-database.upstash.io` | Production, Preview |
   | `UPSTASH_REDIS_REST_TOKEN` | `AXX_YOUR_TOKEN_HERE` | Production, Preview |

4. Click **Save**

### Step 5: Redeploy

Trigger a new deployment for the environment variables to take effect:

```bash
# Via Git push (if you have CI/CD)
git push origin main

# Or via Vercel CLI
vercel --prod
```

---

## ✅ Verification

### Test Rate Limiter

After deployment, test that rate limiting works:

```bash
# Test IP rate limit (10 requests per hour)
for i in {1..12}; do
  curl -X POST https://your-domain.vercel.app/api/aanmelden \
    -H "Content-Type: application/json" \
    -d '{"taakId":"test","naam":"Test","email":"test@example.com","telefoon":"0612345678"}'
  echo ""
done

# The 11th request should return:
# {"message":"Te veel aanmeldpogingen. Probeer het over X minuten opnieuw."}
```

### Check Upstash Analytics

1. Go to **Upstash Dashboard**
2. Select your database
3. Navigate to **Analytics** tab
4. You should see:
   - Request counts
   - Rate limit hits
   - Key distribution (should show `ratelimit:ip:*` and `ratelimit:email:*`)

### Check Logs

In Vercel logs, you should see rate limit checks:

```bash
vercel logs --prod
```

Look for successful rate limit validations (no errors about missing Redis).

---

## 🔧 Troubleshooting

### Issue: Rate limiting still uses in-memory

**Symptoms:**
- Rate limits reset between requests
- No data in Upstash Analytics

**Solutions:**
1. Verify environment variables are set in Vercel
2. Check variable names (must be exact: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`)
3. Redeploy after adding variables
4. Check Vercel function logs for Redis connection errors

### Issue: Redis connection errors

**Symptoms:**
- `ECONNREFUSED` or `ETIMEDOUT` errors in logs
- Rate limiting falls back to in-memory

**Solutions:**
1. Verify Upstash database is active (green status in dashboard)
2. Check that TLS is enabled if required
3. Ensure REST URL includes `https://` protocol
4. Test connectivity: `curl https://your-database.upstash.io/ping`

### Issue: Too many rate limit hits

**Symptoms:**
- Users complain about being blocked
- Upstash shows high rate limit rejection rate

**Solutions:**
1. Review rate limits in `lib/rate-limit.ts`:
   - IP: 10 requests/hour
   - Email: 5 requests/hour
2. Adjust limits if needed for your traffic
3. Consider allowlisting trusted IPs
4. Add monitoring/alerting for false positives

---

## 💰 Upstash Pricing

**Free Tier (Perfect for starting):**
- 10,000 commands/day
- 256 MB storage
- 100 MB bandwidth/day

**Pay-as-you-go:**
- $0.2 per 100,000 commands
- $0.25 per GB storage
- $0.15 per GB bandwidth

For this application's typical usage (~500-1000 registrations/day), the free tier should be sufficient.

---

## 🚀 Alternative: Skip Redis for Now

If you want to deploy without Redis initially:

1. **Do nothing** - the application will automatically use in-memory rate limiting
2. Rate limits will work but reset on each serverless function cold start
3. Add Redis later when you need distributed rate limiting

**When to add Redis:**
- High traffic (>1000 requests/day)
- Multiple Vercel instances/regions
- Need accurate rate limiting across all requests
- Want rate limit analytics

---

## 📊 Summary

### What's Required

| Task | Required? | When |
|------|----------|------|
| Database Migration | ✅ **Yes** | Before using audit log feature |
| Redis Setup | ⚠️ Recommended | For production rate limiting |

### Next Steps

1. ✅ Run `npm run db:push` in your development environment
2. ⚠️ Set up Upstash Redis (5-10 minutes)
3. ✅ Add Redis credentials to Vercel
4. ✅ Redeploy
5. ✅ Test rate limiting and audit logging

---

## 📞 Need Help?

If you encounter issues:

1. Check the detailed logs: `vercel logs --prod`
2. Review Prisma migration errors: `npx prisma validate`
3. Test Redis connection: Use Upstash's built-in REST API tester
4. Review the implementation: `lib/rate-limit.ts`, `lib/audit.ts`

All features are backward compatible and will degrade gracefully if not configured.
