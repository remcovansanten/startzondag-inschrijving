import { notFound } from 'next/navigation';
import Link from 'next/link';
import AanmeldForm from '@/components/AanmeldForm';
import { prisma } from '@/lib/db';
import { ACTIEF_FILTER } from '@/lib/aanmelding';

async function getTaak(id: string) {
  const taak = await prisma.taak.findUnique({
    where: { id },
    include: {
      _count: {
        select: { aanmeldingen: { where: ACTIEF_FILTER } }
      }
    }
  });

  return taak;
}

export default async function AanmeldPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const taak = await getTaak(id);

  if (!taak) {
    notFound();
  }

  const isVol = taak._count.aanmeldingen >= taak.maxAantal;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link
          href="/"
          className="inline-flex items-center text-primary hover:underline mb-6"
        >
          ← Terug naar overzicht
        </Link>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4">Aanmelden voor taak</h1>
          
          <div className="mb-6 p-4 bg-gray-50 rounded">
            <h2 className="font-semibold text-lg mb-2">{taak.naam}</h2>
            {taak.beschrijving && (
              <p className="text-gray-600 mb-2">{taak.beschrijving}</p>
            )}
            {(taak.tijd || taak.locatie) && (
              <p className="text-sm text-gray-600 mb-2">
                {taak.tijd && <span>🕒 {taak.tijd}</span>}
                {taak.tijd && taak.locatie && <span> · </span>}
                {taak.locatie && <span>📍 {taak.locatie}</span>}
              </p>
            )}
            <p className="text-sm text-gray-500">
              {taak._count.aanmeldingen} van {taak.maxAantal} plekken bezet
            </p>
          </div>

          {isVol && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded mb-4">
              Deze taak is vol. Je kunt je wel op de <strong>wachtlijst</strong> zetten — komt er een
              plek vrij, dan laten we het je weten.
            </div>
          )}
          <AanmeldForm taakId={taak.id} taakNaam={taak.naam} isVol={isVol} />
        </div>
      </div>
    </main>
  );
}