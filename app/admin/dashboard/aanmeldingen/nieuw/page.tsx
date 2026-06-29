import Link from 'next/link';
import { prisma } from '@/lib/db';
import AanmeldingBeheerForm from '@/components/AanmeldingBeheerForm';

export const dynamic = 'force-dynamic';

export default async function NieuweAanmeldingPage() {
  const taken = await prisma.taak.findMany({ select: { id: true, naam: true }, orderBy: { naam: 'asc' } });

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin/dashboard/aanmeldingen" className="text-primary hover:underline">← Aanmeldingen</Link>
          <h1 className="text-2xl font-bold">Handmatig toevoegen</h1>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-4">
            De persoon krijgt automatisch een bevestigingsmail met een wijzig-/annuleer-link.
          </p>
          <AanmeldingBeheerForm taken={taken} />
        </div>
      </div>
    </main>
  );
}
