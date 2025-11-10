import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const jwtSecretEnv = process.env.JWT_SECRET;

if (!jwtSecretEnv || jwtSecretEnv.length < 32) {
  throw new Error(
    'JWT_SECRET environment variable must be set and at least 32 characters. ' +
    'Generate one with: openssl rand -base64 32'
  );
}

// TypeScript now knows JWT_SECRET is a string
const JWT_SECRET: string = jwtSecretEnv;

export async function createToken(payload: any) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '4h' });
}

export async function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
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