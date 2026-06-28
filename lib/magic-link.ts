import crypto from 'crypto';

// Geldigheidsduur van een magic link.
export const MAGIC_LINK_TTL_MINUTES = 15;

// Genereer een cryptografisch willekeurig token (256-bit). Het token zelf gaat
// in de e-mail/URL; alleen de hash wordt opgeslagen.
export function generateLoginToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, tokenHash: hashLoginToken(token) };
}

export function hashLoginToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function loginTokenExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + MAGIC_LINK_TTL_MINUTES * 60 * 1000);
}
