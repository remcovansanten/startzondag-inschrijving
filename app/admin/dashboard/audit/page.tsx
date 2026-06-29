import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatDateTimeNL } from '@/lib/datetime';

export const dynamic = 'force-dynamic';

const ACTIE_LABEL: Record<string, string> = {
  'taak.aangemaakt': 'Taak aangemaakt',
  'taak.bewerkt': 'Taak bewerkt',
  'taak.verwijderd': 'Taak verwijderd',
  'aanmelding.handmatig-toegevoegd': 'Aanmelding toegevoegd',
  'aanmelding.bewerkt': 'Aanmelding bewerkt',
  'aanmelding.geannuleerd': 'Aanmelding geannuleerd',
};

export default async function AuditPage() {
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin/dashboard" className="text-primary hover:underline">← Dashboard</Link>
          <h1 className="text-2xl font-bold">Logboek beheeracties</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <p className="text-sm text-gray-500 mb-2">Laatste {logs.length} acties</p>
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Wanneer', 'Actie', 'Door', 'Details'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">{formatDateTimeNL(l.createdAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium">{ACTIE_LABEL[l.action] ?? l.action}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600">{l.actorEmail}</td>
                  <td className="px-4 py-3 text-gray-600">{l.details ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && <div className="text-center py-8 text-gray-500">Nog geen acties gelogd</div>}
        </div>
      </div>
    </main>
  );
}
