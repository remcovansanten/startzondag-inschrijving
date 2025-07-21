import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

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
const wb = XLSX.utils.book_new();

// Create worksheet from data
const ws = XLSX.utils.json_to_sheet(sampleData);

// Set column widths
const colWidths = [
  { wch: 20 }, // Naam
  { wch: 40 }, // Beschrijving
  { wch: 12 }, // MaxAantal
  { wch: 15 }  // Categorie
];
ws['!cols'] = colWidths;

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Taken');

// Write to file
const outputPath = path.join(process.cwd(), 'public', 'template-taken.xlsx');
XLSX.writeFile(wb, outputPath);

console.log(`Excel template created at: ${outputPath}`);
console.log('\nTemplate includes the following columns:');
console.log('- Naam (required): Task name');
console.log('- Beschrijving (optional): Task description');
console.log('- MaxAantal (required): Maximum number of volunteers');
console.log('- Categorie (optional): Task category');