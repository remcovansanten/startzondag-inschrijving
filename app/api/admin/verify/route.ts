import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAllowedAdminEmail, setSession } from '@/lib/auth';
import { hashLoginToken } from '@/lib/magic-link';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ message: 'Ongeldige of verlopen link' }, { status: 400 });
    }

    const tokenHash = hashLoginToken(token);
    const now = new Date();

    const record = await prisma.loginToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
    });
    if (!record) {
      return NextResponse.json({ message: 'Ongeldige of verlopen link' }, { status: 400 });
    }

    // Atomair consumeren: alleen slagen als het token nog niet gebruikt is.
    const consumed = await prisma.loginToken.updateMany({
      where: { id: record.id, usedAt: null },
      data: { usedAt: now },
    });
    if (consumed.count !== 1) {
      return NextResponse.json({ message: 'Ongeldige of verlopen link' }, { status: 400 });
    }

    // Allowlist opnieuw checken (kan sinds aanvraag gewijzigd zijn).
    if (!isAllowedAdminEmail(record.email)) {
      return NextResponse.json({ message: 'Geen toegang' }, { status: 403 });
    }

    await setSession(record.email);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verify error');
    return NextResponse.json({ message: 'Er is een fout opgetreden' }, { status: 500 });
  }
}
