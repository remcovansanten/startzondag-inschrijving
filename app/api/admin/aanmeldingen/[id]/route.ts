import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { getSession } from '@/lib/auth';
import { STATUS } from '@/lib/aanmelding';
import { promoteFromWaitlist } from '@/lib/waitlist';
import { sendWaitlistPromotionEmail } from '@/lib/email';
import { validateRegistration, sanitizePhoneNumber } from '@/lib/validation';
import { logAudit } from '@/lib/audit';

// PUT: aanmelding bewerken (naam/e-mail/telefoon/opmerking + admin-notitie).
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const session = await getSession();
  try {
    const { id } = await params;
    const body = await request.json();

    const validated = validateRegistration(body);
    if (validated.error || !validated.data) {
      return NextResponse.json({ message: validated.error }, { status: 400 });
    }
    const adminNotitie =
      typeof body.adminNotitie === 'string' ? body.adminNotitie.trim().slice(0, 1000) || null : null;

    const existing = await prisma.aanmelding.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: 'Aanmelding niet gevonden' }, { status: 404 });
    }

    await prisma.aanmelding.update({
      where: { id },
      data: {
        naam: validated.data.naam,
        email: validated.data.email,
        telefoon: sanitizePhoneNumber(validated.data.telefoon),
        opmerking: validated.data.opmerking,
        adminNotitie,
      },
    });

    await logAudit({
      actorEmail: session?.email ?? 'onbekend',
      action: 'aanmelding.bewerkt',
      entityType: 'Aanmelding',
      entityId: id,
      details: validated.data.naam,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Aanmelding bewerken mislukt');
    return NextResponse.json({ message: 'Er is een fout opgetreden' }, { status: 500 });
  }
}

// DELETE a registration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;

    // Check if registration exists
    const aanmelding = await prisma.aanmelding.findUnique({
      where: { id }
    });

    if (!aanmelding) {
      return NextResponse.json(
        { message: 'Aanmelding niet gevonden' },
        { status: 404 }
      );
    }

    // Soft-delete: markeer als geannuleerd (rij blijft bewaard voor rapportage).
    await prisma.aanmelding.update({
      where: { id },
      data: { status: STATUS.GEANNULEERD },
    });

    await logAudit({
      actorEmail: (await getSession())?.email ?? 'onbekend',
      action: 'aanmelding.geannuleerd',
      entityType: 'Aanmelding',
      entityId: id,
      details: aanmelding.naam,
    });

    // Kwam er een ACTIEVE plek vrij? Promoveer de eerste van de wachtlijst + mail.
    if (aanmelding.status === STATUS.ACTIEF) {
      try {
        const promoted = await promoteFromWaitlist(aanmelding.taakId);
        if (promoted) {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
          await sendWaitlistPromotionEmail(promoted.email, {
            naam: promoted.naam,
            taakNaam: promoted.taakNaam,
            wijzigLink: `${siteUrl}/wijzig/${promoted.token}`,
          });
        }
      } catch {
        console.error('Wachtlijst-promotie na verwijderen mislukt');
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Aanmelding succesvol verwijderd'
    });
  } catch (error) {
    console.error('Error deleting registration:', error);
    return NextResponse.json(
      { message: 'Er is een fout opgetreden bij het verwijderen van de aanmelding' },
      { status: 500 }
    );
  }
}