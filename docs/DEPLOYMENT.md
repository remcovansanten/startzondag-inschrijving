# Deployment Guide

This guide covers deploying the Startzondag application to production.

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel provides the easiest deployment with automatic HTTPS, global CDN, and seamless Next.js integration.

#### Prerequisites
- Vercel account
- PostgreSQL database (e.g., Vercel Postgres, Supabase, or Neon)
- Resend account for emails
- Custom domain (optional)

#### Steps

1. **Prepare your repository**
   ```bash
   git add .
   git commit -m "chore: Prepare for deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com/new
   - Import your GitLab repository
   - Configure project settings

3. **Set Environment Variables**
   In Vercel dashboard, add:
   ```
   DATABASE_URL=your_postgres_url
   ADMIN_USERNAME=secure_username
   ADMIN_PASSWORD=very_secure_password
   JWT_SECRET=generate_32_char_secret
   RESEND_API_KEY=your_resend_key
   EMAIL_FROM=noreply@yourdomain.com
   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Test your deployment

5. **Set up custom domain (optional)**
   - Go to Settings → Domains
   - Add your domain
   - Update DNS records as instructed

### Option 2: Self-Hosted (VPS/Docker)

For more control over your deployment.

#### Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine AS base

   # Install dependencies only when needed
   FROM base AS deps
   RUN apk add --no-cache libc6-compat
   WORKDIR /app

   COPY package.json package-lock.json ./
   RUN npm ci

   # Rebuild the source code only when needed
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .

   ENV NEXT_TELEMETRY_DISABLED 1

   RUN npx prisma generate
   RUN npm run build

   # Production image
   FROM base AS runner
   WORKDIR /app

   ENV NODE_ENV production
   ENV NEXT_TELEMETRY_DISABLED 1

   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs

   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

   USER nextjs

   EXPOSE 3000

   ENV PORT 3000

   CMD ["node", "server.js"]
   ```

2. **Build and run**
   ```bash
   docker build -t startzondag .
   docker run -p 3000:3000 --env-file .env.production startzondag
   ```

#### Traditional VPS Deployment

1. **Server Requirements**
   - Ubuntu 20.04+ or similar
   - Node.js 18+
   - PostgreSQL
   - Nginx (for reverse proxy)
   - PM2 (for process management)

2. **Setup Steps**
   ```bash
   # Clone repository
   git clone https://gitlab.com/your/repo.git
   cd repo

   # Install dependencies
   npm install

   # Build application
   npm run build

   # Set up environment
   cp .env.example .env
   # Edit .env with production values

   # Run migrations
   npx prisma db push

   # Start with PM2
   pm2 start npm --name "startzondag" -- start
   pm2 save
   pm2 startup
   ```

3. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Database Setup

### PostgreSQL with Prisma Accelerate (Recommended)

1. Create database at https://console.prisma.io
2. Get connection strings:
   - Direct connection URL
   - Accelerate connection URL
3. Use Accelerate URL in production for better performance

### Alternative: Supabase

1. Create project at https://supabase.com
2. Get connection string from Settings → Database
3. Enable connection pooling for production

## Email Configuration

### Resend Setup

1. **Create account** at https://resend.com
2. **Add domain**:
   - Go to Domains → Add Domain
   - Add DNS records as shown
   - Wait for verification
3. **Get API key**:
   - Go to API Keys
   - Create production key
   - Add to environment variables

### Email Domain Best Practices

- Use a subdomain (e.g., mail.yourdomain.com)
- Set up SPF, DKIM, and DMARC records
- Test deliverability before going live

## Post-Deployment Checklist

- [ ] Test registration flow
- [ ] Verify email delivery
- [ ] Test admin login
- [ ] Check rate limiting works
- [ ] Verify HTTPS is enabled
- [ ] Test on mobile devices
- [ ] Monitor error logs
- [ ] Set up backups
- [ ] Configure monitoring (e.g., Sentry)
- [ ] Test edit/cancel links

## Security Hardening

1. **Environment Variables**
   - Use strong, unique passwords
   - Rotate JWT_SECRET regularly
   - Never commit secrets to git

2. **Database**
   - Enable SSL connections
   - Use connection pooling
   - Regular backups
   - Restrict IP access

3. **Application**
   - Keep dependencies updated
   - Enable CORS appropriately
   - Set security headers
   - Monitor for vulnerabilities

## Monitoring

### Recommended Services

- **Logs**: Vercel Analytics, LogRocket
- **Errors**: Sentry, Rollbar
- **Uptime**: UptimeRobot, Pingdom
- **Performance**: Google Analytics, Vercel Analytics

### Health Check Endpoint

Create `/api/health` for monitoring:
```typescript
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: 'ok' });
  } catch {
    return Response.json({ status: 'error' }, { status: 500 });
  }
}
```

## Backup Strategy

1. **Database Backups**
   - Daily automated backups
   - Store in different location
   - Test restore process

2. **Code Backups**
   - Git repository (GitLab)
   - Tag releases
   - Keep deployment history

## Troubleshooting

### Common Issues

1. **"Cannot find module"**
   - Run `npm install`
   - Check `node_modules` in deployment

2. **Database connection errors**
   - Verify DATABASE_URL
   - Check firewall rules
   - Ensure SSL is configured

3. **Email not sending**
   - Verify domain DNS records
   - Check API key is correct
   - Monitor Resend dashboard

4. **Performance issues**
   - Enable Prisma Accelerate
   - Check database indexes
   - Monitor query performance