import { prisma } from '../lib/db';

async function main() {
  console.log('Creating sample tasks for production...');
  
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

  let created = 0;
  for (const task of sampleTasks) {
    try {
      await prisma.taak.create({
        data: task,
      });
      created++;
      console.log(`Created task: ${task.naam}`);
    } catch (error) {
      console.log(`Skipped task: ${task.naam} (might already exist)`);
    }
  }

  console.log(`Created ${created} new tasks`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });