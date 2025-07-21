import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { naam, beschrijving, maxAantal, categorie } = body;

    if (!naam || !maxAantal) {
      return NextResponse.json(
        { message: 'Naam en maximum aantal zijn verplicht' },
        { status: 400 }
      );
    }

    const taak = await prisma.taak.create({
      data: {
        naam,
        beschrijving: beschrijving || null,
        maxAantal: parseInt(maxAantal),
        categorie: categorie || null,
      },
    });

    return NextResponse.json({
      success: true,
      taak
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { message: 'Er is een fout opgetreden bij het aanmaken van de taak' },
      { status: 500 }
    );
  }
}