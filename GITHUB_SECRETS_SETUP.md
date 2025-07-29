# GitHub Secrets Setup Guide

This guide will help you set up all the required GitHub secrets for the OTAP pipeline.

## Prerequisites

1. **Vercel Account**: You need a Vercel account with a project already created
2. **Vercel Token**: Generate at https://vercel.com/account/tokens
3. **Database URLs**: We'll use the production database from your .env.local

## Step 1: Get Vercel Information

### 1.1 Get your Vercel Token
1. Go to https://vercel.com/account/tokens
2. Click "Create"
3. Name it "GitHub Actions"
4. Copy the token

**I need this from you**: `VERCEL_TOKEN`


### 1.2 Get your Vercel Organization ID and Project ID
1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → General
4. You'll see:
   - Team ID (this is your VERCEL_ORG_ID)
   - Project ID (this is your VERCEL_PROJECT_ID)

**I need these from you**:
- `VERCEL_ORG_ID` (starts with team_)
- `VERCEL_PROJECT_ID` (starts with prj_)

## Step 2: Database Configuration

I'll use the following from your existing configuration:

### Production Database
```
PROD_DATABASE_URL="postgres://19a91092569789773f3a33c429af4ec70eee7a6cbf162e6e2d7a0cfb28ea7c48:sk_gQM2SpF0LwfKZ77AS87sy@db.prisma.io:5432/?sslmode=require"
```

### Development Database
```
DEV_DATABASE_URL="postgres://19a91092569789773f3a33c429af4ec70eee7a6cbf162e6e2d7a0cfb28ea7c48:sk_gQM2SpF0LwfKZ77AS87sy@db.prisma.io:5432/?sslmode=require"
```

### Test Database
**I need this from you**: Do you want to use the same database or create a separate test database?
If same, I'll use the production URL. Otherwise, provide: `TEST_DATABASE_URL`

### Staging Database
**I need this from you**: Do you want to use the same database or create a separate staging database?
If same, I'll use the production URL. Otherwise, provide: `STAGING_DATABASE_URL`

## Step 3: JWT Secrets

I'll use your existing production JWT secret and generate unique ones for other environments:

### Development
```
DEV_JWT_SECRET="dev-jwt-secret-zX9mK3nP5qR8tV2wY6bC4fH7jL0"
```

### Test
```
TEST_JWT_SECRET="test-jwt-secret-aB3dE5gH7jK9mN2pQ4sT6vW8xZ1"
```

### Staging
```
STAGING_JWT_SECRET="staging-jwt-secret-cD4fG6hJ8kL0nP2qS5uV7wX9yB3"
```

### Production (from your .env.local)
```
PROD_JWT_SECRET="IGoXeYj3rpHFRIFavJD6xX4xjltc028fbhCwGzI7dd0="
```

## Step 4: Email Configuration

Using your existing Resend configuration:

### All Environments (using same API key)
```
DEV_RESEND_API_KEY="re_3LgzhThz_LiR6AXfzA552y2HETVV3XDXZ"
TEST_RESEND_API_KEY="re_3LgzhThz_LiR6AXfzA552y2HETVV3XDXZ"
STAGING_RESEND_API_KEY="re_3LgzhThz_LiR6AXfzA552y2HETVV3XDXZ"
PROD_RESEND_API_KEY="re_3LgzhThz_LiR6AXfzA552y2HETVV3XDXZ"
```

## Step 5: Admin Credentials

### Production (from your .env.local)
```
PROD_ADMIN_USERNAME="admin"
PROD_ADMIN_PASSWORD="usYfk*nJy3zfDiW__WU-"
```

### Other Environments
- Dev/Test/Staging: Username "admin", Password "{environment}-password-123"

## Summary of What I Need From You:

1. **Vercel Information**:
   - `VERCEL_TOKEN` (from https://vercel.com/account/tokens)
   - `VERCEL_ORG_ID` (from project settings)
   - `VERCEL_PROJECT_ID` (from project settings)

2. **Database Decision**:
   - Should test/staging use the same database as production? (Yes/No)
   - If no, provide separate database URLs

Once you provide these, I'll update the script to add all secrets to GitHub.