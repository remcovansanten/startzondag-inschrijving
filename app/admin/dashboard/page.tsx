import Link from 'next/link';
import { prisma } from '@/lib/db';
import { clearSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

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
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
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
            <h3 className="text-sm font-medium text-gray-500 mb-2">Totaal Taken</h3>
            <p className="text-3xl font-bold text-primary">{stats.takenCount}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Totaal Aanmeldingen</h3>
            <p className="text-3xl font-bold text-success">{stats.aanmeldingenCount}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Volle Taken</h3>
            <p className="text-3xl font-bold text-danger">{stats.volletaken.length}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Bijna Vol</h3>
            <p className="text-3xl font-bold text-warning">{stats.bijnaVolletaken.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Taken Overzicht</h2>
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
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Naam
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bezetting
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.taken.map((taak) => {
                  const percentage = (taak._count.aanmeldingen / taak.maxAantal) * 100;
                  const isVol = taak._count.aanmeldingen >= taak.maxAantal;
                  
                  return (
                    <tr key={taak.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {taak.naam}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {taak.categorie || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm mr-2">
                            {taak._count.aanmeldingen}/{taak.maxAantal}
                          </span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                isVol ? 'bg-danger' : percentage > 75 ? 'bg-warning' : 'bg-success'
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          isVol 
                            ? 'bg-red-100 text-red-800' 
                            : percentage > 75 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {isVol ? 'Vol' : percentage > 75 ? 'Bijna vol' : 'Open'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/admin/dashboard/taken/${taak.id}`}
                          className="text-primary hover:underline mr-3"
                        >
                          Bekijk
                        </Link>
                        <Link
                          href={`/admin/dashboard/taken/${taak.id}/edit`}
                          className="text-secondary hover:underline"
                        >
                          Bewerk
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {stats.taken.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nog geen taken aangemaakt
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}