import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

const str = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const session = await getSession();
  try {
    const body = await request.json();
    const { naam, beschrijving, maxAantal, categorie, tijd, locatie } = body;

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
        tijd: str(tijd, 100),
        locatie: str(locatie, 200),
      },
    });

    await logAudit({
      actorEmail: session?.email ?? 'onbekend',
      action: 'taak.aangemaakt',
      entityType: 'Taak',
      entityId: taak.id,
      details: taak.naam,
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