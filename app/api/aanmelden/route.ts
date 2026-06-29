import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendConfirmationEmail } from '@/lib/email';
import { checkRateLimit, getRemainingTime } from '@/lib/rate-limit';
import { sanitizePhoneNumber, validateRegistration } from '@/lib/validation';
import { checkEmailDomain } from '@/lib/email-validate';
import { ACTIEF_FILTER, STATUS } from '@/lib/aanmelding';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Get IP address for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown';
    
    const body = await request.json();
    const { taakId, website, renderedAt } = body;

    if (!taakId || typeof taakId !== 'string') {
      return NextResponse.json(
        { message: 'Taak is verplicht' },
        { status: 400 }
      );
    }

    // Onzichtbare anti-abuse: een honeypot-veld dat echte gebruikers nooit zien/
    // invullen, en een minimale invultijd. Een bot vult de honeypot of submit
    // direct. Bewuste, gedocumenteerde keuze: doe alsof het lukte en sla niets op
    // (verklap de bot niets) — geen stille fallback elders in de app.
    const elapsedMs = Date.now() - Number(renderedAt);
    const looksLikeBot =
      (typeof website === 'string' && website.trim() !== '') ||
      !Number.isFinite(elapsedMs) ||
      elapsedMs < 3000;
    if (looksLikeBot) {
      return NextResponse.json({ success: true, message: 'Aanmelding succesvol' });
    }

    // Gedeelde validatie + sanitisatie (naam, e-mail, telefoon, opmerking + lengtes)
    const validated = validateRegistration(body);
    if (validated.error || !validated.data) {
      return NextResponse.json({ message: validated.error }, { status: 400 });
    }
    const { naam, email, opmerking } = validated.data;

    // Sanitize phone number for storage
    const sanitizedPhone = sanitizePhoneNumber(validated.data.telefoon);

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

    // E-maildomein checken (MX). Geen mailserver -> vlag 'CONTROLEREN'; de plek
    // blijft (admin matcht handmatig). Buiten de transactie i.v.m. DNS-latency.
    const emailStatus = await checkEmailDomain(email);

    // Generate unique token before transaction
    const token = crypto.randomBytes(32).toString('hex');

    // Use transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Check if task exists and has space within transaction
      const taak = await tx.taak.findUnique({
        where: { id: taakId },
        include: {
          _count: {
            select: { aanmeldingen: { where: ACTIEF_FILTER } }
          },
          aanmeldingen: {
            where: { email, status: STATUS.ACTIEF },
            select: { id: true }
          }
        }
      });

      if (!taak) {
        throw new Error('Taak niet gevonden');
      }

      // Check for duplicate active registration on same task
      if (taak.aanmeldingen.length > 0) {
        throw new Error('Je bent al aangemeld voor deze taak');
      }

      // Check if task is full (alleen ACTIEVE tellen mee)
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
          emailStatus,
        },
      });

      return { aanmelding, taak };
    });

    // Send confirmation email
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const wijzigLink = `${siteUrl}/wijzig/${token}`;

    try {
      await sendConfirmationEmail(email, {
        naam,
        taakNaam: result.taak.naam,
        telefoon: sanitizedPhone,
        email,
        wijzigLink,
      });
    } catch {
      // Bevestigingsmail mag de aanmelding niet laten falen; geen PII loggen.
      console.error('Bevestigingsmail kon niet verzonden worden');
    }

    return NextResponse.json({
      success: true,
      message: 'Aanmelding succesvol',
      wijzigToken: token, // voor de bevestigingspagina (zelfde token als in de mail)
    });
  } catch (error: any) {
    console.error('Registration error:', error?.message);

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