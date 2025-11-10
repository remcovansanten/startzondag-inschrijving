import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import DeleteButton from './DeleteButton';
import BulkRegistrationActions from '@/components/BulkRegistrationActions';

export const dynamic = 'force-dynamic';

async function getTaakWithAanmeldingen(id: string) {
  const taak = await prisma.taak.findUnique({
    where: { id },
    include: {
      aanmeldingen: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  return taak;
}

export default async function TaakDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const taak = await getTaakWithAanmeldingen(id);

  if (!taak) {
    notFound();
  }

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
          </dl>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Aanmeldingen ({taak.aanmeldingen.length})</h2>
          </div>

          <div className="p-6">
            <BulkRegistrationActions registrations={taak.aanmeldingen} />
          </div>
        </div>
      </div>
    </main>
  );
}