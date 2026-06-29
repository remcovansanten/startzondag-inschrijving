import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { getSession } from '@/lib/auth';
import { validateRegistration, sanitizePhoneNumber } from '@/lib/validation';
import { ACTIEF_FILTER, STATUS } from '@/lib/aanmelding';
import { sendConfirmationEmail } from '@/lib/email';
import { logAudit } from '@/lib/audit';

// Handmatig een aanmelding toevoegen (beheerder). Triggert de bevestigingsmail.
export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const session = await getSession();

  try {
    const body = await request.json();
    const { taakId } = body;
    if (!taakId || typeof taakId !== 'string') {
      return NextResponse.json({ message: 'Taak is verplicht' }, { status: 400 });
    }

    const validated = validateRegistration(body);
    if (validated.error || !validated.data) {
      return NextResponse.json({ message: validated.error }, { status: 400 });
    }
    const { naam, email, opmerking } = validated.data;
    const sanitizedPhone = sanitizePhoneNumber(validated.data.telefoon);
    const adminNotitie =
      typeof body.adminNotitie === 'string' ? body.adminNotitie.trim().slice(0, 1000) || null : null;
    const token = crypto.randomBytes(32).toString('hex');

    const result = await prisma.$transaction(async (tx) => {
      const taak = await tx.taak.findUnique({
        where: { id: taakId },
        include: {
          _count: { select: { aanmeldingen: { where: ACTIEF_FILTER } } },
          aanmeldingen: {
            where: { email, status: { in: [STATUS.ACTIEF, STATUS.WACHTLIJST] } },
            select: { id: true },
          },
        },
      });
      if (!taak) throw new Error('Taak niet gevonden');
      if (taak.aanmeldingen.length > 0) throw new Error('Dit e-mailadres is al aangemeld voor deze taak');
      if (taak._count.aanmeldingen >= taak.maxAantal) {
        throw new Error('Deze taak is vol — verhoog eerst het maximum of kies een andere taak');
      }
      const aanmelding = await tx.aanmelding.create({
        data: {
          taakId,
          naam,
          email,
          telefoon: sanitizedPhone,
          opmerking: opmerking || null,
          adminNotitie,
          token,
          bevestigd: true,
          status: STATUS.ACTIEF,
        },
      });
      return { aanmelding, taak };
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    try {
      await sendConfirmationEmail(email, {
        naam,
        taakNaam: result.taak.naam,
        telefoon: sanitizedPhone,
        email,
        wijzigLink: `${siteUrl}/wijzig/${token}`,
      });
    } catch {
      console.error('Bevestigingsmail (handmatig) kon niet verzonden worden');
    }

    await logAudit({
      actorEmail: session?.email ?? 'onbekend',
      action: 'aanmelding.handmatig-toegevoegd',
      entityType: 'Aanmelding',
      entityId: result.aanmelding.id,
      details: `${naam} <${email}> voor "${result.taak.naam}"`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('aangemeld') || msg.includes('niet gevonden') || msg.includes('vol')) {
      return NextResponse.json({ message: msg }, { status: 400 });
    }
    console.error('Handmatig toevoegen mislukt');
    return NextResponse.json({ message: 'Er is een fout opgetreden' }, { status: 500 });
  }
}
