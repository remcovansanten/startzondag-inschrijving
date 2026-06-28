# Development Guide

This guide covers the development setup and workflow for the Startzondag application.

## Prerequisites

- Node.js 18.x or higher
- Docker (recommended) OR PostgreSQL installed locally
- Git
- A code editor (VS Code recommended)

## Quick Start

```bash
# 1. Clone the repository
git clone https://gitlab.com/remcovansanten/startzondag-inschrijving.git
cd startzondag-inschrijving

# 2. Install dependencies
npm install

# 3. Start PostgreSQL with Docker
docker run --name startzondag-postgres \
  -e POSTGRES_PASSWORD=localdevpassword \
  -e POSTGRES_DB=startzondag_dev \
  -e POSTGRES_USER=startzondag \
  -p 5432:5432 \
  -d postgres:15-alpine

# 4. Create .env.local (see Environment Configuration below)

# 5. Push database schema
export DATABASE_URL="postgresql://startzondag:localdevpassword@localhost:5432/startzondag_dev"
npx prisma db push

# 6. Seed database
npm run seed

# 7. Start development server
npm run dev
```

## Local Development Setup

### 1. Database Setup

For local development, you have several options for PostgreSQL:

#### Option 1: Docker PostgreSQL (Recommended)
```bash
# Start PostgreSQL container
docker run --name startzondag-postgres \
  -e POSTGRES_PASSWORD=localdevpassword \
  -e POSTGRES_DB=startzondag_dev \
  -e POSTGRES_USER=startzondag \
  -p 5432:5432 \
  -d postgres:15-alpine

# Database URL for .env.local
DATABASE_URL="postgresql://startzondag:localdevpassword@localhost:5432/startzondag_dev"
```

#### Option 2: Local PostgreSQL Installation
```bash
# macOS with Homebrew
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb startzondag_dev

# Database URL for .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/startzondag_dev"
```

#### Managing Docker PostgreSQL
```bash
# Stop the database
docker stop startzondag-postgres

# Start it again
docker start startzondag-postgres

# Remove it completely
docker rm -f startzondag-postgres

# View logs
docker logs startzondag-postgres
```

### 2. Environment Configuration

Create a `.env.local` file with the following:

```bash
# Local Development Database (using Docker)
DATABASE_URL="postgresql://startzondag:localdevpassword@localhost:5432/startzondag_dev"

# Admin Credentials
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="your-secure-password"

# Security (generate a new secret)
JWT_SECRET="$(openssl rand -base64 32)"

# Email Service (optional for local dev)
RESEND_API_KEY="your_resend_api_key"
EMAIL_FROM="noreply@yourdomain.nl"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Database Migration

```bash
# Push schema to database
# Note: You need to export DATABASE_URL or use dotenv-cli
export DATABASE_URL="postgresql://startzondag:localdevpassword@localhost:5432/startzondag_dev"
npx prisma db push

# Seed with test data
npm run seed

# Alternative: Use dotenv-cli (if installed)
npx dotenv -e .env.local -- npx prisma db push
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