import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import ExcelJS from 'exceljs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { message: 'Geen bestand geüpload' },
        { status: 400 }
      );
    }

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse Excel file
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    
    // Convert to JSON
    const data: any[] = [];
    let headers: string[] = [];
    
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        // First row contains headers
        headers = row.values.slice(1).map(v => v?.toString() || '');
      } else {
        // Data rows
        const rowData: any = {};
        row.values.slice(1).forEach((value, index) => {
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

    // Validate data
    const errors: string[] = [];
    const validTasks: any[] = [];

    data.forEach((row, index) => {
      if (!row.Naam) {
        errors.push(`Rij ${index + 2}: Naam is verplicht`);
        return;
      }
      if (!row.MaxAantal || isNaN(row.MaxAantal)) {
        errors.push(`Rij ${index + 2}: MaxAantal moet een getal zijn`);
        return;
      }

      validTasks.push({
        naam: row.Naam.toString().trim(),
        beschrijving: row.Beschrijving ? row.Beschrijving.toString().trim() : null,
        maxAantal: parseInt(row.MaxAantal),
        categorie: row.Categorie ? row.Categorie.toString().trim() : null,
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