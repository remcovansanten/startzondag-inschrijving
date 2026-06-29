import Link from 'next/link';
import { prisma } from '@/lib/db';
import { clearSession } from '@/lib/auth';
import { ACTIEF_FILTER } from '@/lib/aanmelding';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function getStats() {
  const [takenCount, aanmeldingenCount, taken] = await Promise.all([
    prisma.taak.count(),
    prisma.aanmelding.count({ where: ACTIEF_FILTER }),
    prisma.taak.findMany({
      include: {
        _count: {
          select: { aanmeldingen: { where: ACTIEF_FILTER } }
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

type SortKey = 'naam' | 'categorie' | 'bezetting' | 'status';
type TaakRij = Awaited<ReturnType<typeof getStats>>['taken'][number];

const bezettingsRatio = (t: TaakRij) => (t.maxAantal > 0 ? t._count.aanmeldingen / t.maxAantal : 0);

function sorteerTaken(taken: TaakRij[], sort: SortKey, dir: 'asc' | 'desc') {
  const factor = dir === 'asc' ? 1 : -1;
  return [...taken].sort((a, b) => {
    let cmp = 0;
    if (sort === 'naam') cmp = a.naam.localeCompare(b.naam, 'nl');
    else if (sort === 'categorie') cmp = (a.categorie || '').localeCompare(b.categorie || '', 'nl');
    else cmp = bezettingsRatio(a) - bezettingsRatio(b); // bezetting + status sorteren op vullingsgraad
    return cmp * factor;
  });
}

const isVolTaak = (t: TaakRij) => t._count.aanmeldingen >= t.maxAantal;
const isBijnaVol = (t: TaakRij) => !isVolTaak(t) && bezettingsRatio(t) >= 0.8;

// Bouw een dashboard-URL die de huidige sortering bewaart.
function dashboardHref(sort: SortKey, dir: 'asc' | 'desc', filter?: string, col?: SortKey, colDir?: 'asc' | 'desc') {
  const parts: string[] = [];
  const s = col ?? sort;
  const d = colDir ?? dir;
  if (s !== 'naam' || d !== 'asc') parts.push(`sort=${s}`, `dir=${d}`);
  if (filter) parts.push(`filter=${filter}`);
  return '/admin/dashboard' + (parts.length ? `?${parts.join('&')}` : '');
}

// Klikbare kolomheader die de sortering via de URL aanstuurt (en de filter bewaart).
function SortHeader({ label, col, sort, dir, filter }: { label: string; col: SortKey; sort: SortKey; dir: 'asc' | 'desc'; filter?: string }) {
  const actief = sort === col;
  const volgendeDir: 'asc' | 'desc' = actief && dir === 'asc' ? 'desc' : 'asc';
  const pijl = actief ? (dir === 'asc' ? '▲' : '▼') : '';
  return (
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      <Link href={dashboardHref(sort, dir, filter, col, volgendeDir)} className="inline-flex items-center gap-1 hover:text-gray-800">
        {label}
        <span className="text-[9px]">{pijl}</span>
      </Link>
    </th>
  );
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; dir?: string; filter?: string }>;
}) {
  const stats = await getStats();
  const sp = await searchParams;
  const sort = (['naam', 'categorie', 'bezetting', 'status'].includes(sp.sort ?? '') ? sp.sort : 'naam') as SortKey;
  const dir: 'asc' | 'desc' = sp.dir === 'desc' ? 'desc' : 'asc';
  const filter = sp.filter === 'vol' || sp.filter === 'bijnavol' ? sp.filter : undefined;

  const gesorteerd = sorteerTaken(stats.taken, sort, dir);
  const taken =
    filter === 'vol' ? gesorteerd.filter(isVolTaak) : filter === 'bijnavol' ? gesorteerd.filter(isBijnaVol) : gesorteerd;

  return (
    <main className="min-h-screen bg-bg-light">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-text-dark">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard/audit" className="text-sm text-gray-500 hover:underline">
                Logboek
              </Link>
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
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Link
            href={dashboardHref(sort, dir, undefined)}
            className={`bg-white rounded-lg shadow p-6 block hover:shadow-md transition-shadow ${!filter ? 'ring-2 ring-primary' : ''}`}
          >
            <h3 className="text-sm font-medium text-text-muted mb-2">Totaal Taken</h3>
            <p className="text-3xl font-bold text-text-dark">{stats.takenCount}</p>
            <p className="text-xs text-gray-400 mt-1">Toon alle taken</p>
          </Link>

          <Link
            href="/admin/dashboard/aanmeldingen"
            className="bg-white rounded-lg shadow p-6 block hover:shadow-md transition-shadow"
          >
            <h3 className="text-sm font-medium text-text-muted mb-2">Totaal Aanmeldingen</h3>
            <p className="text-3xl font-bold text-text-dark">{stats.aanmeldingenCount}</p>
            <p className="text-xs text-gray-400 mt-1">Bekijk alle aanmeldingen →</p>
          </Link>

          <Link
            href={dashboardHref(sort, dir, 'vol')}
            className={`bg-white rounded-lg shadow p-6 block hover:shadow-md transition-shadow ${filter === 'vol' ? 'ring-2 ring-danger' : ''}`}
          >
            <h3 className="text-sm font-medium text-text-muted mb-2">Volle Taken</h3>
            <p className="text-3xl font-bold text-text-dark">{stats.volletaken.length}</p>
            <p className="text-xs text-gray-400 mt-1">Toon welke →</p>
          </Link>

          <Link
            href={dashboardHref(sort, dir, 'bijnavol')}
            className={`bg-white rounded-lg shadow p-6 block hover:shadow-md transition-shadow ${filter === 'bijnavol' ? 'ring-2 ring-warning' : ''}`}
          >
            <h3 className="text-sm font-medium text-text-muted mb-2">Bijna Vol</h3>
            <p className="text-3xl font-bold text-text-dark">{stats.bijnaVolletaken.length}</p>
            <p className="text-xs text-gray-400 mt-1">Toon welke →</p>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-text-dark">Taken Overzicht</h2>
              <div className="space-x-2">
                <Link
                  href="/admin/dashboard/aanmeldingen"
                  className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 transition-colors"
                >
                  Aanmeldingen
                </Link>
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

          {filter && (
            <div className="px-6 py-2 bg-gray-50 border-b text-sm text-gray-600 flex items-center gap-2">
              <span>Gefilterd op: <strong>{filter === 'vol' ? 'Volle taken' : 'Bijna volle taken'}</strong> ({taken.length})</span>
              <Link href={dashboardHref(sort, dir, undefined)} className="text-primary hover:underline">× toon alle</Link>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <SortHeader label="Naam" col="naam" sort={sort} dir={dir} filter={filter} />
                  <SortHeader label="Categorie" col="categorie" sort={sort} dir={dir} filter={filter} />
                  <SortHeader label="Bezetting" col="bezetting" sort={sort} dir={dir} filter={filter} />
                  <SortHeader label="Status" col="status" sort={sort} dir={dir} filter={filter} />
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {taken.map((taak) => {
                  const percentage = (taak._count.aanmeldingen / taak.maxAantal) * 100;
                  const isVol = taak._count.aanmeldingen >= taak.maxAantal;
                  
                  return (
                    <tr key={taak.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {taak.naam}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
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
                            ? 'bg-danger-bg text-danger' 
                            : percentage > 75 
                            ? 'bg-warning-bg text-warning'
                            : 'bg-success-bg text-success'
                        }`}>
                          {isVol ? 'Vol' : percentage > 75 ? 'Bijna vol' : 'Open'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/admin/dashboard/taken/${taak.id}`}
                          className="text-primary hover:text-primary-hover hover:underline mr-3 font-medium"
                        >
                          Bekijk
                        </Link>
                        <Link
                          href={`/admin/dashboard/taken/${taak.id}/edit`}
                          className="text-primary hover:text-primary-hover hover:underline font-medium"
                        >
                          Bewerk
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {taken.length === 0 && (
              <div className="text-center py-8 text-text-muted">
                {filter
                  ? `Geen ${filter === 'vol' ? 'volle' : 'bijna volle'} taken. `
                  : 'Nog geen taken aangemaakt'}
                {filter && (
                  <Link href={dashboardHref(sort, dir, undefined)} className="text-primary hover:underline">
                    Toon alle taken
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}