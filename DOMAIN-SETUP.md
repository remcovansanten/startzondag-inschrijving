# Email Domain Setup - gke-startzondag.nl

## DNS Records to Add

You need to add these DNS records to your domain (gke-startzondag.nl) to verify it with Resend:

### 1. SPF Record
- Type: TXT
- Name: @ (or leave empty for root domain)
- Value: `v=spf1 include:amazonses.com ~all`

### 2. DKIM Records
Resend will provide 3 CNAME records for DKIM. They typically look like:
- Name: `resend._domainkey`
- Name: `resend2._domainkey`  
- Name: `resend3._domainkey`

### 3. Domain Verification
Once DNS records are added, run:
```bash
npx tsx scripts/verify-domain.ts
```

## Update Vercel Environment Variables

After domain verification, update in Vercel dashboard:
```
EMAIL_FROM = Startzondag GKE <noreply@gke-startzondag.nl>
```

## Email Addresses You Can Use

Once verified, you can use any email address with your domain:
- noreply@gke-startzondag.nl (currently configured)
- info@gke-startzondag.nl
- startzondag@gke-startzondag.nl
- Or any other address you prefer

## Benefits of Custom Domain

1. **Better Deliverability**: Emails are less likely to go to spam
2. **Professional Appearance**: Recipients see your domain
3. **No Restrictions**: Can send to any email address (not just your own)
4. **Better Branding**: Consistent with your organization

## Testing

After domain verification and updating Vercel:
1. Register for a task with any email address
2. Check that confirmation emails arrive
3. Check spam folder if needed
4. Monitor Resend dashboard for delivery status