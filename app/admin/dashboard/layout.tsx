import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Autorisatie-grens voor het hele dashboard: verifieert de JWT-sessie server-side
// (de middleware checkt alleen of de cookie bestaat). Geen geldige sessie -> login.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect('/admin/login');
  }
  return <>{children}</>;
}
