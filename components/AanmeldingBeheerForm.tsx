'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Taak {
  id: string;
  naam: string;
}

interface Bestaand {
  id: string;
  naam: string;
  email: string;
  telefoon: string;
  opmerking: string | null;
  adminNotitie: string | null;
  taakNaam: string;
}

export default function AanmeldingBeheerForm({ taken, bestaand }: { taken?: Taak[]; bestaand?: Bestaand }) {
  const router = useRouter();
  const isEdit = !!bestaand;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    taakId: '',
    naam: bestaand?.naam ?? '',
    email: bestaand?.email ?? '',
    telefoon: bestaand?.telefoon ?? '',
    opmerking: bestaand?.opmerking ?? '',
    adminNotitie: bestaand?.adminNotitie ?? '',
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const url = isEdit ? `/api/admin/aanmeldingen/${bestaand!.id}` : '/api/admin/aanmeldingen';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Er ging iets mis');
      router.push('/admin/dashboard/aanmeldingen');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary';

  return (
    <form onSubmit={submit} className="space-y-4">
      {isEdit ? (
        <div>
          <span className="block text-sm font-medium text-gray-700 mb-1">Taak</span>
          <p className="px-3 py-2 bg-gray-50 rounded-md text-gray-700">{bestaand!.taakNaam}</p>
        </div>
      ) : (
        <div>
          <label htmlFor="taakId" className="block text-sm font-medium text-gray-700 mb-1">Taak *</label>
          <select id="taakId" required value={form.taakId} onChange={(e) => set('taakId', e.target.value)} className={inputCls}>
            <option value="">Kies een taak</option>
            {(taken ?? []).map((t) => (
              <option key={t.id} value={t.id}>{t.naam}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="naam" className="block text-sm font-medium text-gray-700 mb-1">Naam *</label>
        <input id="naam" required value={form.naam} onChange={(e) => set('naam', e.target.value)} className={inputCls} />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
        <input id="email" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} className={inputCls} />
      </div>
      <div>
        <label htmlFor="telefoon" className="block text-sm font-medium text-gray-700 mb-1">Telefoon *</label>
        <input id="telefoon" required value={form.telefoon} onChange={(e) => set('telefoon', e.target.value)} className={inputCls} />
      </div>
      <div>
        <label htmlFor="opmerking" className="block text-sm font-medium text-gray-700 mb-1">Opmerking</label>
        <textarea id="opmerking" rows={2} value={form.opmerking} onChange={(e) => set('opmerking', e.target.value)} className={inputCls} />
      </div>
      <div>
        <label htmlFor="adminNotitie" className="block text-sm font-medium text-gray-700 mb-1">
          Notitie (alleen voor beheerders, ook in Excel)
        </label>
        <textarea id="adminNotitie" rows={2} value={form.adminNotitie} onChange={(e) => set('adminNotitie', e.target.value)} className={inputCls} placeholder='bijv. "zet erg vieze koffie ;-)"' />
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="bg-primary text-white py-2 px-4 rounded hover:bg-primary-hover disabled:opacity-50 font-medium">
          {loading ? 'Bezig...' : isEdit ? 'Opslaan' : 'Toevoegen + bevestiging mailen'}
        </button>
        <button type="button" onClick={() => router.back()} className="py-2 px-4 rounded border border-gray-300">Annuleren</button>
      </div>
    </form>
  );
}
