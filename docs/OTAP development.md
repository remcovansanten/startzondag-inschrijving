# OTAP Technical Specifications
## Startzondag Vrijwilligers Registratie Application

### Version: 1.0.0
### Date: July 29, 2025

---

## 1. Executive Summary

This document outlines the OTAP (Ontwikkeling, Test, Acceptatie, Productie) implementation strategy for the Startzondag volunteer registration application. The recommended approach uses a Git-flow branching strategy with automated CI/CD pipelines and environment-specific configurations.

## 2. Environment Architecture

### 2.1 Environment Overview

| Environment | Purpose | Branch | URL Pattern | Database |
|-------------|---------|---------|-------------|----------|
| **Ontwikkeling (O)** | Active development | `develop` | `https://dev-startzondag.vercel.app` | PostgreSQL Dev |
| **Test (T)** | Automated testing & QA | `test` | `https://test-startzondag.vercel.app` | PostgreSQL Test |
| **Acceptatie (A)** | User acceptance testing | `staging` | `https://staging-startzondag.vercel.app` | PostgreSQL Staging |
| **Productie (P)** | Live application | `main` | `https://startzondag.gk-ermelo.nl` | PostgreSQL Prod |

### 2.2 Infrastructure Requirements

#### Development Environment (O)
- **Hosting**: Vercel Preview Deployment
- **Database**: Supabase/Neon PostgreSQL (Free tier)
- **Storage**: Local file system
- **Email**: Console logging (no actual emails)
- **Monitoring**: Console logs only

#### Test Environment (T)
- **Hosting**: Vercel Preview Deployment
- **Database**: Dedicated PostgreSQL instance
- **Storage**: Vercel Blob Storage
- **Email**: Resend API (test mode)
- **Monitoring**: Basic Vercel Analytics

#### Acceptance Environment (A)
- **Hosting**: Vercel Production Deployment
- **Database**: Production-like PostgreSQL instance
- **Storage**: Vercel Blob Storage
- **Email**: Resend API (limited sending)
- **Monitoring**: Full Vercel Analytics + Error tracking

#### Production Environment (P)
- **Hosting**: Vercel Production Deployment
- **Database**: High-availability PostgreSQL
- **Storage**: Vercel Blob Storage
- **Email**: Resend API (full functionality)
- **Monitoring**: Full observability stack

## 3. Git Strategy & Branching Model

### 3.1 Branch Structure

```
main (Production)
├── staging (Acceptance)
├── test (Test)
└── develop (Development)
    ├── feature/volunteer-dashboard
    ├── feature/email-templates
    └── hotfix/urgent-bug-fix
```

### 3.2 Branch Protection Rules (Solo Developer + AI Assistant)

#### Main Branch (Production)
- Require status checks to pass (automated tests + build)
- Require manual deployment approval via GitHub Actions
- Block direct pushes (force promotion workflow)

#### Staging Branch (Acceptance)
- Require status checks to pass
- Allow direct pushes after automated checks
- Manual promotion gate to production

#### Test & Develop Branches
- Require status checks to pass (automated only)
- Allow direct pushes by developer
- Full automation after checks pass

### 3.3 Solo Developer Workflow Process

1. **Feature Development**: Work directly on `develop` or feature branch
2. **AI Code Review**: Use Claude to review code before commits
3. **Auto-Deploy to Dev**: Push to `develop` → Auto-deploy to O environment
4. **Auto-Promote to Test**: Automated promotion after dev checks pass → T environment
5. **Manual Acceptance**: Developer manually promotes to `staging` → A environment
6. **Acceptance Testing**: Testers validate in A environment
7. **Manual Production**: Developer promotes to `main` after acceptance sign-off → P environment

## 4. Environment Configuration

### 4.1 Environment Variables Matrix

| Variable | Development | Test | Acceptance | Production |
|----------|-------------|------|------------|------------|
| `DATABASE_URL` | `postgres://dev_db` | `postgres://test_db` | `postgres://staging_db` | `postgres://prod_db` |
| `NEXT_PUBLIC_SITE_URL` | `https://dev-startzondag.vercel.app` | `https://test-startzondag.vercel.app` | `https://staging-startzondag.vercel.app` | `https://startzondag.gk-ermelo.nl` |
| `JWT_SECRET` | `dev-secret-key` | `test-secret-key` | `staging-secret-key` | `prod-secret-key` |
| `ADMIN_PASSWORD` | `dev-admin-123` | `test-admin-456` | `staging-admin-789` | `secure-prod-password` |
| `RESEND_API_KEY` | `test_key` | `test_key` | `live_key_limited` | `live_key_full` |
| `EMAIL_FROM` | `dev@test.local` | `test@test.local` | `staging@gk-ermelo.nl` | `noreply@gk-ermelo.nl` |
| `NODE_ENV` | `development` | `development` | `production` | `production` |

### 4.2 Database Configuration

#### Development Database
```typescript
// prisma/schema.prisma (development)
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Seeded with test data
```

#### Production Database
```typescript
// Connection pooling and performance optimizations
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // For migrations
}

// Production optimizations:
// - Connection pooling (pgBouncer)
// - Read replicas for reporting
// - Automated backups
// - Point-in-time recovery
```

## 5. CI/CD Pipeline Implementation (Solo Developer Optimized)

### 5.1 GitHub Actions Workflow

```yaml
# .github/workflows/solo-otap.yml
name: Solo Developer OTAP Pipeline

on:
  push:
    branches: [develop, test, staging, main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        default: 'development'
        type: choice
        options:
        - development
        - test
        - acceptance
        - production

jobs:
  # Automated quality checks (replaces human code review)
  quality-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run build
      
  # Auto-deploy to development
  deploy-development:
    needs: quality-gate
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_DEV }}
          
  # Auto-promote to test after development deployment succeeds
  auto-promote-to-test:
    needs: deploy-development
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Auto-merge to test branch
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git checkout test
          git merge develop
          git push origin test
          
  # Auto-deploy to test
  deploy-test:
    needs: quality-gate
    if: github.ref == 'refs/heads/test'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_TEST }}
      - name: Run E2E Tests
        run: npm run test:e2e
        
  # Manual deploy to acceptance (requires developer approval)
  deploy-acceptance:
    needs: quality-gate
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    environment: acceptance  # Requires manual approval
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_STAGING }}
      - name: Notify acceptance testers
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
          -H 'Content-type: application/json' \
          --data '{"text":"🚀 New version ready for acceptance testing: https://staging-startzondag.vercel.app"}'
          
  # Manual deploy to production (requires developer approval + acceptance sign-off)
  deploy-production:
    needs: quality-gate
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production  # Requires manual approval
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_PROD }}
          vercel-args: '--prod'
      - name: Run smoke tests
        run: npm run test:smoke
      - name: Notify production deployment
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
          -H 'Content-type: application/json' \
          --data '{"text":"✅ Production deployment successful: https://startzondag.gk-ermelo.nl"}'
```

### 5.2 AI-Assisted Code Review Process

Instead of traditional pull requests, implement AI-assisted quality checks:

#### Pre-Commit AI Review
```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run automated checks
npm run lint-staged

# Optional: AI code review prompt
echo "🤖 Consider asking Claude to review your changes before committing:"
echo "📝 git diff --cached | pbcopy  # Copy changes to clipboard"
echo "🧠 Then ask Claude: 'Please review this Git diff for potential issues'"
```

#### AI Review Checklist Template
```markdown
## Claude Code Review Checklist

**Code to Review:**
[Paste git diff here]

**Please check for:**
- [ ] TypeScript type safety
- [ ] React best practices
- [ ] Security vulnerabilities
- [ ] Performance considerations
- [ ] Accessibility compliance
- [ ] Database query optimization
- [ ] Error handling completeness
- [ ] Test coverage gaps
- [ ] Documentation needs

**Context:**
- This is for the volunteer registration app
- Focus on: [specific area of concern]
- Users: Church volunteers and admin staff
```

### 5.2 Automated Testing Strategy

#### Unit Tests
```typescript
// __tests__/components/TaskCard.test.tsx
import { render, screen } from '@testing-library/react'
import TaskCard from '@/components/TaskCard'

describe('TaskCard', () => {
  it('shows correct available spots', () => {
    render(<TaskCard task={mockTask} />)
    expect(screen.getByText('3 van 5 plekken beschikbaar')).toBeInTheDocument()
  })
})
```

#### Integration Tests
```typescript
// __tests__/api/aanmelden.test.ts
import { createMocks } from 'node-mocks-http'
import handler from '@/app/api/aanmelden/route'

describe('/api/aanmelden', () => {
  it('creates new registration', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { naam: 'Test User', email: 'test@example.com' }
    })
    
    await handler(req, res)
    expect(res._getStatusCode()).toBe(201)
  })
})
```

#### E2E Tests (Playwright)
```typescript
// e2e/volunteer-registration.spec.ts
import { test, expect } from '@playwright/test'

test('volunteer can register for task', async ({ page }) => {
  await page.goto('/aanmelden/1')
  await page.fill('[data-testid="naam"]', 'Jan de Vries')
  await page.fill('[data-testid="email"]', 'jan@example.com')
  await page.click('[data-testid="submit"]')
  
  await expect(page.locator('[data-testid="success"]')).toBeVisible()
})
```

## 6. Deployment Strategy

### 6.1 Vercel Configuration

```javascript
// vercel.json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "regions": ["ams1"],
  "env": {
    "DATABASE_URL": "@database_url",
    "JWT_SECRET": "@jwt_secret"
  },
  "build": {
    "env": {
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  }
}
```

### 6.2 Environment-Specific Deployments

#### Development Deployment
- **Trigger**: Push to `develop` branch
- **Domain**: Auto-generated Vercel URL
- **Database**: Development instance with seed data
- **Features**: Hot reload, debug logging, test emails to console

#### Test Deployment
- **Trigger**: Push to `test` branch
- **Domain**: `test-startzondag.vercel.app`
- **Database**: Clean test instance, reset before each test cycle
- **Features**: Automated testing, staging email delivery

#### Acceptance Deployment
- **Trigger**: Manual promotion from test environment
- **Domain**: `staging-startzondag.vercel.app`
- **Database**: Production-like data volume and structure
- **Features**: Production build, limited email sending, full monitoring

#### Production Deployment
- **Trigger**: Manual promotion with approval workflow
- **Domain**: Custom domain `startzondag.gk-ermelo.nl`
- **Database**: High-availability production instance
- **Features**: Full functionality, monitoring, alerting, backups

## 7. Quality Assurance Process (Solo Developer + Acceptance Testers)

### 7.1 Testing Phases

#### Development Phase (O) - Developer Responsibility
- **AI-Assisted Code Review**: Claude reviews all significant changes
- **Automated Testing**: Unit test coverage > 80%
- **TypeScript Strict Mode**: Zero type errors allowed
- **ESLint + Prettier**: Automated code formatting and quality
- **Self-Testing**: Developer validates core functionality

#### Test Phase (T) - Automated Validation
- **Automated Integration Tests**: API endpoints and database operations
- **Cross-Browser Testing**: Automated Playwright tests (Chrome, Firefox, Safari)
- **Mobile Responsiveness**: Automated viewport testing
- **Performance Benchmarking**: Lighthouse CI integration
- **Security Scanning**: Automated dependency vulnerability checks

#### Acceptance Phase (A) - Human Testers
- **User Acceptance Testing**: Church staff validate real-world scenarios
- **Accessibility Testing**: Manual keyboard navigation and screen reader testing
- **Load Testing**: Simulated volunteer registration rush scenarios
- **Content Validation**: Verify Dutch language and church-specific terminology
- **Admin Workflow Testing**: Complete admin panel functionality validation

#### Production Phase (P) - Monitoring
- **Smoke Tests**: Automated post-deployment validation
- **Real-Time Monitoring**: Performance and error tracking
- **User Feedback**: Integration with feedback collection
- **Analytics**: Usage patterns and conversion tracking

### 7.2 Acceptance Testing Process

#### Tester Onboarding
```markdown
# Acceptance Testing Guide for Church Staff

## Access Information
- **Test Environment**: https://staging-startzondag.vercel.app
- **Admin Login**: [provided separately]
- **Test Period**: [dates]
- **Feedback Method**: [Slack channel/email]

## Test Scenarios
1. **Volunteer Registration Flow**
   - Browse available tasks
   - Register for a task
   - Receive confirmation
   - Modify registration
   - Cancel registration

2. **Admin Management Flow**
   - Login to admin panel
   - View dashboard statistics
   - Manage task details
   - Export registration data
   - Send communications

## Reporting Issues
- **Critical**: Blocks core functionality
- **High**: Impacts user experience
- **Medium**: Minor inconvenience
- **Low**: Cosmetic or enhancement

## Sign-off Criteria
- [ ] All critical and high issues resolved
- [ ] Admin staff comfortable with interface
- [ ] Volunteer flow tested by 3+ people
- [ ] Performance acceptable on mobile devices
```

### 7.3 AI-Assisted Quality Gates

#### Pre-Development Claude Consultation
```typescript
// Example AI consultation workflow
const claudeReviewPoints = [
  "Architecture decisions for new features",
  "Database schema changes review",
  "Security implications assessment",
  "Performance optimization strategies",
  "Accessibility compliance verification",
  "Error handling completeness",
  "Test strategy validation"
]
```

#### Automated Quality Metrics
```typescript
// quality-metrics.config.js
module.exports = {
  coverage: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80
  },
  performance: {
    firstContentfulPaint: 1500,
    largestContentfulPaint: 2500,
    cumulativeLayoutShift: 0.1
  },
  accessibility: {
    wcagLevel: 'AA',
    colorContrast: 4.5,
    keyboardNavigation: true
  }
}
```

### 7.2 Test Data Management

```typescript
// scripts/seed-test-data.ts
export const testDataSets = {
  development: {
    tasks: generateTasks(10),
    registrations: generateRegistrations(50),
    admins: [devAdmin]
  },
  test: {
    tasks: generateTasks(5),
    registrations: generateRegistrations(20),
    admins: [testAdmin]
  },
  staging: {
    tasks: productionTasks,
    registrations: anonymizedProdData,
    admins: [stagingAdmin]
  }
}
```

## 8. Monitoring & Observability

### 8.1 Application Monitoring

#### Development & Test
- Console logging
- Basic error tracking
- Performance metrics via Vercel Analytics

#### Acceptance & Production
- **APM**: Vercel Analytics Pro
- **Error Tracking**: Sentry integration
- **Uptime Monitoring**: UptimeRobot or Pingdom
- **Log Aggregation**: Vercel Function Logs

### 8.2 Database Monitoring

```typescript
// lib/monitoring.ts
export const dbMetrics = {
  connectionPool: {
    active: () => prisma.$metrics.gauge('db_connections_active'),
    idle: () => prisma.$metrics.gauge('db_connections_idle')
  },
  queryPerformance: {
    slowQueries: () => prisma.$metrics.histogram('db_query_duration')
  }
}
```

## 9. Security Considerations

### 9.1 Environment-Specific Security

#### Development
- Local HTTPS for testing
- Mock authentication
- Test email credentials

#### Test/Acceptance
- Real SSL certificates
- Limited admin access
- Staging email domains

#### Production
- Production SSL certificates
- Multi-factor authentication for admins
- Production email verification
- Rate limiting and DDoS protection

### 9.2 Secret Management

```bash
# Environment variables per environment
# Development
DATABASE_URL=postgres://localhost:5432/startzondag_dev
JWT_SECRET=dev-secret-32-chars-minimum

# Test
DATABASE_URL=postgres://test-db:5432/startzondag_test
JWT_SECRET=test-secret-32-chars-minimum

# Staging
DATABASE_URL=${STAGING_DATABASE_URL}
JWT_SECRET=${STAGING_JWT_SECRET}

# Production
DATABASE_URL=${PROD_DATABASE_URL}
JWT_SECRET=${PROD_JWT_SECRET}
```

## 10. Rollback Strategy

### 10.1 Automated Rollback Triggers
- HTTP 5xx error rate > 5%
- Response time > 2000ms for 5 minutes
- Database connection failures
- Critical functionality failures

### 10.2 Manual Rollback Process
1. **Immediate**: Revert Vercel deployment to previous version
2. **Database**: Restore from point-in-time backup if needed
3. **Monitoring**: Verify system health post-rollback
4. **Communication**: Notify stakeholders of rollback

## 11. Performance Benchmarks

### 11.1 Target Metrics per Environment

| Metric | Development | Test | Acceptance | Production |
|--------|-------------|------|------------|------------|
| Page Load Time | < 3s | < 2s | < 1.5s | < 1s |
| API Response Time | < 1s | < 500ms | < 300ms | < 200ms |
| Database Query Time | < 500ms | < 200ms | < 100ms | < 50ms |
| Uptime | 95% | 98% | 99% | 99.9% |

### 11.2 Load Testing Parameters

```typescript
// Load testing configuration
export const loadTestConfig = {
  development: {
    users: 10,
    duration: '1m'
  },
  test: {
    users: 50,
    duration: '5m'
  },
  acceptance: {
    users: 100,
    duration: '10m'
  },
  production: {
    users: 200,
    duration: '15m'
  }
}
```

## 12. Maintenance Windows

### 12.1 Scheduled Maintenance

#### Development
- Daily automated deployments
- Database schema updates as needed
- No scheduled downtime

#### Test
- Weekly data refresh
- Bi-weekly dependency updates
- 1-hour maintenance window

#### Acceptance
- Monthly security updates
- Quarterly platform updates
- 2-hour maintenance window

#### Production
- Monthly security patches
- Quarterly feature releases
- 4-hour scheduled maintenance window (off-peak hours)

## 13. Implementation Timeline

### Phase 1: Infrastructure Setup (Week 1-2)
- Set up Vercel projects for each environment
- Configure databases and environment variables
- Implement basic CI/CD pipeline

### Phase 2: Development Environment (Week 2-3)
- Configure development workflow
- Set up local development environment
- Implement automated testing

### Phase 3: Test Environment (Week 3-4)
- Deploy test environment
- Configure automated testing pipeline
- Implement quality gates

### Phase 4: Acceptance Environment (Week 4-5)
- Deploy staging environment
- User acceptance testing setup
- Performance optimization

### Phase 5: Production Deployment (Week 5-6)
- Production environment setup
- Security hardening
- Go-live preparation

## 14. Success Criteria

### Technical Success Metrics
- Zero production incidents during first month
- 99.9% uptime achievement
- Sub-200ms API response times
- 100% automated test coverage for critical paths

### Business Success Metrics
- Successful volunteer registration for Startzondag event
- Admin panel adoption by church staff
- Zero data loss incidents
- Positive user feedback scores

---

**Document Version**: 1.0.0  
**Last Updated**: July 29, 2025  
**Next Review**: August 29, 2025