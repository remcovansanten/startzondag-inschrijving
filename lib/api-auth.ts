import { NextResponse } from 'next/server';
import { getSession } from './auth';

// Autorisatie-guard voor admin API-routes. Geef de 401-respons terug als er geen
// geldige sessie is, anders null. Gebruik: `const denied = await requireAdmin();
// if (denied) return denied;` bovenaan elke handler.
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Niet geautoriseerd' }, { status: 401 });
  }
  return null;
}
