import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendConfirmationEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taakId, naam, email, telefoon, opmerking } = body;

    // Validate required fields
    if (!taakId || !naam || !email || !telefoon) {
      return NextResponse.json(
        { message: 'Alle verplichte velden moeten worden ingevuld' },
        { status: 400 }
      );
    }

    // Check if task exists and has space
    const taak = await prisma.taak.findUnique({
      where: { id: taakId },
      include: {
        _count: {
          select: { aanmeldingen: true }
        }
      }
    });

    if (!taak) {
      return NextResponse.json(
        { message: 'Taak niet gevonden' },
        { status: 404 }
      );
    }

    if (taak._count.aanmeldingen >= taak.maxAantal) {
      return NextResponse.json(
        { message: 'Deze taak is helaas vol' },
        { status: 400 }
      );
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');

    // Create registration
    const aanmelding = await prisma.aanmelding.create({
      data: {
        taakId,
        naam,
        email,
        telefoon,
        opmerking: opmerking || null,
        token,
        bevestigd: true, // Auto-confirm for now
      },
    });

    // Send confirmation email (disabled for now - no valid API key)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const wijzigLink = `${siteUrl}/wijzig/${token}`;

    // TODO: Enable when email service is configured
    // await sendConfirmationEmail(email, {
    //   naam,
    //   taakNaam: taak.naam,
    //   telefoon,
    //   email,
    //   wijzigLink,
    // });
    
    console.log('Wijzig link:', wijzigLink);

    return NextResponse.json({
      success: true,
      message: 'Aanmelding succesvol',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Er is een fout opgetreden bij het aanmelden' },
      { status: 500 }
    );
  }
}