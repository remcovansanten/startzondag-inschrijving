import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendCancellationEmail } from '@/lib/email';

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
    const { naam, email, telefoon, opmerking } = body;

    // Validate required fields
    if (!naam || !email || !telefoon) {
      return NextResponse.json(
        { message: 'Alle verplichte velden moeten worden ingevuld' },
        { status: 400 }
      );
    }

    const aanmelding = await prisma.aanmelding.update({
      where: { token },
      data: {
        naam,
        email,
        telefoon,
        opmerking: opmerking || null,
      },
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

    await prisma.aanmelding.delete({
      where: { token }
    });

    // Send cancellation email (disabled for now - no valid API key)
    // TODO: Enable when email service is configured
    // await sendCancellationEmail(aanmelding.email, {
    //   naam: aanmelding.naam,
    //   taakNaam: aanmelding.taak.naam,
    // });

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