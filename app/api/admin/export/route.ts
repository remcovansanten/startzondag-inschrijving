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

    // Contact list sheet - simplified view for easy contact
    const contactList = taken.flatMap(taak => 
      taak.aanmeldingen.map(aanmelding => ({
        'Taak': taak.naam,
        'Naam': aanmelding.naam,
        'Email': aanmelding.email,
        'Telefoon': aanmelding.telefoon
      }))
    );
    
    if (contactList.length > 0) {
      const contactSheet = XLSX.utils.json_to_sheet(contactList);
      contactSheet['!cols'] = [
        { wch: 30 }, // Taak
        { wch: 25 }, // Naam
        { wch: 30 }, // Email
        { wch: 15 }  // Telefoon
      ];
      XLSX.utils.book_append_sheet(wb, contactSheet, 'Contactlijst');
    }

    // Sheet per task with enhanced information
    taken.forEach(taak => {
      const taskData = [];
      
      // Add task header information
      taskData.push({
        'Naam': `TAAK: ${taak.naam}`,
        'Email': '',
        'Telefoon': '',
        'Opmerking': taak.beschrijving || '',
        'Aangemeld op': ''
      });
      
      taskData.push({
        'Naam': `Categorie: ${taak.categorie || 'Geen'}`,
        'Email': '',
        'Telefoon': '',
        'Opmerking': `${taak.aanmeldingen.length} van ${taak.maxAantal} plekken bezet`,
        'Aangemeld op': ''
      });
      
      // Add empty row
      taskData.push({
        'Naam': '',
        'Email': '',
        'Telefoon': '',
        'Opmerking': '',
        'Aangemeld op': ''
      });
      
      // Add volunteer data
      if (taak.aanmeldingen.length > 0) {
        taak.aanmeldingen.forEach((aanmelding, index) => {
          taskData.push({
            'Naam': aanmelding.naam,
            'Email': aanmelding.email,
            'Telefoon': aanmelding.telefoon,
            'Opmerking': aanmelding.opmerking || '',
            'Aangemeld op': new Date(aanmelding.createdAt).toLocaleDateString('nl-NL', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          });
        });
      } else {
        taskData.push({
          'Naam': 'Nog geen aanmeldingen',
          'Email': '',
          'Telefoon': '',
          'Opmerking': '',
          'Aangemeld op': ''
        });
      }
      
      const taskSheet = XLSX.utils.json_to_sheet(taskData);
      
      // Set column widths for better readability
      taskSheet['!cols'] = [
        { wch: 25 }, // Naam
        { wch: 30 }, // Email
        { wch: 15 }, // Telefoon
        { wch: 40 }, // Opmerking
        { wch: 20 }  // Aangemeld op
      ];
      
      // Limit sheet name to 31 characters (Excel limitation)
      const sheetName = taak.naam.substring(0, 31);
      XLSX.utils.book_append_sheet(wb, taskSheet, sheetName);
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