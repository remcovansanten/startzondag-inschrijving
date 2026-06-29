import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import AanmeldingBeheerForm from '@/components/AanmeldingBeheerForm';

export const dynamic = 'force-dynamic';

export default async function EditAanmeldingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await prisma.aanmelding.findUnique({
    where: { id },
    include: { taak: { select: { naam: true } } },
  });
  if (!a) notFound();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin/dashboard/aanmeldingen" className="text-primary hover:underline">← Aanmeldingen</Link>
          <h1 className="text-2xl font-bold">Aanmelding bewerken</h1>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-lg shadow p-6">
          <AanmeldingBeheerForm
            bestaand={{
              id: a.id,
              naam: a.naam,
              email: a.email,
              telefoon: a.telefoon,
              opmerking: a.opmerking,
              adminNotitie: a.adminNotitie,
              taakNaam: a.taak.naam,
            }}
          />
        </div>
      </div>
    </main>
  );
}
