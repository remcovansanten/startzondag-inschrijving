import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendCancellationEmail, sendWaitlistPromotionEmail } from '@/lib/email';
import { validateRegistration } from '@/lib/validation';
import { STATUS } from '@/lib/aanmelding';
import { promoteFromWaitlist } from '@/lib/waitlist';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const aanmelding = await prisma.aanmelding.findUnique({
      where: { token },
      include: {
        taak: true
      }
    });

    if (!aanmelding) {
      return NextResponse.json(
        { message: 'Aanmelding niet gevonden' },
        { status: 404 }
      );
    }

    return NextResponse.json({ aanmelding });
  } catch (error) {
    console.error('Error fetching registration:', error);
    return NextResponse.json(
      { message: 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();

    const validated = validateRegistration(body);
    if (validated.error || !validated.data) {
      return NextResponse.json({ message: validated.error }, { status: 400 });
    }

    const aanmelding = await prisma.aanmelding.update({
      where: { token },
      data: validated.data,
    });

    return NextResponse.json({
      success: true,
      message: 'Aanmelding succesvol bijgewerkt',
      aanmelding
    });
  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json(
      { message: 'Er is een fout opgetreden bij het bijwerken' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const aanmelding = await prisma.aanmelding.findUnique({
      where: { token },
      include: {
        taak: true
      }
    });

    if (!aanmelding) {
      return NextResponse.json(
        { message: 'Aanmelding niet gevonden' },
        { status: 404 }
      );
    }

    // Soft-delete: bewaar de rij maar markeer als geannuleerd; de plek komt vrij.
    await prisma.aanmelding.update({
      where: { token },
      data: { status: STATUS.GEANNULEERD },
    });

    // Send cancellation email
    await sendCancellationEmail(aanmelding.email, {
      naam: aanmelding.naam,
      taakNaam: aanmelding.taak.naam,
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
        console.error('Wachtlijst-promotie na annulering mislukt');
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Aanmelding succesvol geannuleerd'
    });
  } catch (error) {
    console.error('Error deleting registration:', error);
    return NextResponse.json(
      { message: 'Er is een fout opgetreden bij het annuleren' },
      { status: 500 }
    );
  }
}