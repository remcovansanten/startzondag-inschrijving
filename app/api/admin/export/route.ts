import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import ExcelJS from 'exceljs';
import { createAuditLog } from '@/lib/audit';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
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
    const workbook = new ExcelJS.Workbook();
    
    // Set workbook properties
    workbook.creator = 'Startzondag Vrijwilligers';
    workbook.created = new Date();

    // Overview sheet
    const overviewSheet = workbook.addWorksheet('Overzicht');
    overviewSheet.columns = [
      { header: 'Taak', key: 'taak', width: 30 },
      { header: 'Categorie', key: 'categorie', width: 20 },
      { header: 'Beschrijving', key: 'beschrijving', width: 40 },
      { header: 'Max Aantal', key: 'maxAantal', width: 15 },
      { header: 'Aanmeldingen', key: 'aanmeldingen', width: 15 },
      { header: 'Vrije Plekken', key: 'vrijePlekken', width: 15 },
      { header: 'Status', key: 'status', width: 10 }
    ];

    taken.forEach(taak => {
      overviewSheet.addRow({
        taak: taak.naam,
        categorie: taak.categorie || '',
        beschrijving: taak.beschrijving || '',
        maxAantal: taak.maxAantal,
        aanmeldingen: taak.aanmeldingen.length,
        vrijePlekken: taak.maxAantal - taak.aanmeldingen.length,
        status: taak.aanmeldingen.length >= taak.maxAantal ? 'Vol' : 'Open'
      });
    });

    // Style the header row
    overviewSheet.getRow(1).font = { bold: true };
    overviewSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // All registrations sheet
    const allSheet = workbook.addWorksheet('Alle Aanmeldingen');
    allSheet.columns = [
      { header: 'Taak', key: 'taak', width: 30 },
      { header: 'Categorie', key: 'categorie', width: 20 },
      { header: 'Naam', key: 'naam', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Telefoon', key: 'telefoon', width: 15 },
      { header: 'Opmerking', key: 'opmerking', width: 40 },
      { header: 'Aangemeld op', key: 'aangemeldOp', width: 20 },
      { header: 'Bevestigd', key: 'bevestigd', width: 10 }
    ];

    taken.forEach(taak => {
      taak.aanmeldingen.forEach(aanmelding => {
        allSheet.addRow({
          taak: taak.naam,
          categorie: taak.categorie || '',
          naam: aanmelding.naam,
          email: aanmelding.email,
          telefoon: aanmelding.telefoon,
          opmerking: aanmelding.opmerking || '',
          aangemeldOp: new Date(aanmelding.createdAt).toLocaleDateString('nl-NL'),
          bevestigd: aanmelding.bevestigd ? 'Ja' : 'Nee'
        });
      });
    });

    allSheet.getRow(1).font = { bold: true };
    allSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Contact list sheet
    const contactSheet = workbook.addWorksheet('Contactlijst');
    contactSheet.columns = [
      { header: 'Taak', key: 'taak', width: 30 },
      { header: 'Naam', key: 'naam', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Telefoon', key: 'telefoon', width: 15 }
    ];

    taken.forEach(taak => {
      taak.aanmeldingen.forEach(aanmelding => {
        contactSheet.addRow({
          taak: taak.naam,
          naam: aanmelding.naam,
          email: aanmelding.email,
          telefoon: aanmelding.telefoon
        });
      });
    });

    contactSheet.getRow(1).font = { bold: true };
    contactSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Individual task sheets
    taken.forEach(taak => {
      // Limit sheet name to 31 characters (Excel limitation)
      const sheetName = taak.naam.substring(0, 31);
      const taskSheet = workbook.addWorksheet(sheetName);
      
      // Add task header information
      taskSheet.getCell('A1').value = `TAAK: ${taak.naam}`;
      taskSheet.getCell('A1').font = { bold: true, size: 14 };
      
      taskSheet.getCell('A2').value = `Categorie: ${taak.categorie || 'Geen'}`;
      taskSheet.getCell('A3').value = `${taak.aanmeldingen.length} van ${taak.maxAantal} plekken bezet`;
      
      if (taak.beschrijving) {
        taskSheet.getCell('A4').value = `Beschrijving: ${taak.beschrijving}`;
      }

      // Add registrations
      const startRow = 6;
      taskSheet.getCell(`A${startRow}`).value = 'Naam';
      taskSheet.getCell(`B${startRow}`).value = 'Email';
      taskSheet.getCell(`C${startRow}`).value = 'Telefoon';
      taskSheet.getCell(`D${startRow}`).value = 'Opmerking';
      taskSheet.getCell(`E${startRow}`).value = 'Aangemeld op';
      
      // Style header row
      taskSheet.getRow(startRow).font = { bold: true };
      taskSheet.getRow(startRow).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Set column widths
      taskSheet.getColumn(1).width = 25; // Naam
      taskSheet.getColumn(2).width = 30; // Email
      taskSheet.getColumn(3).width = 15; // Telefoon
      taskSheet.getColumn(4).width = 40; // Opmerking
      taskSheet.getColumn(5).width = 20; // Aangemeld op

      if (taak.aanmeldingen.length > 0) {
        taak.aanmeldingen.forEach((aanmelding, index) => {
          const rowNum = startRow + index + 1;
          taskSheet.getCell(`A${rowNum}`).value = aanmelding.naam;
          taskSheet.getCell(`B${rowNum}`).value = aanmelding.email;
          taskSheet.getCell(`C${rowNum}`).value = aanmelding.telefoon;
          taskSheet.getCell(`D${rowNum}`).value = aanmelding.opmerking || '';
          taskSheet.getCell(`E${rowNum}`).value = new Date(aanmelding.createdAt).toLocaleDateString('nl-NL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        });
      } else {
        taskSheet.getCell(`A${startRow + 1}`).value = 'Nog geen aanmeldingen';
      }
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Audit log
    const session = await getSession();
    if (session && typeof session === 'object' && 'id' in session) {
      await createAuditLog({
        adminId: session.id as string,
        action: 'EXPORT_DATA',
        entity: 'Aanmelding',
        details: {
          takenCount: taken.length,
          totalRegistrations: taken.reduce((sum, taak) => sum + taak.aanmeldingen.length, 0)
        },
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    }

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