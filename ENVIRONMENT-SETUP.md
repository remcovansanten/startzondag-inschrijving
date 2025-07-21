# Environment Variables Setup for Vercel

## Required Environment Variables

You need to add these environment variables in your Vercel dashboard:

### 1. Go to Vercel Dashboard
- Navigate to your project: https://vercel.com/dashboard
- Select "startzondag-inschrijving"
- Go to "Settings" → "Environment Variables"

### 2. Add the following variables:

#### Email Configuration
```
RESEND_API_KEY = re_3LgzhThz_LiR6AXfzA552y2HETVV3XDXZ
EMAIL_FROM = noreply@gkermelo.nl
NEXT_PUBLIC_SITE_URL = https://startzondag-inschrijving.vercel.app
```

#### Security (if not already set)
```
JWT_SECRET = [generate a 32-character random string]
```

You can generate a JWT secret using:
```bash
openssl rand -base64 32
```

### 3. Important Notes

- Make sure to add these for all environments (Production, Preview, Development)
- The `NEXT_PUBLIC_SITE_URL` should match your actual Vercel URL
- If you have a custom domain, update `NEXT_PUBLIC_SITE_URL` accordingly
- The `EMAIL_FROM` address should ideally be from a domain you control

### 4. Email Domain Verification (Optional but Recommended)

For better email deliverability:
1. Go to https://resend.com/domains
2. Add your domain (gkermelo.nl)
3. Follow the DNS verification steps
4. Update `EMAIL_FROM` to use a verified domain

### 5. After Adding Variables

After adding all environment variables:
1. Redeploy your application
2. Test the email functionality by registering for a task

## Testing Email Locally

To test emails locally, create a `.env.local` file with:
```
RESEND_API_KEY=re_3LgzhThz_LiR6AXfzA552y2HETVV3XDXZ
EMAIL_FROM=noreply@gkermelo.nl
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Then run:
```bash
npm run dev
```