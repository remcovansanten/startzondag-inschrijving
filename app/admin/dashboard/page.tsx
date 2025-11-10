import Link from 'next/link';
import { prisma } from '@/lib/db';
import { clearSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import TaskSearch from '@/components/TaskSearch';

export const dynamic = 'force-dynamic';

async function getStats() {
  const [takenCount, aanmeldingenCount, taken] = await Promise.all([
    prisma.taak.count(),
    prisma.aanmelding.count(),
    prisma.taak.findMany({
      include: {
        _count: {
          select: { aanmeldingen: true }
        }
      },
      orderBy: { naam: 'asc' }
    })
  ]);

  const volletaken = taken.filter(t => t._count.aanmeldingen >= t.maxAantal);
  const bijnaVolletaken = taken.filter(t => 
    t._count.aanmeldingen >= t.maxAantal * 0.8 && 
    t._count.aanmeldingen < t.maxAantal
  );

  return {
    takenCount,
    aanmeldingenCount,
    volletaken,
    bijnaVolletaken,
    taken
  };
}

async function handleLogout() {
  'use server';
  await clearSession();
  redirect('/admin/login');
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <main className="min-h-screen bg-bg-light">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-text-dark">Admin Dashboard</h1>
            <form action={handleLogout}>
              <button
                type="submit"
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
              >
                Uitloggen
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-text-muted mb-2">Totaal Taken</h3>
            <p className="text-3xl font-bold text-text-dark">{stats.takenCount}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-text-muted mb-2">Totaal Aanmeldingen</h3>
            <p className="text-3xl font-bold text-text-dark">{stats.aanmeldingenCount}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-text-muted mb-2">Volle Taken</h3>
            <p className="text-3xl font-bold text-text-dark">{stats.volletaken.length}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-text-muted mb-2">Bijna Vol</h3>
            <p className="text-3xl font-bold text-text-dark">{stats.bijnaVolletaken.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-text-dark">Taken Overzicht</h2>
              <div className="space-x-2">
                <Link
                  href="/admin/dashboard/taken/nieuw"
                  className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-hover transition-colors"
                >
                  Nieuwe Taak
                </Link>
                <Link
                  href="/admin/dashboard/upload"
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                >
                  Excel Upload
                </Link>
                <Link
                  href="/admin/dashboard/export"
                  className="bg-success text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                >
                  Export
                </Link>
                <Link
                  href="/admin/dashboard/audit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Audit Log
                </Link>
              </div>
            </div>
          </div>

          <div className="p-6">
            <TaskSearch tasks={stats.taken} />
          </div>
        </div>
      </div>
    </main>
  );
}