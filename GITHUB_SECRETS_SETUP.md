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
PROD_DATABASE_URL="YOUR_PRODUCTION_DATABASE_URL_HERE"
```

### Development Database
```
DEV_DATABASE_URL="YOUR_DEVELOPMENT_DATABASE_URL_HERE"
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
DEV_JWT_SECRET="GENERATE_A_SECURE_DEV_JWT_SECRET"
```

### Test
```
TEST_JWT_SECRET="GENERATE_A_SECURE_TEST_JWT_SECRET"
```

### Staging
```
STAGING_JWT_SECRET="GENERATE_A_SECURE_STAGING_JWT_SECRET"
```

### Production
```
PROD_JWT_SECRET="GENERATE_A_SECURE_PRODUCTION_JWT_SECRET"
```

## Step 4: Email Configuration

Using your existing Resend configuration:

### All Environments
```
DEV_RESEND_API_KEY="YOUR_DEV_RESEND_API_KEY"
TEST_RESEND_API_KEY="YOUR_TEST_RESEND_API_KEY"
STAGING_RESEND_API_KEY="YOUR_STAGING_RESEND_API_KEY"
PROD_RESEND_API_KEY="YOUR_PRODUCTION_RESEND_API_KEY"
```

## Step 5: Admin Credentials

### Production
```
PROD_ADMIN_USERNAME="admin"
PROD_ADMIN_PASSWORD="YOUR_SECURE_PRODUCTION_PASSWORD"
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