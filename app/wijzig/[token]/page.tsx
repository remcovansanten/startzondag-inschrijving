import { notFound } from 'next/navigation';
import Link from 'next/link';
import WijzigForm from './WijzigForm';
import { prisma } from '@/lib/db';

async function getAanmelding(token: string) {
  const aanmelding = await prisma.aanmelding.findUnique({
    where: { token },
    include: {
      taak: true
    }
  });

  return aanmelding;
}

export default async function WijzigPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const aanmelding = await getAanmelding(token);

  if (!aanmelding) {
    notFound();
  }

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
          <h1 className="text-2xl font-bold mb-4">Aanmelding wijzigen of annuleren</h1>
          
          <div className="mb-6 p-4 bg-gray-50 rounded">
            <h2 className="font-semibold text-lg mb-2">Taak: {aanmelding.taak.naam}</h2>
            <p className="text-sm text-gray-600">
              Aangemeld op: {new Date(aanmelding.createdAt).toLocaleDateString('nl-NL')}
            </p>
          </div>

          <WijzigForm aanmelding={aanmelding} />
        </div>
      </div>
    </main>
  );
}