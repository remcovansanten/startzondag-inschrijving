import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await request.json();
    const { naam, beschrijving, maxAantal, categorie } = body;

    const aantal = parseInt(maxAantal, 10);
    if (!naam || typeof naam !== 'string' || naam.length > 200 || !Number.isInteger(aantal) || aantal < 1 || aantal > 10000) {
      return NextResponse.json(
        { message: 'Naam en een geldig maximum aantal (1–10000) zijn verplicht' },
        { status: 400 }
      );
    }

    const taak = await prisma.taak.create({
      data: {
        naam,
        beschrijving: beschrijving || null,
        maxAantal: aantal,
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