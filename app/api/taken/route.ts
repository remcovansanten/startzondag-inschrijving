import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ACTIEF_FILTER } from '@/lib/aanmelding';

export async function GET() {
  try {
    const taken = await prisma.taak.findMany({
      include: {
        _count: {
          select: { aanmeldingen: { where: ACTIEF_FILTER } }
        }
      },
      orderBy: [
        { categorie: 'asc' },
        { naam: 'asc' }
      ]
    });

    return NextResponse.json({ taken });
  } catch (error) {
    console.error('Error fetching taken:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}