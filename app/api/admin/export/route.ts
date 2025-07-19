import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    const taken = await prisma.taak.findMany({
      include: {
        aanmeldingen: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { naam: 'asc' }
    });

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Overview sheet
    const overviewData = taken.map(taak => ({
      'Taak': taak.naam,
      'Categorie': taak.categorie || '',
      'Beschrijving': taak.beschrijving || '',
      'Max Aantal': taak.maxAantal,
      'Aanmeldingen': taak.aanmeldingen.length,
      'Vrije Plekken': taak.maxAantal - taak.aanmeldingen.length,
      'Status': taak.aanmeldingen.length >= taak.maxAantal ? 'Vol' : 'Open'
    }));
    
    const overviewSheet = XLSX.utils.json_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, overviewSheet, 'Overzicht');

    // All registrations sheet
    const allRegistrations = taken.flatMap(taak => 
      taak.aanmeldingen.map(aanmelding => ({
        'Taak': taak.naam,
        'Categorie': taak.categorie || '',
        'Naam': aanmelding.naam,
        'Email': aanmelding.email,
        'Telefoon': aanmelding.telefoon,
        'Opmerking': aanmelding.opmerking || '',
        'Aangemeld op': new Date(aanmelding.createdAt).toLocaleDateString('nl-NL'),
        'Bevestigd': aanmelding.bevestigd ? 'Ja' : 'Nee'
      }))
    );
    
    if (allRegistrations.length > 0) {
      const allSheet = XLSX.utils.json_to_sheet(allRegistrations);
      XLSX.utils.book_append_sheet(wb, allSheet, 'Alle Aanmeldingen');
    }

    // Sheet per task
    taken.forEach(taak => {
      if (taak.aanmeldingen.length > 0) {
        const taskData = taak.aanmeldingen.map(aanmelding => ({
          'Naam': aanmelding.naam,
          'Email': aanmelding.email,
          'Telefoon': aanmelding.telefoon,
          'Opmerking': aanmelding.opmerking || '',
          'Aangemeld op': new Date(aanmelding.createdAt).toLocaleDateString('nl-NL')
        }));
        
        const taskSheet = XLSX.utils.json_to_sheet(taskData);
        // Limit sheet name to 31 characters (Excel limitation)
        const sheetName = taak.naam.substring(0, 31);
        XLSX.utils.book_append_sheet(wb, taskSheet, sheetName);
      }
    });

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Return file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="aanmeldingen-${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het exporteren' },
      { status: 500 }
    );
  }
}