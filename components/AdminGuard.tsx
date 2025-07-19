import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function AdminGuard({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/admin/login');
  }

  return <>{children}</>;
}