import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

async function createTemplate() {
  // Sample data for the template
  const sampleData = [
    {
      Naam: 'Opbouw tent',
      Beschrijving: 'Help mee met het opbouwen van de grote tent',
      MaxAantal: 10,
      Categorie: 'Opbouw'
    },
    {
      Naam: 'Catering team',
      Beschrijving: 'Bereid eten voor en bedien de gasten',
      MaxAantal: 8,
      Categorie: 'Catering'
    },
    {
      Naam: 'Parkeren begeleiding',
      Beschrijving: 'Begeleid bezoekers naar parkeerplaatsen',
      MaxAantal: 5,
      Categorie: 'Logistiek'
    },
    {
      Naam: 'Registratie balie',
      Beschrijving: 'Ontvang gasten en registreer aanwezigheid',
      MaxAantal: 4,
      Categorie: 'Administratie'
    },
    {
      Naam: 'Schoonmaak team',
      Beschrijving: 'Houd de locatie schoon tijdens het evenement',
      MaxAantal: 6,
      Categorie: 'Facilitair'
    }
  ];

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Startzondag Vrijwilligers';
  workbook.created = new Date();

  // Create worksheet
  const worksheet = workbook.addWorksheet('Taken');
  
  // Define columns
  worksheet.columns = [
    { header: 'Naam', key: 'Naam', width: 25 },
    { header: 'Beschrijving', key: 'Beschrijving', width: 50 },
    { header: 'MaxAantal', key: 'MaxAantal', width: 15 },
    { header: 'Categorie', key: 'Categorie', width: 20 }
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Add data
  sampleData.forEach(data => {
    worksheet.addRow(data);
  });

  // Add instructions as comments
  worksheet.getCell('A1').note = 'Verplicht: De naam van de taak';
  worksheet.getCell('B1').note = 'Optioneel: Een beschrijving van de taak';
  worksheet.getCell('C1').note = 'Verplicht: Het maximum aantal vrijwilligers voor deze taak';
  worksheet.getCell('D1').note = 'Optioneel: De categorie van de taak';

  // Write to file
  const outputPath = path.join(process.cwd(), 'public', 'template-taken.xlsx');
  await workbook.xlsx.writeFile(outputPath);

  console.log(`Excel template created at: ${outputPath}`);
  console.log('\nTemplate includes the following columns:');
  console.log('- Naam (required): Task name');
  console.log('- Beschrijving (optional): Task description');
  console.log('- MaxAantal (required): Maximum number of volunteers');
  console.log('- Categorie (optional): Task category');
}

// Run the function
createTemplate().catch(console.error);