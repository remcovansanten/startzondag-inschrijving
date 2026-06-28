# Required GitHub Secrets for OTAP Pipeline

Configure these secrets in your GitHub repository settings under Settings → Secrets and variables → Actions.

## Vercel Deployment Secrets

### Core Vercel Secrets
- `VERCEL_TOKEN` - Your Vercel API token (get from https://vercel.com/account/tokens)
- `VERCEL_ORG_ID` - Your Vercel organization ID
- `VERCEL_PROJECT_ID` - Your Vercel project ID

### Database URLs (per environment)
- `DEV_DATABASE_URL` - Development database connection string
- `TEST_DATABASE_URL` - Test database connection string
- `STAGING_DATABASE_URL` - Staging database connection string
- `PROD_DATABASE_URL` - Production database connection string

### JWT Secrets (per environment)
- `DEV_JWT_SECRET` - Development JWT secret (32+ chars)
- `TEST_JWT_SECRET` - Test JWT secret (32+ chars)
- `STAGING_JWT_SECRET` - Staging JWT secret (32+ chars)
- `PROD_JWT_SECRET` - Production JWT secret (32+ chars)

### Email Configuration (per environment)
- `DEV_RESEND_API_KEY` - Development Resend API key
- `TEST_RESEND_API_KEY` - Test Resend API key
- `STAGING_RESEND_API_KEY` - Staging Resend API key
- `PROD_RESEND_API_KEY` - Production Resend API key

## Optional Secrets

### Monitoring and Notifications
- `SLACK_WEBHOOK` - Slack webhook for deployment notifications
- `SENTRY_DSN` - Sentry error tracking DSN
- `DISCORD_WEBHOOK` - Discord webhook for notifications

## How to Add Secrets

1. Go to your GitHub repository
2. Click on Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret with its name and value

## Getting Vercel IDs

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# In your project directory
vercel link

# Get project info
vercel project ls
```

The output will show your VERCEL_ORG_ID and VERCEL_PROJECT_ID.

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Use strong values** for production secrets
3. **Rotate secrets** regularly (every 90 days)
4. **Limit access** to production secrets
5. **Use different values** for each environment

## Example Secret Values

```yaml
# Development (example only - use your own values!)
DEV_DATABASE_URL: postgresql://dev:devpass@localhost:5432/startzondag_dev
DEV_JWT_SECRET: dev-secret-minimum-32-characters-long

# Test
TEST_DATABASE_URL: postgresql://test:testpass@test-db:5432/startzondag_test
TEST_JWT_SECRET: test-secret-minimum-32-characters-long

# Staging
STAGING_DATABASE_URL: postgresql://staging:stagingpass@staging-db:5432/startzondag_staging
STAGING_JWT_SECRET: staging-secret-minimum-32-characters

# Production (use very strong values!)
PROD_DATABASE_URL: postgresql://prod:STRONG_PASS@prod-db:5432/startzondag_prod
PROD_JWT_SECRET: [generate with: openssl rand -base64 32]
```