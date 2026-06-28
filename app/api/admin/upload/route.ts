import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import ExcelJS from 'exceljs';

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_ROWS = 1000;
const ALLOWED_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv',
  'application/octet-stream', // sommige browsers
];

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { message: 'Geen bestand geüpload' },
        { status: 400 }
      );
    }

    // Bestandsgrootte en -type begrenzen vóór parsen (DoS / zip-bomb).
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { message: 'Bestand te groot (max. 2 MB)' },
        { status: 400 }
      );
    }
    if (file.type && !ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: 'Ongeldig bestandstype. Upload een .xlsx-, .xls- of .csv-bestand.' },
        { status: 400 }
      );
    }

    // Read file content
    const bytes = await file.arrayBuffer();

    // Parse Excel file
    const workbook = new ExcelJS.Workbook();
    // Use the buffer method directly from ExcelJS
    await workbook.xlsx.load(bytes as any);
    const worksheet = workbook.worksheets[0];
    
    // Convert to JSON
    const data: any[] = [];
    let headers: string[] = [];
    
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        // First row contains headers
        headers = (row.values as any[]).slice(1).map((v: any) => v?.toString() || '');
      } else {
        // Data rows
        const rowData: any = {};
        (row.values as any[]).slice(1).forEach((value: any, index: number) => {
          const header = headers[index];
          if (header) {
            rowData[header] = value;
          }
        });
        if (Object.keys(rowData).length > 0) {
          data.push(rowData);
        }
      }
    });

    if (data.length > MAX_ROWS) {
      return NextResponse.json(
        { message: `Te veel rijen (max. ${MAX_ROWS}).` },
        { status: 400 }
      );
    }

    // Validate data
    const errors: string[] = [];
    const validTasks: any[] = [];

    data.forEach((row, index) => {
      if (!row.Naam) {
        errors.push(`Rij ${index + 2}: Naam is verplicht`);
        return;
      }
      const aantal = parseInt(row.MaxAantal, 10);
      if (!Number.isInteger(aantal) || aantal < 1 || aantal > 10000) {
        errors.push(`Rij ${index + 2}: MaxAantal moet een geheel getal tussen 1 en 10000 zijn`);
        return;
      }

      validTasks.push({
        naam: row.Naam.toString().trim().slice(0, 200),
        beschrijving: row.Beschrijving ? row.Beschrijving.toString().trim().slice(0, 2000) : null,
        maxAantal: aantal,
        categorie: row.Categorie ? row.Categorie.toString().trim().slice(0, 100) : null,
      });
    });

    if (errors.length > 0) {
      return NextResponse.json(
        { 
          message: 'Validatie fouten gevonden',
          errors,
          validCount: validTasks.length
        },
        { status: 400 }
      );
    }

    // Check if we should replace or append
    const replaceAll = formData.get('replaceAll') === 'true';
    
    if (replaceAll) {
      // Delete all existing tasks
      await prisma.aanmelding.deleteMany({});
      await prisma.taak.deleteMany({});
    }

    // Insert valid tasks
    const created = await prisma.taak.createMany({
      data: validTasks,
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      message: `${created.count} taken succesvol geïmporteerd`,
      imported: created.count,
      total: data.length
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { message: 'Er is een fout opgetreden bij het verwerken van het bestand' },
      { status: 500 }
    );
  }
}