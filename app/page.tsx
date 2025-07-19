import Link from 'next/link';
import TaakCard from '@/components/TaakCard';
import { prisma } from '@/lib/db';

async function getTaken() {
  const taken = await prisma.taak.findMany({
    include: {
      _count: {
        select: { aanmeldingen: true }
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
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-2">Vrijwilligersacties</h1>
        <p className="text-center text-gray-600 mb-8">
          Meld je aan voor een taak en help mee!
        </p>

        {Object.entries(takenByCategory).map(([category, categoryTaken]) => (
          <div key={category} className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryTaken.map((taak) => (
                <TaakCard key={taak.id} taak={taak} />
              ))}
            </div>
          </div>
        ))}

        {taken.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Er zijn momenteel geen taken beschikbaar.</p>
          </div>
        )}
      </div>

      <footer className="bg-gray-100 mt-16">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-gray-600">
          <Link href="/admin/login" className="hover:underline">
            Admin
          </Link>
        </div>
      </footer>
    </main>
  );
}