import { prisma } from '../lib/db';

// Admins loggen in via magic link (allowlist ADMIN_EMAILS) — er worden geen
// admin-wachtwoorden meer geseed.
async function main() {

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

  // Check if tasks already exist
  const existingTasks = await prisma.taak.count();
  
  if (existingTasks === 0) {
    console.log('No tasks found, creating sample tasks...');
    
    for (const task of sampleTasks) {
      await prisma.taak.create({
        data: task,
      });
    }
    
    console.log(`${sampleTasks.length} sample tasks created`);
  } else {
    console.log(`${existingTasks} tasks already exist, skipping task creation`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });