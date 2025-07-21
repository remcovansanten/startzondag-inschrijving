import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import * as XLSX from 'xlsx';

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
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet) as any[];

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