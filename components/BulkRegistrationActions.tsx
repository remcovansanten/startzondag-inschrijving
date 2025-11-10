'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Registration {
  id: string;
  naam: string;
  email: string;
  telefoon: string;
  opmerking: string | null;
  createdAt: Date;
}

interface BulkRegistrationActionsProps {
  registrations: Registration[];
}

export default function BulkRegistrationActions({ registrations }: BulkRegistrationActionsProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const toggleSelectAll = () => {
    if (selected.size === registrations.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(registrations.map(r => r.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Weet je zeker dat je ${selected.size} ${selected.size === 1 ? 'aanmelding' : 'aanmeldingen'} wilt verwijderen?`)) {
      return;
    }

    setLoading(true);
    try {
      // Delete in parallel for better performance
      const deletePromises = Array.from(selected).map(id =>
        fetch(`/api/admin/aanmeldingen/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      const results = await Promise.all(deletePromises);

      // Check if any deletions failed
      const failedCount = results.filter(r => !r.ok).length;

      if (failedCount > 0) {
        alert(`${failedCount} aanmelding(en) konden niet worden verwijderd. De rest is succesvol verwijderd.`);
      } else {
        alert(`${selected.size} aanmelding(en) succesvol verwijderd.`);
      }

      setSelected(new Set());
      router.refresh();
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('Er is een fout opgetreden bij het verwijderen van aanmeldingen.');
    } finally {
      setLoading(false);
    }
  };

  if (registrations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nog geen aanmeldingen voor deze taak
      </div>
    );
  }

  return (
    <div>
      {selected.size > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">
            {selected.size} {selected.size === 1 ? 'aanmelding' : 'aanmeldingen'} geselecteerd
          </span>
          <button
            onClick={handleBulkDelete}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors font-medium text-sm"
          >
            {loading ? 'Verwijderen...' : 'Verwijder selectie'}
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selected.size === registrations.length && registrations.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
                  title="Selecteer alles"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Naam
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Telefoon
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aangemeld op
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Opmerking
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {registrations.map((aanmelding) => (
              <tr
                key={aanmelding.id}
                className={selected.has(aanmelding.id) ? 'bg-blue-50' : ''}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selected.has(aanmelding.id)}
                    onChange={() => toggleSelect(aanmelding.id)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  {aanmelding.naam}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {aanmelding.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {aanmelding.telefoon}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(aanmelding.createdAt).toLocaleDateString('nl-NL')}
                </td>
                <td className="px-6 py-4 text-sm">
                  {aanmelding.opmerking || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
