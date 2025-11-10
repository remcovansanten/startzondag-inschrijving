# Environment Variables Setup

This guide covers environment variable configuration for both production (Vercel) and local development.

## Production Environment (Vercel)

### Required Environment Variables

You need to add these environment variables in your Vercel dashboard:

### 1. Go to Vercel Dashboard
- Navigate to your project: https://vercel.com/dashboard
- Select "startzondag-inschrijving"
- Go to "Settings" → "Environment Variables"

### 2. Add the following variables:

#### Email Configuration
```
RESEND_API_KEY = your_resend_api_key_here
EMAIL_FROM = noreply@yourdomain.nl
NEXT_PUBLIC_SITE_URL = https://your-project.vercel.app
```

#### Security (if not already set)
```
JWT_SECRET = [generate a 32-character random string]
```

You can generate a JWT secret using:
```bash
openssl rand -base64 32
```

#### Redis Configuration (Optional - Recommended for Production)
```
UPSTASH_REDIS_REST_URL = https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN = your_redis_token
```

To set up Redis for production rate limiting:
1. Create a free account at https://upstash.com
2. Create a new Redis database
3. Copy the REST URL and REST Token
4. Add them to your Vercel environment variables

**Note:** If Redis is not configured, the application will automatically fall back to in-memory rate limiting (suitable for development but not for production at scale).

### 3. Important Notes

- Make sure to add these for all environments (Production, Preview, Development)
- The `NEXT_PUBLIC_SITE_URL` should match your actual Vercel URL
- If you have a custom domain, update `NEXT_PUBLIC_SITE_URL` accordingly
- The `EMAIL_FROM` address should ideally be from a domain you control

### 4. Email Domain Verification (Optional but Recommended)

For better email deliverability:
1. Go to https://resend.com/domains
2. Add your domain (gkermelo.nl)
3. Follow the DNS verification steps
4. Update `EMAIL_FROM` to use a verified domain

### 5. After Adding Variables

After adding all environment variables:
1. Redeploy your application
2. Test the email functionality by registering for a task

## Local Development Environment

### Complete .env.local Setup

Create a `.env.local` file in your project root with:

```bash
# Database Configuration
# For Docker PostgreSQL (recommended)
DATABASE_URL="postgresql://startzondag:localdevpassword@localhost:5432/startzondag_dev"

# For local PostgreSQL installation
# DATABASE_URL="postgresql://your_user:your_password@localhost:5432/startzondag_dev"

# Admin Credentials
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="your-secure-password"

# Security
JWT_SECRET="generate-a-32-char-secret-using-openssl-rand-base64-32"

# Email Configuration (optional for local dev)
RESEND_API_KEY="your_resend_api_key_here"
EMAIL_FROM="noreply@yourdomain.nl"

# Site URL
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Redis Configuration (optional for local dev)
# Leave these unset to use in-memory rate limiting
# UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
# UPSTASH_REDIS_REST_TOKEN="your_redis_token"
```

### Database Setup with Docker

```bash
# Start PostgreSQL container
docker run --name startzondag-postgres \
  -e POSTGRES_PASSWORD=localdevpassword \
  -e POSTGRES_DB=startzondag_dev \
  -e POSTGRES_USER=startzondag \
  -p 5432:5432 \
  -d postgres:15-alpine

# Push database schema
export DATABASE_URL="postgresql://startzondag:localdevpassword@localhost:5432/startzondag_dev"
npx prisma db push

# Seed with test data
npm run seed
```

### Running the Application

```bash
npm run dev
```

Visit http://localhost:3000 to see the application.