import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET ontbreekt of is te kort (min. 32 tekens). Stel deze in via de environment — er is geen onveilige fallback.'
    );
  }
  return secret;
}

export async function createToken(payload: any) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '4h' });
}

export async function verifyToken(token: string) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');
  
  if (!token) return null;
  
  return verifyToken(token.value);
}

export async function setSession(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 4, // 4 hours
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
}