import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = process.env.ADMIN_PASSWORD || 'change-this-password';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: hashedPassword,
    },
  });

  console.log('Admin user created/updated');

  // Create some sample tasks
  const sampleTasks = [
    {
      naam: 'Opbouw tent',
      beschrijving: 'Help mee met het opbouwen van de grote tent',
      maxAantal: 10,
      categorie: 'Opbouw',
    },
    {
      naam: 'Catering team',
      beschrijving: 'Bereid eten voor en bedien de gasten',
      maxAantal: 8,
      categorie: 'Catering',
    },
    {
      naam: 'Parkeren begeleiding',
      beschrijving: 'Begeleid bezoekers naar parkeerplaatsen',
      maxAantal: 5,
      categorie: 'Logistiek',
    },
    {
      naam: 'Registratie balie',
      beschrijving: 'Ontvang gasten en registreer aanwezigheid',
      maxAantal: 4,
      categorie: 'Administratie',
    },
    {
      naam: 'Schoonmaak team',
      beschrijving: 'Houd de locatie schoon tijdens het evenement',
      maxAantal: 6,
      categorie: 'Facilitair',
    },
  ];

  for (const task of sampleTasks) {
    await prisma.taak.create({
      data: task,
    });
  }

  console.log('Sample tasks created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });