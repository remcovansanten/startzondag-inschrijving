# Deployment Guide for Vercel

## ⚠️ CRITICAL: Set DATABASE_URL Environment Variable

When Vercel creates a Postgres database, it creates `POSTGRES_PRISMA_URL` but NOT `DATABASE_URL`.
**You MUST manually add DATABASE_URL**:

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Copy the value from `POSTGRES_PRISMA_URL`
3. Create new variable: `DATABASE_URL` with the copied value

Without this, your build will fail with "Environment variable not found: DATABASE_URL"

## Important: Database Considerations

SQLite works great for local development, but **won't work properly on Vercel** or other serverless platforms because:
- Serverless functions don't have persistent file storage
- Each function invocation gets a fresh filesystem
- Your database will be reset on each deployment

## Recommended Solutions

### Option 1: Use PostgreSQL (Recommended for Vercel)

1. **Use Vercel Postgres** (easiest):
   - Go to your Vercel dashboard
   - Add Vercel Postgres to your project
   - It will automatically add the DATABASE_URL

2. **Update your schema.prisma**:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. **Update your dependencies**:
   ```bash
   npm uninstall @prisma/client prisma
   npm install @prisma/client prisma
   ```

4. **Push your schema**:
   ```bash
   npx prisma db push
   ```

### Option 2: Use Supabase (Free PostgreSQL)

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string
5. Add to Vercel environment variables:
   ```
   DATABASE_URL="postgresql://..."
   ```

### Option 3: Use PlanetScale (MySQL)

1. Create account at [planetscale.com](https://planetscale.com)
2. Create database
3. Get connection string
4. Update schema.prisma:
   ```prisma
   datasource db {
     provider = "mysql"
     url      = env("DATABASE_URL")
     relationMode = "prisma"
   }
   ```

## Quick Fix for Demo/Testing

If you just need a quick demo and don't mind data loss on each deploy:

1. **Add this to your package.json scripts**:
   ```json
   "vercel-build": "prisma generate && prisma db push && npm run seed && next build"
   ```

2. **Create a minimal seed script** that runs on each build

## Environment Variables for Vercel

Add these in your Vercel project settings:

```env
# For PostgreSQL/MySQL
DATABASE_URL="your-database-connection-string"

# Admin
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="your-secure-password"

# Security
JWT_SECRET="generate-32-char-random-string"

# Email (optional)
RESEND_API_KEY="re_your_key"
EMAIL_FROM="noreply@yourdomain.com"

# Site URL
NEXT_PUBLIC_SITE_URL="https://your-project.vercel.app"
```

## Deployment Steps

1. Push your code to GitLab/GitHub
2. Import project in Vercel
3. Add environment variables
4. Choose PostgreSQL/MySQL as database
5. Deploy

## Alternative: Deploy on VPS

For SQLite to work properly, deploy on a VPS (Virtual Private Server) where files persist:
- DigitalOcean Droplet
- Linode
- Hetzner
- AWS EC2

This way you can keep using SQLite without issues.