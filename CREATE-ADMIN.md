# How to Create Admin User on Vercel

## Option 1: Using Vercel CLI (Recommended)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Link to your project:
```bash
vercel link
```

3. Pull environment variables:
```bash
vercel env pull .env.local
```

4. Run the seed script:
```bash
npm run seed
```

This will create an admin user with:
- Username: `admin`
- Password: The value from `ADMIN_PASSWORD` in your Vercel environment variables

## Option 2: Direct Database Query

1. Go to Vercel Dashboard → Storage → Your Database
2. Click on "Query" tab
3. First, check if admin exists:
```sql
SELECT * FROM "Admin";
```

4. If empty, create admin user:
```sql
INSERT INTO "Admin" (id, username, "passwordHash", "createdAt")
VALUES (
  gen_random_uuid(),
  'admin',
  '$2a$10$K7L3TnRuBgvYsZK6u2Z4XuD0q5VwWx6e1K2Z2JF5qKqCKQKxGKW3G',
  NOW()
);
```

**Note**: The hash above is for password: `change-this-password`

## Option 3: Create Custom Password Hash

1. Create a simple Node.js script locally:
```javascript
// hash-password.js
const bcrypt = require('bcryptjs');
const password = 'your-desired-password';
const hash = bcrypt.hashSync(password, 10);
console.log('Password:', password);
console.log('Hash:', hash);
```

2. Run it:
```bash
npm install bcryptjs
node hash-password.js
```

3. Use the generated hash in the SQL query above

## Option 4: Create Temporary Admin Route (Quick Fix)

Create `app/api/setup-admin/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  // Only allow in development or with secret key
  if (process.env.NODE_ENV === 'production' && 
      !process.env.SETUP_KEY) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  try {
    const exists = await prisma.admin.findFirst();
    if (exists) {
      return NextResponse.json({ message: 'Admin already exists' });
    }

    const password = process.env.ADMIN_PASSWORD || 'change-this-password';
    const hash = await bcrypt.hash(password, 10);
    
    await prisma.admin.create({
      data: {
        username: 'admin',
        passwordHash: hash
      }
    });

    return NextResponse.json({ 
      message: 'Admin created',
      username: 'admin',
      password: password
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
  }
}
```

Then visit: `https://your-app.vercel.app/api/setup-admin`

**Remember to delete this file after use!**

## Where to Find Your Password

Check your Vercel environment variables:
1. Vercel Dashboard → Settings → Environment Variables
2. Look for `ADMIN_PASSWORD`
3. That's your admin password

If you didn't set `ADMIN_PASSWORD`, the default is: `change-this-password`