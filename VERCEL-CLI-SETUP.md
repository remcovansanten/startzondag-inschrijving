# Vercel CLI Setup (Alternative Method)

This is an alternative to the Git-based deployment. Use this if you prefer CLI deployment.

## Prerequisites

Install Vercel CLI:
```bash
npm i -g vercel
```

## Step 1: Link Your Project

```bash
vercel link
```

Follow the prompts to:
- Select your Vercel account
- Choose your existing project or create new one

## Step 2: Pull Environment Variables

```bash
vercel env pull .env.development.local
```

This downloads all environment variables from Vercel, including:
- `POSTGRES_PRISMA_URL` (from Vercel Postgres)
- Any other variables you've set

## Step 3: Create DATABASE_URL

Edit `.env.development.local` and add:
```env
DATABASE_URL="${POSTGRES_PRISMA_URL}"
```

Or copy the actual value:
```env
DATABASE_URL="postgres://user:pass@host:5432/db?sslmode=require"
```

## Step 4: Update Build Script (for migrations)

If using migrations instead of db push:

```json
// package.json
"vercel-build": "prisma generate && prisma migrate deploy && next build"
```

## Step 5: Create Initial Migration

```bash
# Generate migration from your schema
npx prisma migrate dev --name init
```

This creates:
- A migration file in `prisma/migrations/`
- Applies it to your database

## Step 6: Seed the Database

```bash
npm run seed
```

## Step 7: Deploy

```bash
vercel deploy
```

For production:
```bash
vercel --prod
```

## Which Method Should You Use?

### Git Push (Our Current Setup)
✅ Simpler
✅ Automatic deployments
✅ No CLI needed
✅ Works with GitLab/GitHub
❌ Less control over deployment

### Vercel CLI (This Guide)
✅ More control
✅ Can pull env vars locally
✅ Better for migrations
✅ Can preview before deploying
❌ More complex
❌ Need to install CLI

## Recommendation

- **For simple projects**: Use Git push (our current setup)
- **For production apps**: Consider CLI + migrations
- **For teams**: Definitely use migrations for database version control