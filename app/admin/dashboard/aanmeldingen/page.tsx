import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatDateTimeNL } from '@/lib/datetime';
import { STATUS, EMAIL_STATUS } from '@/lib/aanmelding';
import { Prisma } from '@/generated/prisma/client';
import AanmeldingActies from './AanmeldingActies';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, { label: string; klasse: string }> = {
  ACTIEF: { label: 'Actief', klasse: 'bg-green-100 text-green-800' },
  WACHTLIJST: { label: 'Wachtlijst', klasse: 'bg-amber-100 text-amber-800' },
  GEANNULEERD: { label: 'Geannuleerd', klasse: 'bg-gray-100 text-gray-500' },
};

export default async function AanmeldingenPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; taakId?: string; status?: string; emailStatus?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim();

  const where: Prisma.AanmeldingWhereInput = {};
  if (q) {
    where.OR = [
      { naam: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { telefoon: { contains: q } },
    ];
  }
  if (sp.taakId) where.taakId = sp.taakId;
  if (sp.status) where.status = sp.status;
  if (sp.emailStatus) where.emailStatus = sp.emailStatus;

  const [aanmeldingen, taken, teControleren] = await Promise.all([
    prisma.aanmelding.findMany({
      where,
      include: { taak: { select: { naam: true } } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    }),
    prisma.taak.findMany({ select: { id: true, naam: true }, orderBy: { naam: 'asc' } }),
    prisma.aanmelding.count({ where: { emailStatus: EMAIL_STATUS.CONTROLEREN, status: { not: STATUS.GEANNULEERD } } }),
  ]);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin/dashboard" className="text-primary hover:underline">← Dashboard</Link>
          <h1 className="text-2xl font-bold">Aanmeldingen</h1>
          <Link
            href="/admin/dashboard/aanmeldingen/nieuw"
            className="ml-auto bg-primary text-white px-4 py-2 rounded hover:bg-primary-hover text-sm font-medium"
          >
            + Handmatig toevoegen
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {teControleren > 0 && (
          <Link
            href="/admin/dashboard/aanmeldingen?emailStatus=CONTROLEREN"
            className="block mb-4 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded text-sm"
          >
            ⚠️ {teControleren} aanmelding(en) met een e-mailadres om te controleren — klik om te bekijken.
          </Link>
        )}

        <form method="get" className="bg-white rounded-lg shadow p-4 mb-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Zoek op naam, e-mail of telefoon"
            className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <select name="taakId" defaultValue={sp.taakId ?? ''} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="">Alle taken</option>
            {taken.map((t) => (
              <option key={t.id} value={t.id}>{t.naam}</option>
            ))}
          </select>
          <select name="status" defaultValue={sp.status ?? ''} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="">Alle statussen</option>
            <option value="ACTIEF">Actief</option>
            <option value="WACHTLIJST">Wachtlijst</option>
            <option value="GEANNULEERD">Geannuleerd</option>
          </select>
          <div className="flex gap-2">
            <select name="emailStatus" defaultValue={sp.emailStatus ?? ''} className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm">
              <option value="">Alle e-mail</option>
              <option value="CONTROLEREN">Te controleren</option>
              <option value="OK">OK</option>
              <option value="ONBEKEND">Onbekend</option>
            </select>
            <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded text-sm">Zoek</button>
          </div>
        </form>

        <p className="text-sm text-gray-500 mb-2">{aanmeldingen.length} resultaten</p>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Naam', 'E-mail', 'Telefoon', 'Taak', 'Status', 'Aangemeld', 'Notitie', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {aanmeldingen.map((a) => {
                const s = STATUS_LABEL[a.status] ?? { label: a.status, klasse: 'bg-gray-100' };
                return (
                  <tr key={a.id}>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{a.naam}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {a.email}
                      {a.emailStatus === EMAIL_STATUS.CONTROLEREN && (
                        <span className="ml-1 text-amber-600" title="E-mailadres controleren">⚠️</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{a.telefoon}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{a.taak.naam}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${s.klasse}`}>{s.label}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">{formatDateTimeNL(a.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate" title={a.adminNotitie ?? ''}>{a.adminNotitie ?? '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <AanmeldingActies id={a.id} naam={a.naam} status={a.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {aanmeldingen.length === 0 && (
            <div className="text-center py-8 text-gray-500">Geen aanmeldingen gevonden</div>
          )}
        </div>
      </div>
    </main>
  );
}
