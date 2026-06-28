import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const COOKIE_NAME = 'auth-token';
const SESSION_SECONDS = 60 * 60 * 4; // 4 uur

export interface Session {
  email: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET ontbreekt of is te kort (min. 32 tekens). Stel deze in via de environment — er is geen onveilige fallback.'
    );
  }
  return secret;
}

// Allowlist van admin-e-mailadressen uit env (komma-gescheiden). Faalt luid als
// niet geconfigureerd — geen onveilige fallback.
export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS;
  if (!raw || !raw.trim()) {
    throw new Error('ADMIN_EMAILS ontbreekt. Stel de admin-allowlist in via de environment.');
  }
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedAdminEmail(email: string): boolean {
  return getAdminEmails().includes(email.trim().toLowerCase());
}

export async function createToken(payload: Session): Promise<string> {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '4h' });
}

export async function verifyToken(token: string): Promise<Session | null> {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (typeof decoded === 'object' && decoded && typeof decoded.email === 'string') {
      return { email: decoded.email };
    }
    return null;
  } catch {
    return null;
  }
}

// De autorisatie-grens: lever een geldige sessie of null. Route handlers en
// pagina's MOETEN dit aanroepen — de middleware verifieert de JWT niet.
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME);
  if (!token) return null;
  const session = await verifyToken(token.value);
  // Extra: blijf alleen geldig zolang het e-mailadres op de allowlist staat.
  if (session && !isAllowedAdminEmail(session.email)) return null;
  return session;
}

export async function setSession(email: string): Promise<void> {
  const token = await createToken({ email });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true, // alle deploys draaien op HTTPS (Vercel)
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
