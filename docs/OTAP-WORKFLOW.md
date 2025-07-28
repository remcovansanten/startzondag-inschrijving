# OTAP Workflow Implementation Guide

This document describes the implemented OTAP (Ontwikkeling, Test, Acceptatie, Productie) workflow for the Startzondag application.

## Overview

The OTAP workflow is designed for a solo developer with AI assistance, providing automated quality gates and streamlined deployment processes.

### Environment Overview

| Environment | Branch | URL | Purpose |
|-------------|--------|-----|---------|
| **Development (O)** | `develop` | `https://dev-startzondag.vercel.app` | Active development |
| **Test (T)** | `test` | `https://test-startzondag.vercel.app` | Automated testing |
| **Acceptance (A)** | `staging` | `https://staging-startzondag.vercel.app` | User acceptance testing |
| **Production (P)** | `main` | `https://startzondag.gk-ermelo.nl` | Live application |

## Quick Start

### 1. Initial Setup

```bash
# Create and checkout develop branch
git checkout -b develop

# Create other environment branches
git checkout -b test
git checkout -b staging

# Return to develop for work
git checkout develop
```

### 2. Development Workflow

```bash
# Work on develop branch
git checkout develop

# Make changes
# ... edit files ...

# AI Review (optional but recommended)
git diff --cached | pbcopy  # Copy changes for Claude review

# Commit changes
git add .
git commit -m "feat: add new feature"

# Push to trigger auto-deployment
git push origin develop
```

### 3. Promotion Flow

#### Automatic Promotion (Develop → Test)
- Happens automatically after successful deployment to development
- No manual intervention required

#### Manual Promotion (Test → Acceptance)
```bash
git checkout staging
git merge test
git push origin staging
```

#### Manual Promotion (Acceptance → Production)
```bash
git checkout main
git merge staging
git push origin main
```

## Environment Configuration

### Local Development

Use `.env.local` with Docker PostgreSQL:
```env
DATABASE_URL="postgresql://startzondag:localdevpassword@localhost:5432/startzondag_dev"
JWT_SECRET="dev-secret-key"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="dev-password"
```

### Environment-Specific Files

- `.env.development` - Development environment
- `.env.test` - Test environment
- `.env.acceptance` - Acceptance environment
- `.env.production` - Production environment

## Quality Gates

### Pre-Commit Hooks (Husky)

Automatically runs on every commit:
- ESLint fixing
- Prettier formatting
- Related tests
- AI review reminder

### GitHub Actions Pipeline

Each push triggers:
1. **Quality Gate**
   - Linting
   - Type checking
   - Unit tests
   - Build verification

2. **Environment Deployment**
   - Automatic for develop/test
   - Manual approval for staging/production

3. **Post-Deployment**
   - E2E tests (test environment)
   - Smoke tests (production)

## Testing Strategy

### Test Types

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests
npm run test
```

### Coverage Requirements

- Development: 60% minimum
- Test: 70% minimum
- Acceptance/Production: 80% minimum

## AI-Assisted Development

### Pre-Commit Review

When committing, you'll see:
```
🤖 Consider asking Claude to review your changes before committing:
📝 git diff --cached | pbcopy  # Copy changes to clipboard
🧠 Then ask Claude: 'Please review this Git diff for potential issues'
```

### Review Checklist for Claude

Ask Claude to check for:
- TypeScript type safety
- React best practices
- Security vulnerabilities
- Performance considerations
- Accessibility compliance
- Database query optimization
- Error handling completeness
- Test coverage gaps

## Deployment Commands

### Manual Deployment (if needed)

```bash
# Deploy to specific environment
vercel --env DATABASE_URL=... --prod

# Check deployment status
vercel ls

# View logs
vercel logs [deployment-url]
```

### Database Management

```bash
# Push schema changes
npm run db:push

# Open Prisma Studio
npm run db:studio

# Run migrations (development only)
npm run db:migrate
```

## Monitoring and Rollback

### Health Checks

- Development: Basic health endpoint
- Test: Automated test results
- Acceptance: User feedback
- Production: Full monitoring

### Rollback Process

1. **Vercel Dashboard**
   - Go to deployments
   - Find previous stable version
   - Click "Promote to Production"

2. **Git Revert**
   ```bash
   git checkout main
   git revert HEAD
   git push origin main
   ```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check `npm run build` locally
   - Verify environment variables
   - Check Vercel build logs

2. **Test Failures**
   - Run tests locally first
   - Check for environment-specific issues
   - Verify test database is clean

3. **Deployment Issues**
   - Verify branch protection rules
   - Check GitHub Actions logs
   - Ensure Vercel tokens are valid

### Getting Help

1. Check build logs in GitHub Actions
2. Review Vercel deployment logs
3. Ask Claude for assistance with specific errors

## Security Notes

- Never commit `.env.local` or environment files
- Rotate production secrets regularly
- Use strong passwords for admin accounts
- Enable 2FA on GitHub and Vercel

## Next Steps

1. Configure Vercel projects for each environment
2. Set up GitHub secrets for deployments
3. Create environment-specific databases
4. Test the complete workflow
5. Document any customizations