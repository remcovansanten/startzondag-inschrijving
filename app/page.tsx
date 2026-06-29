import Link from 'next/link';
import TaakCard from '@/components/TaakCard';
import { prisma } from '@/lib/db';
import { EVENT_NAME } from '@/lib/event';
import { ACTIEF_FILTER } from '@/lib/aanmelding';

export const dynamic = 'force-dynamic';

async function getTaken() {
  const taken = await prisma.taak.findMany({
    include: {
      _count: {
        select: { aanmeldingen: { where: ACTIEF_FILTER } }
      }
    },
    orderBy: [
      { categorie: 'asc' },
      { naam: 'asc' }
    ]
  });

  return taken;
}

export default async function Home() {
  const taken = await getTaken();
  
  const takenByCategory = taken.reduce((acc, taak) => {
    const category = taak.categorie || 'Overig';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(taak);
    return acc;
  }, {} as Record<string, typeof taken>);

  return (
    <main className="min-h-screen bg-white">
      {/* Header with logo */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center space-x-4">
            <img src="/logo-gke.png" alt="Gereformeerde Kerk Ermelo" className="h-16 w-auto" />
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-text-dark">Gereformeerde Kerk Ermelo</h1>
              <p className="text-sm text-text-muted">{EVENT_NAME}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2 text-text-dark">Vrijwilligers gezocht!</h2>
          <p className="text-lg text-text-muted">
            Help mee om de Startzondag tot een succes te maken
          </p>
        </div>

        {Object.entries(takenByCategory).map(([category, categoryTaken]) => (
          <div key={category} className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-text-dark">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryTaken.map((taak) => (
                <TaakCard key={taak.id} taak={taak} />
              ))}
            </div>
          </div>
        ))}

        {taken.length === 0 && (
          <div className="text-center py-12">
            <p className="text-text-muted">Er zijn momenteel geen taken beschikbaar.</p>
          </div>
        )}
      </div>

      <footer className="bg-secondary mt-16">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-text-muted">
          <Link href="/admin/login" className="hover:underline">
            Admin
          </Link>
        </div>
      </footer>
    </main>
  );
}