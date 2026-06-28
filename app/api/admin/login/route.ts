import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAllowedAdminEmail } from '@/lib/auth';
import { sendMagicLinkEmail } from '@/lib/email';
import { generateLoginToken, loginTokenExpiry, MAGIC_LINK_TTL_MINUTES } from '@/lib/magic-link';
import { checkRateLimit, getRemainingTime } from '@/lib/rate-limit';

// Generiek antwoord: onthul NOOIT of een adres wel/niet op de allowlist staat.
const GENERIC_OK = {
  success: true,
  message: 'Als dit e-mailadres een beheerder is, is er een inloglink verzonden.',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for');
  return fwd ? fwd.split(',')[0].trim() : 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string' || !EMAIL_RE.test(email) || email.length > 254) {
      return NextResponse.json({ message: 'Ongeldig e-mailadres' }, { status: 400 });
    }
    const normalized = email.trim().toLowerCase();

    // Rate limiting: per IP en per e-mailadres (tegen mailbombing).
    const ip = clientIp(request);
    const fifteenMin = MAGIC_LINK_TTL_MINUTES * 60 * 1000;
    if (
      !checkRateLimit(`magic-ip:${ip}`, 5, fifteenMin) ||
      !checkRateLimit(`magic-email:${normalized}`, 3, fifteenMin)
    ) {
      return NextResponse.json(
        { message: `Te veel aanvragen. Probeer het over ${getRemainingTime(`magic-ip:${ip}`)} minuten opnieuw.` },
        { status: 429 }
      );
    }

    // Alleen voor adressen op de allowlist daadwerkelijk een link sturen.
    if (isAllowedAdminEmail(normalized)) {
      const { token, tokenHash } = generateLoginToken();
      await prisma.loginToken.create({
        data: { email: normalized, tokenHash, expiresAt: loginTokenExpiry() },
      });
      const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const link = `${base}/admin/verify?token=${token}`;
      try {
        await sendMagicLinkEmail(normalized, link, MAGIC_LINK_TTL_MINUTES);
      } catch {
        // Mailfout niet lekken via de respons; generiek blijven.
        console.error('Magic-link mail kon niet verzonden worden');
      }
    }

    return NextResponse.json(GENERIC_OK);
  } catch (error) {
    console.error('Login request error');
    return NextResponse.json({ message: 'Er is een fout opgetreden' }, { status: 500 });
  }
}
