import { prisma } from '../lib/db';

async function main() {
  const admins = await prisma.admin.findMany();
  console.log('Admin users:', admins);
  console.log('Total admins:', admins.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());