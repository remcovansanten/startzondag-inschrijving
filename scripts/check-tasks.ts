import { prisma } from '../lib/db';

async function main() {
  console.log('Checking tasks in database...\n');
  
  const tasks = await prisma.taak.findMany({
    include: {
      _count: {
        select: { aanmeldingen: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  
  console.log(`Found ${tasks.length} tasks (showing latest 10):\n`);
  
  tasks.forEach((task, index) => {
    console.log(`${index + 1}. ${task.naam}`);
    console.log(`   Category: ${task.categorie || 'None'}`);
    console.log(`   Max: ${task.maxAantal}, Current: ${task._count.aanmeldingen}`);
    console.log(`   Created: ${task.createdAt}`);
    console.log('');
  });
  
  // Check for any registrations
  const registrationCount = await prisma.aanmelding.count();
  console.log(`Total registrations: ${registrationCount}`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });