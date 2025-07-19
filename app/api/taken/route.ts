import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const taken = await prisma.taak.findMany({
      include: {
        _count: {
          select: { aanmeldingen: true }
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