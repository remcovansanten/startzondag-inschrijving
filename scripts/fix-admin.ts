import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('Checking admin users...');
  
  // Check existing admins
  const admins = await prisma.admin.findMany();
  console.log(`Found ${admins.length} admin users`);
  
  if (admins.length > 0) {
    console.log('Existing admins:');
    admins.forEach(admin => {
      console.log(`- Username: ${admin.username}, Created: ${admin.createdAt}`);
    });
  }
  
  // Create or update admin
  const password = process.env.ADMIN_PASSWORD || 'change-this-password';
  console.log(`\nUsing password from env: ${password}`);
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  try {
    const admin = await prisma.admin.upsert({
      where: { username: 'admin' },
      update: {
        passwordHash: hashedPassword,
      },
      create: {
        username: 'admin',
        passwordHash: hashedPassword,
      },
    });
    
    console.log('\nAdmin user created/updated successfully');
    console.log('Username: admin');
    console.log(`Password: ${password}`);
  } catch (error) {
    console.error('Error creating admin:', error);
  }
  
  // Also check tasks
  const taskCount = await prisma.taak.count();
  console.log(`\nTotal tasks in database: ${taskCount}`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });