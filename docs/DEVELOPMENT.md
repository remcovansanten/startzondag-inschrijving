# Development Guide

This guide covers the development setup and workflow for the Startzondag application.

## Prerequisites

- Node.js 18.x or higher
- PostgreSQL (for production-like development)
- Git
- A code editor (VS Code recommended)

## Local Development Setup

### 1. Database Setup

You have two options for local development:

#### Option A: SQLite (Simple)
```bash
# Use the default SQLite configuration in .env.local
DATABASE_URL="file:./dev.db"
```

#### Option B: PostgreSQL (Production-like)
```bash
# Install PostgreSQL locally
# Create a database
createdb startzondag_dev

# Update .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/startzondag_dev"
```

### 2. Environment Configuration

```bash
# Copy example environment
cp .env.example .env.local

# Edit .env.local with your settings
# Important: Generate a new JWT_SECRET for security
openssl rand -base64 32
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Database Migration

```bash
# Push schema to database
npx prisma db push

# Seed with test data
npm run seed
```

### 5. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Development Workflow

### Making Changes

1. Create a feature branch
2. Make your changes
3. Run tests: `npm test`
4. Check linting: `npm run lint`
5. Commit with conventional commits

### Database Changes

When modifying the schema:

```bash
# Edit prisma/schema.prisma
# Push changes to development database
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Use Prisma Studio to view data
npx prisma studio
```

### Testing

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Check coverage
npm run test:coverage
```

### Email Development

For local email testing:

1. **Option 1**: Use Resend with a test API key
2. **Option 2**: Use console.log in development
3. **Option 3**: Use a service like MailHog

Update `lib/email.ts` for local testing if needed.

## Common Tasks

### Add a New Task Type

1. Update the seed script in `scripts/seed-tasks.ts`
2. Run `npm run seed:tasks`

### Test Admin Functions

Default admin credentials (development only):
- Username: `admin`
- Password: `change-this-password`

### Debug Database Issues

```bash
# Open Prisma Studio
npx prisma studio

# Reset database
npx prisma db push --force-reset
npm run seed
```

### Performance Testing

1. Seed with many records
2. Use Chrome DevTools Performance tab
3. Check Next.js build analysis: `npm run build`

## Troubleshooting

### "Cannot find module '@prisma/client'"
```bash
npx prisma generate
```

### Database connection errors
- Check PostgreSQL is running
- Verify DATABASE_URL is correct
- Check firewall/network settings

### Email not sending
- Verify RESEND_API_KEY is set
- Check email domain is verified
- Look for errors in console logs

## VS Code Extensions

Recommended extensions:
- Prisma
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin

## Architecture Decisions

### Why Next.js App Router?
- Better performance with React Server Components
- Simplified data fetching
- Built-in layouts and error handling

### Why Prisma?
- Type-safe database queries
- Excellent developer experience
- Easy migrations and schema management

### Why Tailwind CSS?
- Rapid UI development
- Consistent design system
- Small bundle size

## Security Considerations

During development:
- Never commit .env.local
- Use strong passwords even in dev
- Test rate limiting
- Validate all inputs
- Check for SQL injection (Prisma helps)
- Test authentication flows