import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { EMAIL_STATUS } from '@/lib/aanmelding';

export const runtime = 'nodejs';

// Verifieer de Svix-handtekening (zoals Resend die stuurt) met het signing secret.
// Zonder geldige handtekening kan iedereen nep-bounces sturen.
function verifySignature(secret: string, headers: Headers, payload: string): boolean {
  const id = headers.get('svix-id');
  const timestamp = headers.get('svix-timestamp');
  const sigHeader = headers.get('svix-signature');
  if (!id || !timestamp || !sigHeader) return false;

  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = crypto
    .createHmac('sha256', secretBytes)
    .update(`${id}.${timestamp}.${payload}`)
    .digest('base64');
  const expectedBuf = Buffer.from(expected);

  // Header bevat één of meer "v1,<signature>" gescheiden door spaties.
  return sigHeader.split(' ').some((part) => {
    const sig = part.split(',')[1];
    if (!sig) return false;
    const sigBuf = Buffer.from(sig);
    return sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf);
  });
}

export async function POST(request: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error('RESEND_WEBHOOK_SECRET niet geconfigureerd');
    return NextResponse.json({ message: 'Webhook niet geconfigureerd' }, { status: 500 });
  }

  const payload = await request.text();
  if (!verifySignature(secret, request.headers, payload)) {
    return NextResponse.json({ message: 'Ongeldige handtekening' }, { status: 401 });
  }

  let event: { type?: string; data?: { to?: unknown } };
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ message: 'Ongeldige payload' }, { status: 400 });
  }

  // Bij een bounce of klacht: markeer de aanmelding(en) voor handmatige controle.
  if (event.type === 'email.bounced' || event.type === 'email.complained') {
    const to = event.data?.to;
    const recipients = (Array.isArray(to) ? to : [to])
      .filter((e): e is string => typeof e === 'string')
      .map((e) => e.trim().toLowerCase());
    if (recipients.length > 0) {
      await prisma.aanmelding.updateMany({
        where: { email: { in: recipients } },
        data: { emailStatus: EMAIL_STATUS.CONTROLEREN },
      });
    }
  }

  return NextResponse.json({ received: true });
}
