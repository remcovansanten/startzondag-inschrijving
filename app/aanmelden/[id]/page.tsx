import { notFound } from 'next/navigation';
import Link from 'next/link';
import AanmeldForm from '@/components/AanmeldForm';
import { prisma } from '@/lib/db';

async function getTaak(id: string) {
  const taak = await prisma.taak.findUnique({
    where: { id },
    include: {
      _count: {
        select: { aanmeldingen: true }
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
            <p className="text-sm text-gray-500">
              {taak._count.aanmeldingen} van {taak.maxAantal} plekken bezet
            </p>
          </div>

          {isVol ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              Deze taak is helaas vol. Er kunnen geen nieuwe aanmeldingen meer worden geaccepteerd.
            </div>
          ) : (
            <AanmeldForm taakId={taak.id} taakNaam={taak.naam} />
          )}
        </div>
      </div>
    </main>
  );
}