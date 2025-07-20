# Vercel PostgreSQL Setup Guide

## Step 1: Create Vercel Postgres Database

1. Go to your Vercel Dashboard
2. Select your project
3. Go to the "Storage" tab
4. Click "Create Database"
5. Select "Postgres"
6. Choose a name and region
7. Click "Create"

Vercel will automatically add these environment variables:
- `POSTGRES_URL` - Connection string with pooling
- `POSTGRES_PRISMA_URL` - Connection string for Prisma
- `POSTGRES_URL_NON_POOLING` - Direct connection string
- `POSTGRES_USER`, `POSTGRES_HOST`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE`

## Step 2: Update Environment Variables

In your Vercel project settings, add these additional variables:

```env
# Use the Prisma-specific URL that Vercel provides
DATABASE_URL="${POSTGRES_PRISMA_URL}"

# Admin credentials
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="your-secure-password-here"

# Security (generate with: openssl rand -base64 32)
JWT_SECRET="your-32-character-secret-key"

# Email (optional - works without it)
RESEND_API_KEY="re_your_api_key"
EMAIL_FROM="noreply@yourdomain.com"

# Your Vercel URL
NEXT_PUBLIC_SITE_URL="https://your-project.vercel.app"
```

## Step 3: Deploy

1. Push your code to Git
2. Vercel will automatically:
   - Install dependencies
   - Generate Prisma Client
   - Create database tables
   - Build your Next.js app
   - Deploy

## Step 4: Initialize Database

After first deployment, you need to seed the admin user:

### Option A: Using Vercel CLI
```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Link to your project
vercel link

# Pull environment variables
vercel env pull .env.local

# Run seed locally against production DB
npm run seed
```

### Option B: Create Admin via SQL
1. Go to Vercel Dashboard → Storage → Your Database
2. Click "Query" tab
3. Run this SQL:

```sql
-- Create admin user (replace password hash)
INSERT INTO "Admin" (id, username, "passwordHash", "createdAt")
VALUES (
  'clxxxxxxxxxxxxxxx',
  'admin',
  '$2a$10$YourHashedPasswordHere',
  NOW()
);
```

To generate password hash locally:
```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('your-password', 10);
console.log(hash);
```

## Troubleshooting

### "Can't reach database server"
- Make sure you're using `POSTGRES_PRISMA_URL` not `POSTGRES_URL`
- Check if database is in same region as your functions

### "Prisma Client not generated"
- Make sure `postinstall` script is in package.json
- Check build logs for errors

### "Table doesn't exist"
- The `vercel-build` script should create tables automatically
- If not, run `vercel env pull` and `npx prisma db push` locally

## Local Development with Vercel Postgres

1. Pull environment variables:
```bash
vercel env pull .env.local
```

2. Your local app will now use the Vercel Postgres database

## Performance Tips

1. **Connection Pooling**: Already configured via `POSTGRES_PRISMA_URL`
2. **Indexes**: Add indexes for frequently queried fields
3. **Region**: Deploy functions in same region as database
4. **Caching**: Consider adding Redis for session storage

## Monitoring

- Check database metrics in Vercel Dashboard → Storage
- Monitor function logs in Vercel Dashboard → Functions
- Set up alerts for high usage