'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AanmeldingActies({ id, naam, status }: { id: string; naam: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Aanmelding van ${naam} annuleren? De plek komt vrij (en de eerste op de wachtlijst schuift door).`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/aanmeldingen/${id}`, { method: 'DELETE' });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert('Annuleren mislukt');
  };

  return (
    <div className="flex gap-3 whitespace-nowrap">
      <Link href={`/admin/dashboard/aanmeldingen/${id}/edit`} className="text-primary hover:underline">
        Bewerken
      </Link>
      {status !== 'GEANNULEERD' && (
        <button onClick={handleDelete} disabled={busy} className="text-red-600 hover:underline disabled:opacity-50">
          Annuleren
        </button>
      )}
    </div>
  );
}
