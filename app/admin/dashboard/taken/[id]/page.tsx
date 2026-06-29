import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatDateTimeNL } from '@/lib/datetime';
import { ACTIEF_FILTER, STATUS } from '@/lib/aanmelding';
import DeleteButton from './DeleteButton';

export const dynamic = 'force-dynamic';

async function getTaakData(id: string) {
  const taak = await prisma.taak.findUnique({
    where: { id },
    include: {
      aanmeldingen: {
        where: ACTIEF_FILTER,
        orderBy: { createdAt: 'desc' }
      }
    }
  });
  if (!taak) return null;
  const wachtlijst = await prisma.aanmelding.findMany({
    where: { taakId: id, status: STATUS.WACHTLIJST },
    orderBy: { createdAt: 'asc' },
  });
  return { taak, wachtlijst };
}

export default async function TaakDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getTaakData(id);

  if (!data) {
    notFound();
  }
  const { taak, wachtlijst } = data;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/dashboard"
              className="text-primary hover:underline"
            >
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold">{taak.naam}</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold">Taak Details</h2>
            <div className="flex gap-2">
              <Link
                href={`/admin/dashboard/taken/${taak.id}/edit`}
                className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-hover transition-colors font-medium text-sm"
              >
                Bewerken
              </Link>
              <DeleteButton taakId={taak.id} taakNaam={taak.naam} aanmeldingenCount={taak.aanmeldingen.length} />
            </div>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Naam</dt>
              <dd className="mt-1">{taak.naam}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Categorie</dt>
              <dd className="mt-1">{taak.categorie || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Beschrijving</dt>
              <dd className="mt-1">{taak.beschrijving || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Bezetting</dt>
              <dd className="mt-1">
                {taak.aanmeldingen.length} / {taak.maxAantal}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Tijd</dt>
              <dd className="mt-1">{taak.tijd || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Locatie</dt>
              <dd className="mt-1">{taak.locatie || '-'}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Aanmeldingen ({taak.aanmeldingen.length})</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Naam
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefoon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aangemeld op
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opmerking
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {taak.aanmeldingen.map((aanmelding) => (
                  <tr key={aanmelding.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {aanmelding.naam}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {aanmelding.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {aanmelding.telefoon}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTimeNL(aanmelding.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {aanmelding.opmerking || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {taak.aanmeldingen.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nog geen aanmeldingen voor deze taak
              </div>
            )}
          </div>
        </div>

        {wachtlijst.length > 0 && (
          <div className="bg-white rounded-lg shadow mt-6">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Wachtlijst ({wachtlijst.length})</h2>
              <p className="text-sm text-gray-500 mt-1">
                Op volgorde van aanmelding. Komt er een plek vrij, dan wordt de bovenste automatisch
                ingedeeld en gemaild.
              </p>
            </div>
            <ol className="divide-y divide-gray-200">
              {wachtlijst.map((w, i) => (
                <li key={w.id} className="px-6 py-3 flex items-center gap-4 text-sm">
                  <span className="text-gray-400 w-6">{i + 1}.</span>
                  <span className="font-medium">{w.naam}</span>
                  <span className="text-gray-500">{w.email}</span>
                  <span className="text-gray-500">{w.telefoon}</span>
                  <span className="ml-auto text-gray-400">{formatDateTimeNL(w.createdAt)}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </main>
  );
}