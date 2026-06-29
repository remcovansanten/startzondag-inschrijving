import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { STATUS } from '@/lib/aanmelding';
import { promoteFromWaitlist } from '@/lib/waitlist';
import { sendWaitlistPromotionEmail } from '@/lib/email';

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