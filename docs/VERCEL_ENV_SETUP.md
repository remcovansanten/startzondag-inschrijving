# Vercel Environment Variables Setup Guide

This guide explains how to configure environment variables directly in Vercel's dashboard for the Startzondag application.

## Overview

Instead of passing environment variables through GitHub Actions, we now use Vercel's built-in environment variable management. This provides:
- Better security
- Easier management
- Environment-specific configurations
- No command-line complexity

## Step 1: Access Project Settings

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `startzondag-inschrijving`
3. Navigate to **Settings** → **Environment Variables**

## Step 2: Configure Environment Variables

Add the following environment variables for each environment:

### Core Variables (All Environments)

| Variable | Description | Preview Value | Production Value |
|----------|-------------|---------------|------------------|
| `DATABASE_URL` | PostgreSQL connection string | Use dev/test database | `postgres://19a91092569789773f3a33c429af4ec70eee7a6cbf162e6e2d7a0cfb28ea7c48:<REDACTED-rotate-in-prisma-console>@db.prisma.io:5432/?sslmode=require` |
| `JWT_SECRET` | JWT signing secret | `dev-jwt-secret-zX9mK3nP5qR8tV2wY6bC4fH7jL0` | `IGoXeYj3rpHFRIFavJD6xX4xjltc028fbhCwGzI7dd0=` |
| `RESEND_API_KEY` | Email API key | `<REDACTED-resend-key-rotated>` | `<REDACTED-resend-key-rotated>` |
| `EMAIL_FROM` | Sender email address | `Startzondag GKE <noreply@gke-startzondag.nl>` | `Startzondag GKE <noreply@gke-startzondag.nl>` |
| `NEXT_PUBLIC_SITE_URL` | Public site URL | Automatic from Vercel | `https://gke-startzondag.nl` |
| `ADMIN_USERNAME` | Admin username | `admin` | `admin` |
| `ADMIN_PASSWORD` | Admin password | `dev-password-123` | `<REDACTED-admin-password-obsolete>` |

### How to Add Variables

1. Click **Add New**
2. Enter the **Key** (variable name)
3. Enter the **Value**
4. Select environments:
   - ✅ **Production** - For production values
   - ✅ **Preview** - For development/test values
   - ✅ **Development** - For local development (optional)
5. Click **Save**

### Important Notes

- **Preview Environment**: Used for all non-production branches (develop, test, staging)
- **Production Environment**: Only used when deploying from `main` branch
- **Sensitive Values**: Vercel automatically encrypts and hides sensitive values
- **NEXT_PUBLIC_* Variables**: These are exposed to the browser, so don't put secrets here

## Step 3: Environment-Specific Configuration

### For Preview Environments
- All branches except `main` will use Preview environment variables
- Each deployment gets a unique URL
- Custom aliases (dev-startzondag.vercel.app, etc.) point to latest preview

### For Production
- Only deployments from `main` branch
- Uses production environment variables
- Deployed to your custom domain

## Step 4: Verify Configuration

After adding all variables:

1. Trigger a new deployment by pushing to GitHub
2. Check the deployment logs in Vercel
3. Verify the application works correctly

## Migration from GitHub Secrets

We've migrated from passing environment variables via GitHub Actions to using Vercel's native environment system. The GitHub secrets are still configured but are no longer used for deployments. They can be kept as backup or removed.

## Troubleshooting

### Database Connection Issues
- Ensure `DATABASE_URL` starts with `postgres://` or `postgresql://`
- Check that the connection string is properly formatted
- Verify SSL mode is included (`?sslmode=require`)

### Environment Variable Not Found
- Ensure variable is added for the correct environment
- Redeploy after adding new variables
- Check for typos in variable names

### Different Values Per Branch
If you need different values for develop/test/staging:
1. Use Preview environment for all non-production
2. Or create separate Vercel projects for each environment
3. Or use branch-specific deployments with custom domains

## Security Best Practices

1. **Never commit secrets** to your repository
2. **Use strong passwords** for production
3. **Rotate secrets regularly**
4. **Limit access** to Vercel project settings
5. **Use different database credentials** for production vs preview if possible