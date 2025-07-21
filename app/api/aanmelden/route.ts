import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendConfirmationEmail } from '@/lib/email';
import { checkRateLimit, getRemainingTime } from '@/lib/rate-limit';
import { validateDutchPhoneNumber, sanitizePhoneNumber } from '@/lib/validation';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Get IP address for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown';
    
    const body = await request.json();
    const { taakId, naam, email, telefoon, opmerking } = body;

    // Validate required fields
    if (!taakId || !naam || !email || !telefoon) {
      return NextResponse.json(
        { message: 'Alle verplichte velden moeten worden ingevuld' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Voer een geldig e-mailadres in' },
        { status: 400 }
      );
    }

    // Validate phone number
    if (!validateDutchPhoneNumber(telefoon)) {
      return NextResponse.json(
        { message: 'Voer een geldig Nederlands telefoonnummer in (bijv. 06-12345678 of 0123-456789)' },
        { status: 400 }
      );
    }

    // Sanitize phone number for storage
    const sanitizedPhone = sanitizePhoneNumber(telefoon);

    // Check rate limit by IP and email
    const ipLimitOk = checkRateLimit(`ip:${ip}`, 10, 3600000); // 10 per hour per IP
    const emailLimitOk = checkRateLimit(`email:${email}`, 5, 3600000); // 5 per hour per email
    
    if (!ipLimitOk || !emailLimitOk) {
      const remainingMinutes = Math.max(
        getRemainingTime(`ip:${ip}`),
        getRemainingTime(`email:${email}`)
      );
      return NextResponse.json(
        { message: `Te veel aanmeldpogingen. Probeer het over ${remainingMinutes} minuten opnieuw.` },
        { status: 429 }
      );
    }

    // Generate unique token before transaction
    const token = crypto.randomBytes(32).toString('hex');

    // Use transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Check if task exists and has space within transaction
      const taak = await tx.taak.findUnique({
        where: { id: taakId },
        include: {
          _count: {
            select: { aanmeldingen: true }
          },
          aanmeldingen: {
            where: { email },
            select: { id: true }
          }
        }
      });

      if (!taak) {
        throw new Error('Taak niet gevonden');
      }

      // Check for duplicate email on same task
      if (taak.aanmeldingen.length > 0) {
        throw new Error('Je bent al aangemeld voor deze taak');
      }

      // Check if task is full (within transaction for accuracy)
      if (taak._count.aanmeldingen >= taak.maxAantal) {
        throw new Error('Deze taak is helaas vol');
      }

      // Create registration within transaction
      const aanmelding = await tx.aanmelding.create({
        data: {
          taakId,
          naam,
          email,
          telefoon: sanitizedPhone,
          opmerking: opmerking || null,
          token,
          bevestigd: true,
        },
      });

      return { aanmelding, taak };
    });

    // Send confirmation email
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const wijzigLink = `${siteUrl}/wijzig/${token}`;

    try {
      console.log('Preparing to send email:', {
        to: email,
        taakNaam: taak.naam,
        hasApiKey: !!process.env.RESEND_API_KEY,
        apiKeyStart: process.env.RESEND_API_KEY?.substring(0, 10),
        emailFrom: process.env.EMAIL_FROM,
        siteUrl,
      });

      const emailResult = await sendConfirmationEmail(email, {
        naam,
        taakNaam: result.taak.naam,
        telefoon: sanitizedPhone,
        email,
        wijzigLink,
      });
      
      console.log('Email sent successfully:', emailResult);
    } catch (emailError: any) {
      console.error('Email send error:', {
        message: emailError.message,
        stack: emailError.stack,
        error: emailError,
      });
      // Don't fail the registration if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Aanmelding succesvol',
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle specific error cases
    if (error.message === 'Taak niet gevonden') {
      return NextResponse.json(
        { message: 'Deze taak bestaat niet meer' },
        { status: 404 }
      );
    }
    
    if (error.message === 'Je bent al aangemeld voor deze taak') {
      return NextResponse.json(
        { message: 'Je bent al aangemeld voor deze taak' },
        { status: 400 }
      );
    }
    
    if (error.message === 'Deze taak is helaas vol') {
      return NextResponse.json(
        { message: 'Deze taak is helaas net vol geworden. Probeer een andere taak.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Er is een fout opgetreden bij het aanmelden. Probeer het later opnieuw.' },
      { status: 500 }
    );
  }
}